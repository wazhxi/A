import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { lobbyRouter } from "./routes/lobby";
import { stakesRouter } from "./routes/stakes";
import { healthRouter } from "./routes/health";
import { handsRouter } from "./routes/hands";

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());

app.use("/api/health", healthRouter);
app.use("/api/lobby", lobbyRouter);
app.use("/api/stakes", stakesRouter);
app.use("/api/hands", handsRouter);

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`AI Poker Arena backend listening on port ${port}`);
});
