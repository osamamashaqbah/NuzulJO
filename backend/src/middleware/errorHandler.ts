import type { NextFunction, Request, Response } from "express";

// Catch-all error handler: never leaks stack traces or internal details to the client,
// regardless of NODE_ENV (Express's own default handler does depend on that env var being
// set correctly at deploy time — this removes that single point of misconfiguration).
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);
  if (res.headersSent) return;
  res.status(500).json({ error: "Internal server error" });
}
