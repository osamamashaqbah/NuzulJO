import { Router } from "express";
import rateLimit from "express-rate-limit";
import { register, login, refresh, logout, me } from "../controllers/authController";
import { requireAuth } from "../middleware/auth";

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });

export const authRoutes = Router();

authRoutes.post("/register", authLimiter, register);
authRoutes.post("/login", authLimiter, login);
authRoutes.post("/refresh", authLimiter, refresh);
authRoutes.post("/logout", logout);
authRoutes.get("/me", requireAuth, me);
