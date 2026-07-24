import request from "supertest";
import { app } from "../src/app";
import type { Role } from "@prisma/client";

let counter = 0;

export async function registerAndLogin(role: Extract<Role, "CUSTOMER" | "HOTEL_OWNER"> = "CUSTOMER") {
  counter += 1;
  const email = `test-user-${Date.now()}-${counter}@nuzuljo.test`;
  const res = await request(app)
    .post("/api/auth/register")
    .send({ name: `Test ${role}`, email, password: "password123", role });

  return {
    accessToken: res.body.accessToken as string,
    user: res.body.user as { id: string; email: string; role: Role },
    cookie: res.headers["set-cookie"] as unknown as string[],
  };
}

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}
