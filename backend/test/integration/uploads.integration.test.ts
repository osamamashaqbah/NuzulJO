import request from "supertest";
import { app } from "../../src/app";
import { prisma, resetDb } from "../db";
import { registerAndLogin, authHeader } from "../helpers";

// 1x1 transparent PNG, valid enough for sharp to process.
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

describe("image uploads", () => {
  afterEach(() => resetDb());
  afterAll(() => prisma.$disconnect());

  it("uploads hotel images up to the 8-image limit, then rejects going over", async () => {
    const owner = await registerAndLogin("HOTEL_OWNER");
    const hotel = await request(app).post("/api/hotels").set(authHeader(owner.accessToken)).send({ name: "Upload Hotel" });

    const first = await request(app)
      .post(`/api/hotels/${hotel.body.id}/images`)
      .set(authHeader(owner.accessToken))
      .attach("images", TINY_PNG, "a.png")
      .attach("images", TINY_PNG, "b.png");
    expect(first.status).toBe(201);
    expect(first.body).toHaveLength(2);

    // fill up to 8 total (2 already uploaded, need 6 more, then 1 over)
    for (let i = 0; i < 6; i++) {
      await request(app).post(`/api/hotels/${hotel.body.id}/images`).set(authHeader(owner.accessToken)).attach("images", TINY_PNG, `c${i}.png`);
    }
    const count = await prisma.hotelImage.count({ where: { hotelId: hotel.body.id } });
    expect(count).toBe(8);

    const overLimit = await request(app).post(`/api/hotels/${hotel.body.id}/images`).set(authHeader(owner.accessToken)).attach("images", TINY_PNG, "over.png");
    expect(overLimit.status).toBe(400);
  });

  it("uploads room images up to the 5-image limit, then rejects going over", async () => {
    const owner = await registerAndLogin("HOTEL_OWNER");
    const hotel = await request(app).post("/api/hotels").set(authHeader(owner.accessToken)).send({ name: "Room Upload Hotel" });
    const room = await request(app)
      .post(`/api/hotels/${hotel.body.id}/rooms`)
      .set(authHeader(owner.accessToken))
      .send({ type: "SUITE", pricePerNight: 90, capacity: 3 });

    const upload = await request(app)
      .post(`/api/rooms/${room.body.id}/images`)
      .set(authHeader(owner.accessToken))
      .attach("images", TINY_PNG, "1.png")
      .attach("images", TINY_PNG, "2.png")
      .attach("images", TINY_PNG, "3.png")
      .attach("images", TINY_PNG, "4.png")
      .attach("images", TINY_PNG, "5.png");
    expect(upload.status).toBe(201);

    const overLimit = await request(app).post(`/api/rooms/${room.body.id}/images`).set(authHeader(owner.accessToken)).attach("images", TINY_PNG, "6.png");
    expect(overLimit.status).toBe(400);
  });
});

describe("admin delete endpoints", () => {
  afterEach(() => resetDb());
  afterAll(() => prisma.$disconnect());

  async function makeAdmin() {
    const admin = await registerAndLogin("CUSTOMER");
    await prisma.user.update({ where: { id: admin.user.id }, data: { role: "ADMIN" } });
    const relogged = await request(app).post("/api/auth/login").send({ email: admin.user.email, password: "password123" });
    return relogged.body.accessToken as string;
  }

  it("DELETE /users/:id removes the user from the database", async () => {
    const adminToken = await makeAdmin();
    const target = await registerAndLogin("CUSTOMER");

    const res = await request(app).delete(`/api/admin/users/${target.user.id}`).set(authHeader(adminToken));
    expect(res.status).toBe(204);

    const found = await prisma.user.findUnique({ where: { id: target.user.id } });
    expect(found).toBeNull();
  });

  it("DELETE /hotels/:id removes a hotel entirely", async () => {
    const adminToken = await makeAdmin();
    const owner = await registerAndLogin("HOTEL_OWNER");
    const hotel = await request(app).post("/api/hotels").set(authHeader(owner.accessToken)).send({ name: "Doomed Hotel" });

    const res = await request(app).delete(`/api/admin/hotels/${hotel.body.id}`).set(authHeader(adminToken));
    expect(res.status).toBe(204);

    const found = await prisma.hotel.findUnique({ where: { id: hotel.body.id } });
    expect(found).toBeNull();
  });

  it("DELETE /reviews/:id removes a review", async () => {
    const adminToken = await makeAdmin();
    const owner = await registerAndLogin("HOTEL_OWNER");
    const hotel = await request(app).post("/api/hotels").set(authHeader(owner.accessToken)).send({ name: "Reviewed Hotel" });
    const room = await request(app)
      .post(`/api/hotels/${hotel.body.id}/rooms`)
      .set(authHeader(owner.accessToken))
      .send({ type: "DOUBLE", pricePerNight: 40, capacity: 2 });
    const customer = await registerAndLogin("CUSTOMER");
    const booking = await request(app)
      .post("/api/bookings")
      .set(authHeader(customer.accessToken))
      .send({ roomId: room.body.id, checkIn: "2027-03-01", checkOut: "2027-03-02", guests: 1 });
    await request(app).patch(`/api/bookings/${booking.body.id}/status`).set(authHeader(owner.accessToken)).send({ status: "CONFIRMED" });
    await request(app).patch(`/api/bookings/${booking.body.id}/status`).set(authHeader(owner.accessToken)).send({ status: "COMPLETED" });
    const review = await request(app).post(`/api/bookings/${booking.body.id}/review`).set(authHeader(customer.accessToken)).send({ rating: 1, comment: "bad" });

    const res = await request(app).delete(`/api/admin/reviews/${review.body.id}`).set(authHeader(adminToken));
    expect(res.status).toBe(204);

    const list = await request(app).get(`/api/hotels/${hotel.body.id}/reviews`);
    expect(list.body).toHaveLength(0);
  });
});
