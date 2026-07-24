import request from "supertest";
import { app } from "../../src/app";
import { prisma, resetDb } from "../db";
import { registerAndLogin, authHeader } from "../helpers";

async function makeAdmin() {
  const admin = await registerAndLogin("CUSTOMER");
  await prisma.user.update({ where: { id: admin.user.id }, data: { role: "ADMIN" } });
  // role changed in DB but the already-issued JWT still carries the old role, so log in again
  const relogged = await request(app).post("/api/auth/login").send({ email: admin.user.email, password: "password123" });
  return relogged.body.accessToken as string;
}

describe("admin API", () => {
  afterEach(() => resetDb());
  afterAll(() => prisma.$disconnect());

  it("rejects unauthenticated access with 401", async () => {
    const res = await request(app).get("/api/admin/users");
    expect(res.status).toBe(401);
  });

  it("rejects a CUSTOMER with 403", async () => {
    const customer = await registerAndLogin("CUSTOMER");
    const res = await request(app).get("/api/admin/users").set(authHeader(customer.accessToken));
    expect(res.status).toBe(403);
  });

  it("rejects a HOTEL_OWNER with 403", async () => {
    const owner = await registerAndLogin("HOTEL_OWNER");
    const res = await request(app).get("/api/admin/reports").set(authHeader(owner.accessToken));
    expect(res.status).toBe(403);
  });

  it("PATCH /users/:id/role actually updates the role in the database", async () => {
    const adminToken = await makeAdmin();
    const target = await registerAndLogin("CUSTOMER");

    const res = await request(app).patch(`/api/admin/users/${target.user.id}/role`).set(authHeader(adminToken)).send({ role: "HOTEL_OWNER" });
    expect(res.status).toBe(200);

    const updated = await prisma.user.findUniqueOrThrow({ where: { id: target.user.id } });
    expect(updated.role).toBe("HOTEL_OWNER");
  });

  it("deactivating a hotel hides it from the public list but keeps it in the admin list", async () => {
    const adminToken = await makeAdmin();
    const owner = await registerAndLogin("HOTEL_OWNER");
    const hotel = await request(app).post("/api/hotels").set(authHeader(owner.accessToken)).send({ name: "Toggle Hotel" });

    await request(app).patch(`/api/admin/hotels/${hotel.body.id}/active`).set(authHeader(adminToken)).send({ isActive: false });

    const publicList = await request(app).get("/api/hotels");
    expect(publicList.body.map((h: { id: string }) => h.id)).not.toContain(hotel.body.id);

    const adminList = await request(app).get("/api/admin/hotels").set(authHeader(adminToken));
    expect(adminList.body.map((h: { id: string }) => h.id)).toContain(hotel.body.id);
  });

  it("GET /reports returns counts that match what's actually in the database", async () => {
    const adminToken = await makeAdmin();
    await registerAndLogin("CUSTOMER");
    await registerAndLogin("HOTEL_OWNER");

    const res = await request(app).get("/api/admin/reports").set(authHeader(adminToken));
    const actualUserCount = await prisma.user.count();
    expect(res.body.userCount).toBe(actualUserCount);
  });
});
