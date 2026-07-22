import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env";

export const app = express();

app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

export default app;
