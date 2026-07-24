import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "node:path";
import { env } from "./config/env";
import { authRoutes } from "./routes/authRoutes";
import { hotelRoutes } from "./routes/hotelRoutes";
import { roomRoutes } from "./routes/roomRoutes";

export const app = express();

app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/hotels", hotelRoutes);
app.use("/api/rooms", roomRoutes);

export default app;
