import "dotenv/config";

function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  databaseUrl: required("DATABASE_URL"),
  // comma-separated list so both the prod Vercel domain and local dev can be allowed at once
  corsOrigins: (process.env.CORS_ORIGIN ?? "http://localhost:5173").split(",").map((s) => s.trim()),
  jwt: {
    accessSecret: required("JWT_ACCESS_SECRET"),
    refreshSecret: required("JWT_REFRESH_SECRET"),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
  },
  smtp: {
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT ?? 465),
    user: process.env.SMTP_USER ?? "",
    pass: process.env.SMTP_PASS ?? "",
    from: process.env.SMTP_FROM ?? "NuzulJO <no-reply@nuzuljo.local>",
  },
};
