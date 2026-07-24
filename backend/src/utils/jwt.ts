import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { Role } from "@prisma/client";

export interface AccessTokenPayload {
  userId: string;
  role: Role;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.jwt.accessSecret, { expiresIn: env.jwt.accessExpiresIn as jwt.SignOptions["expiresIn"] });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.jwt.accessSecret, { algorithms: ["HS256"] }) as AccessTokenPayload;
}

export function signRefreshToken(jti: string): string {
  return jwt.sign({ jti }, env.jwt.refreshSecret, { expiresIn: env.jwt.refreshExpiresIn as jwt.SignOptions["expiresIn"] });
}

export function verifyRefreshToken(token: string): { jti: string } {
  return jwt.verify(token, env.jwt.refreshSecret, { algorithms: ["HS256"] }) as { jti: string };
}
