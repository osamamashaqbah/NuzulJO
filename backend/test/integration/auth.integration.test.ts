import request from "supertest";
import { app } from "../../src/app";
import { prisma, resetDb } from "../db";

describe("POST /api/auth/register", () => {
  afterEach(() => resetDb());
  afterAll(() => prisma.$disconnect());

  it("registers a new user and returns 201 with an access token and no passwordHash", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Alice", email: "alice@nuzuljo.test", password: "password123", role: "CUSTOMER" });

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.user.email).toBe("alice@nuzuljo.test");
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it("rejects a duplicate email with 409", async () => {
    await request(app).post("/api/auth/register").send({ name: "Alice", email: "dup@nuzuljo.test", password: "password123" });
    const res = await request(app).post("/api/auth/register").send({ name: "Alice2", email: "dup@nuzuljo.test", password: "password123" });
    expect(res.status).toBe(409);
  });
});

describe("POST /api/auth/login", () => {
  afterEach(() => resetDb());
  afterAll(() => prisma.$disconnect());

  it("logs in with correct credentials", async () => {
    await request(app).post("/api/auth/register").send({ name: "Bob", email: "bob@nuzuljo.test", password: "password123" });
    const res = await request(app).post("/api/auth/login").send({ email: "bob@nuzuljo.test", password: "password123" });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
  });

  it("rejects an incorrect password with 401", async () => {
    await request(app).post("/api/auth/register").send({ name: "Bob", email: "bob2@nuzuljo.test", password: "password123" });
    const res = await request(app).post("/api/auth/login").send({ email: "bob2@nuzuljo.test", password: "wrong" });
    expect(res.status).toBe(401);
  });
});

describe("GET /api/auth/me", () => {
  afterEach(() => resetDb());
  afterAll(() => prisma.$disconnect());

  it("rejects with 401 when no token is provided", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns the current user's profile for a valid token", async () => {
    const reg = await request(app).post("/api/auth/register").send({ name: "Carol", email: "carol@nuzuljo.test", password: "password123" });
    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${reg.body.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe("carol@nuzuljo.test");
  });
});

describe("POST /api/auth/refresh (rotation)", () => {
  afterEach(() => resetDb());
  afterAll(() => prisma.$disconnect());

  it("rejects with 401 when no refresh cookie is present", async () => {
    const res = await request(app).post("/api/auth/refresh");
    expect(res.status).toBe(401);
  });

  it("issues a new access token when a valid refresh cookie is presented", async () => {
    const reg = await request(app).post("/api/auth/register").send({ name: "Dana", email: "dana@nuzuljo.test", password: "password123" });
    const cookie = reg.headers["set-cookie"];
    const res = await request(app).post("/api/auth/refresh").set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
  });

  // Regression test: the refresh token used to crash the server with a 500 (Prisma "record
  // not found" on a concurrent delete) instead of cleanly rejecting the second use. Fixed by
  // switching delete -> deleteMany + count check in authController.refresh().
  it("rejects reuse of an already-rotated refresh token with 401, not 500", async () => {
    const reg = await request(app).post("/api/auth/register").send({ name: "Eve", email: "eve@nuzuljo.test", password: "password123" });
    const cookie = reg.headers["set-cookie"];

    const first = await request(app).post("/api/auth/refresh").set("Cookie", cookie);
    expect(first.status).toBe(200);

    const secondReuse = await request(app).post("/api/auth/refresh").set("Cookie", cookie);
    expect(secondReuse.status).toBe(401);
  });
});

describe("POST /api/auth/logout", () => {
  afterEach(() => resetDb());
  afterAll(() => prisma.$disconnect());

  it("revokes the refresh token so it can no longer be used", async () => {
    const reg = await request(app).post("/api/auth/register").send({ name: "Frank", email: "frank@nuzuljo.test", password: "password123" });
    const cookie = reg.headers["set-cookie"];

    await request(app).post("/api/auth/logout").set("Cookie", cookie);
    const res = await request(app).post("/api/auth/refresh").set("Cookie", cookie);
    expect(res.status).toBe(401);
  });
});
