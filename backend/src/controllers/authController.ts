import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";
import type { AuthedRequest } from "../middleware/auth";

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // ponytail: fixed 7d, add duration parsing if JWT_REFRESH_EXPIRES_IN needs to vary

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  role: z.enum(["CUSTOMER", "HOTEL_OWNER"]).default("CUSTOMER"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const REFRESH_COOKIE = "refresh_token";
const cookieOpts = {
  httpOnly: true,
  secure: env.nodeEnv === "production",
  sameSite: "lax" as const,
  path: "/api/auth",
  maxAge: REFRESH_TOKEN_TTL_MS,
};

async function issueTokens(res: Response, userId: string, role: "CUSTOMER" | "HOTEL_OWNER" | "ADMIN") {
  const accessToken = signAccessToken({ userId, role });
  const jti = randomUUID();
  await prisma.refreshToken.create({
    data: { token: jti, userId, expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS) },
  });
  res.cookie(REFRESH_COOKIE, signRefreshToken(jti), cookieOpts);
  return accessToken;
}

export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { name, email, password, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: "Email already registered" });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({ data: { name, email, passwordHash, role } });

  const accessToken = await issueTokens(res, user.id, user.role);
  res.status(201).json({ accessToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    console.warn(`[security] failed login attempt for email=${email}`);
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const accessToken = await issueTokens(res, user.id, user.role);
  res.json({ accessToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
  if (!token) return res.status(401).json({ error: "Missing refresh token" });

  let jti: string;
  try {
    ({ jti } = verifyRefreshToken(token));
  } catch {
    return res.status(401).json({ error: "Invalid refresh token" });
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token: jti } });
  if (!stored || stored.expiresAt < new Date()) {
    return res.status(401).json({ error: "Refresh token expired or revoked" });
  }

  // rotate: delete old, issue new. deleteMany (not delete) so a concurrent duplicate
  // request racing the same token doesn't crash on "record not found" — it just no-ops.
  const { count } = await prisma.refreshToken.deleteMany({ where: { token: jti } });
  if (count === 0) return res.status(401).json({ error: "Refresh token already used" });

  const user = await prisma.user.findUnique({ where: { id: stored.userId } });
  if (!user) return res.status(401).json({ error: "User not found" });

  const accessToken = await issueTokens(res, user.id, user.role);
  res.json({ accessToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}

export async function logout(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
  if (token) {
    try {
      const { jti } = verifyRefreshToken(token);
      await prisma.refreshToken.deleteMany({ where: { token: jti } });
    } catch {
      // already invalid, nothing to revoke
    }
  }
  res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
  res.status(204).send();
}

export async function me(req: AuthedRequest, res: Response) {
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone });
}
