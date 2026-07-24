import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import path from "node:path";
import { env } from "./config/env";
import { authRoutes } from "./routes/authRoutes";
import { hotelRoutes } from "./routes/hotelRoutes";
import { roomRoutes } from "./routes/roomRoutes";
import { bookingRoutes } from "./routes/bookingRoutes";
import { adminRoutes } from "./routes/adminRoutes";
import { errorHandler } from "./middleware/errorHandler";

export const app = express();

// crossOriginResourcePolicy relaxed to "cross-origin": the frontend (different origin/port)
// loads uploaded hotel/room images via <img src> from /uploads, which helmet's default
// same-origin policy would otherwise block.
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
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
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);

app.use((_req, res) => res.status(404).json({ error: "Not found" }));
app.use(errorHandler);

export default app;
