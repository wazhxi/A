import { createHash, randomBytes } from "crypto";
import { createPublicClient, createWalletClient, decodeEventLog, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrum } from "viem/chains";

const rpcUrl = process.env.ARBITRUM_RPC_URL;
const rngAddress = process.env.RNG_CONTRACT_ADDRESS as `0x${string}` | undefined;
const orchestratorKey = process.env.RNG_ORCHESTRATOR_KEY;

const rngAbi = [
  {
    type: "function",
    name: "requestShuffle",
    stateMutability: "nonpayable",
    inputs: [{ name: "handId", type: "uint256" }],
    outputs: [{ name: "requestId", type: "bytes32" }]
  },
  {
    type: "event",
    name: "ShuffleReady",
    inputs: [
      { name: "handId", type: "uint256", indexed: true },
      { name: "requestId", type: "bytes32", indexed: true },
      { name: "randomness", type: "uint256", indexed: false }
    ]
  }
] as const;

const publicClient = rpcUrl && rngAddress
  ? createPublicClient({ chain: arbitrum, transport: http(rpcUrl) })
  : null;

const walletClient = rpcUrl && rngAddress && orchestratorKey
  ? createWalletClient({
      chain: arbitrum,
      account: privateKeyToAccount(orchestratorKey as `0x${string}`),
      transport: http(rpcUrl)
    })
  : null;

async function requestOnChainRandomness(handId: number): Promise<bigint | null> {
  if (!publicClient || !walletClient || !rngAddress) return null;
  const account = walletClient.account;
  const simulation = await publicClient.simulateContract({
    account,
    abi: rngAbi,
    address: rngAddress,
    functionName: "requestShuffle",
    args: [BigInt(handId)]
  });
  const txHash = await walletClient.writeContract(simulation.request);
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  const requestId = simulation.result as `0x${string}`;

  const timeoutMs = Number(process.env.RNG_TIMEOUT_MS ?? 5000);
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const events = await publicClient.getLogs({
      address: rngAddress,
      event: rngAbi[1],
      fromBlock: receipt.blockNumber
    });
    const match = events
      .map((log) => decodeEventLog({ abi: rngAbi, data: log.data, topics: log.topics }))
      .find((ev) => ev.eventName === "ShuffleReady" && (ev.args as any).requestId === requestId);
    if (match) {
      const args = match.args as unknown as { randomness: bigint };
      return args.randomness;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return null;
}

export async function getRandomness(handId: number): Promise<bigint> {
  try {
    const onChain = await requestOnChainRandomness(handId);
    if (onChain) return onChain;
  } catch (err) {
    // ignore and fall back
  }
  const buf = randomBytes(32);
  return BigInt(`0x${buf.toString("hex")}`);
}

export function deriveSeed(randomness: bigint) {
  const hash = createHash("sha256").update(randomness.toString()).digest("hex");
  return BigInt(`0x${hash}`);
}
