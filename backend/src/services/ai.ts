import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

export type Action = "fold" | "check" | "call" | "bet" | "raise";

export interface AIDecisionInput {
  handId: number;
  street: "preflop" | "flop" | "turn" | "river";
  seat: string;
  stack: number;
  pot: number;
  board: string[];
  hole: [string, string];
  style: string;
}

export interface AIDecision {
  action: Action;
  amount: number;
  reasoning: string;
  provider: "openai" | "anthropic" | "simulated";
}

const openaiKey = process.env.OPENAI_API_KEY;
const anthropicKey = process.env.ANTHROPIC_API_KEY;

const openaiClient = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;
const anthropicClient = anthropicKey ? new Anthropic({ apiKey: anthropicKey }) : null;

function buildPrompt(input: AIDecisionInput) {
  return `You are an expert No-Limit Texas Hold'em bot. Return a short JSON with fields action, amount, reasoning.\n` +
    `Rules: valid actions are fold, check, call, bet, raise. bet/raise amount is in USD tokens, <= current stack, numeric.\n` +
    `Keep reasoning concise (<=120 chars). Avoid markdown or code fences.\n` +
    `Context: hand ${input.handId}, street ${input.street}, seat ${input.seat}, stack ${input.stack}, pot ${input.pot}.\n` +
    `Board: ${input.board.join(" ") || "[preflop]"}. Hole: ${input.hole.join(" ")}. Persona: ${input.style}.`;
}

function safeAmount(raw: unknown, stack: number) {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return Math.max(0, Math.min(raw, stack));
  }
  return 0;
}

function safeAction(raw: unknown): Action {
  if (raw === "fold" || raw === "check" || raw === "call" || raw === "bet" || raw === "raise") {
    return raw;
  }
  return "check";
}

function parseDecision(jsonText: string, stack: number) {
  try {
    const parsed = JSON.parse(jsonText);
    return {
      action: safeAction(parsed.action),
      amount: safeAmount(parsed.amount, stack),
      reasoning: typeof parsed.reasoning === "string" ? parsed.reasoning : "Playing balanced."
    };
  } catch (err) {
    return null;
  }
}

async function callOpenAI(input: AIDecisionInput) {
  if (!openaiClient) return null;
  const response = await openaiClient.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    messages: [
      { role: "system", content: "Respond with JSON only" },
      { role: "user", content: buildPrompt(input) }
    ],
    max_tokens: 120
  });

  const rawContent = response.choices[0]?.message?.content;
  const text = Array.isArray(rawContent)
    ? rawContent.map((part) => (typeof part === "string" ? part : part?.text ?? "")).join("")
    : rawContent;
  if (!text || typeof text !== "string") return null;
  const parsed = parseDecision(text.trim(), input.stack);
  return parsed && { ...parsed, provider: "openai" as const };
}

async function callAnthropic(input: AIDecisionInput) {
  if (!anthropicClient) return null;
  const response = await anthropicClient.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? "claude-3-haiku-20240307",
    max_tokens: 150,
    system: "Return concise JSON with action, amount, reasoning.",
    messages: [
      { role: "user", content: buildPrompt(input) }
    ]
  });
  const text = response.content[0]?.type === "text" ? response.content[0].text : undefined;
  if (!text) return null;
  const parsed = parseDecision(text.trim(), input.stack);
  return parsed && { ...parsed, provider: "anthropic" as const };
}

function simulatedDecision(input: AIDecisionInput): AIDecision {
  const baseline = input.stack <= 1 ? "check" : "call";
  const action: Action = input.street === "river" ? "bet" : baseline;
  const amount = action === "bet" ? Math.min(2, input.stack) : action === "call" ? Math.min(1, input.stack) : 0;
  return {
    action,
    amount,
    reasoning: `${input.style} move with ${input.hole.join("/")}.`,
    provider: "simulated"
  };
}

export async function getAIDecision(input: AIDecisionInput): Promise<AIDecision> {
  const providers = [callOpenAI, callAnthropic];
  for (const provider of providers) {
    try {
      const decision = await provider(input as AIDecisionInput);
      if (decision) return decision;
    } catch (err) {
      // continue to next provider
    }
  }
  return simulatedDecision(input);
}
