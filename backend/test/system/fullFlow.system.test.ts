import request from "supertest";
import { app } from "../../src/app";
import { prisma, resetDb } from "../db";
import { authHeader } from "../helpers";

// One long sequential story covering the real user journey end to end, matching the
// System Testing scenario from the test plan: register -> search -> book -> confirm ->
// complete -> review -> receipt -> (separate) cancel + availability recheck.
describe("system: full guest journey", () => {
  afterAll(async () => {
    await resetDb();
    await prisma.$disconnect();
  });

  let ownerToken: string;
  let customerToken: string;
  let hotelId: string;
  let roomId: string;
  let bookingId: string;
  let cancellableBookingId: string;

  it("1. registers a hotel owner and a customer", async () => {
    const owner = await request(app)
      .post("/api/auth/register")
      .send({ name: "Journey Owner", email: "journey-owner@nuzuljo.test", password: "password123", role: "HOTEL_OWNER" });
    expect(owner.status).toBe(201);
    ownerToken = owner.body.accessToken;

    const customer = await request(app)
      .post("/api/auth/register")
      .send({ name: "Journey Customer", email: "journey-customer@nuzuljo.test", password: "password123", role: "CUSTOMER" });
    expect(customer.status).toBe(201);
    customerToken = customer.body.accessToken;
  });

  it("2. the owner creates a hotel and a room", async () => {
    const hotel = await request(app)
      .post("/api/hotels")
      .set(authHeader(ownerToken))
      .send({ name: "Petra Journey Inn", description: "A cozy stay", starRating: 4 });
    expect(hotel.status).toBe(201);
    hotelId = hotel.body.id;

    const room = await request(app)
      .post(`/api/hotels/${hotelId}/rooms`)
      .set(authHeader(ownerToken))
      .send({ type: "DOUBLE", pricePerNight: 60, capacity: 2 });
    expect(room.status).toBe(201);
    roomId = room.body.id;
  });

  it("3. the customer finds the hotel via search", async () => {
    const res = await request(app).get("/api/hotels").query({ q: "Petra Journey" });
    expect(res.body.map((h: { id: string }) => h.id)).toContain(hotelId);
  });

  it("4. the customer checks availability before booking", async () => {
    const res = await request(app).get(`/api/rooms/${roomId}/availability`).query({ checkIn: "2027-01-10", checkOut: "2027-01-12" });
    expect(res.body.available).toBe(true);
  });

  it("5. the customer books the room (PENDING)", async () => {
    const res = await request(app)
      .post("/api/bookings")
      .set(authHeader(customerToken))
      .send({ roomId, checkIn: "2027-01-10", checkOut: "2027-01-12", guests: 2 });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("PENDING");
    expect(res.body.totalPrice).toBe("120"); // 2 nights * 60
    bookingId = res.body.id;
  });

  it("6. the owner confirms the booking", async () => {
    const res = await request(app).patch(`/api/bookings/${bookingId}/status`).set(authHeader(ownerToken)).send({ status: "CONFIRMED" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("CONFIRMED");
  });

  it("7. the owner marks the booking completed", async () => {
    const res = await request(app).patch(`/api/bookings/${bookingId}/status`).set(authHeader(ownerToken)).send({ status: "COMPLETED" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("COMPLETED");
  });

  it("8. the customer leaves a review", async () => {
    const res = await request(app).post(`/api/bookings/${bookingId}/review`).set(authHeader(customerToken)).send({ rating: 5, comment: "Wonderful stay" });
    expect(res.status).toBe(201);

    const list = await request(app).get(`/api/hotels/${hotelId}/reviews`);
    expect(list.body.some((r: { rating: number }) => r.rating === 5)).toBe(true);
  });

  it("9. the customer downloads the PDF receipt", async () => {
    const res = await request(app).get(`/api/bookings/${bookingId}/receipt`).set(authHeader(customerToken));
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("application/pdf");
    expect(res.body.length ?? Buffer.byteLength(res.text ?? "")).toBeGreaterThan(0);
  });

  it("10. a separate PENDING booking can be cancelled, and the room becomes available again for those dates", async () => {
    const created = await request(app)
      .post("/api/bookings")
      .set(authHeader(customerToken))
      .send({ roomId, checkIn: "2027-02-01", checkOut: "2027-02-03", guests: 1 });
    expect(created.status).toBe(201);
    cancellableBookingId = created.body.id;

    const beforeCancel = await request(app).get(`/api/rooms/${roomId}/availability`).query({ checkIn: "2027-02-01", checkOut: "2027-02-03" });
    expect(beforeCancel.body.available).toBe(false);

    const cancelled = await request(app).patch(`/api/bookings/${cancellableBookingId}/cancel`).set(authHeader(customerToken));
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.status).toBe("CANCELLED");

    const afterCancel = await request(app).get(`/api/rooms/${roomId}/availability`).query({ checkIn: "2027-02-01", checkOut: "2027-02-03" });
    expect(afterCancel.body.available).toBe(true);
  });
});
