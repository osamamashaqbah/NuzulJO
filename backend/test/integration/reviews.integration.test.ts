import request from "supertest";
import { app } from "../../src/app";
import { prisma, resetDb } from "../db";
import { registerAndLogin, authHeader } from "../helpers";

async function completedBooking() {
  const owner = await registerAndLogin("HOTEL_OWNER");
  const hotel = await request(app).post("/api/hotels").set(authHeader(owner.accessToken)).send({ name: "Review Hotel" });
  const room = await request(app)
    .post(`/api/hotels/${hotel.body.id}/rooms`)
    .set(authHeader(owner.accessToken))
    .send({ type: "DOUBLE", pricePerNight: 50, capacity: 2 });
  const customer = await registerAndLogin("CUSTOMER");
  const booking = await request(app)
    .post("/api/bookings")
    .set(authHeader(customer.accessToken))
    .send({ roomId: room.body.id, checkIn: "2026-12-01", checkOut: "2026-12-03", guests: 1 });

  await request(app).patch(`/api/bookings/${booking.body.id}/status`).set(authHeader(owner.accessToken)).send({ status: "CONFIRMED" });
  await request(app).patch(`/api/bookings/${booking.body.id}/status`).set(authHeader(owner.accessToken)).send({ status: "COMPLETED" });

  return { customer, hotelId: hotel.body.id as string, bookingId: booking.body.id as string };
}

describe("reviews API", () => {
  afterEach(() => resetDb());
  afterAll(() => prisma.$disconnect());

  it("rejects reviewing a booking that isn't COMPLETED", async () => {
    const owner = await registerAndLogin("HOTEL_OWNER");
    const hotel = await request(app).post("/api/hotels").set(authHeader(owner.accessToken)).send({ name: "Not Completed Hotel" });
    const room = await request(app)
      .post(`/api/hotels/${hotel.body.id}/rooms`)
      .set(authHeader(owner.accessToken))
      .send({ type: "DOUBLE", pricePerNight: 50, capacity: 2 });
    const customer = await registerAndLogin("CUSTOMER");
    const booking = await request(app)
      .post("/api/bookings")
      .set(authHeader(customer.accessToken))
      .send({ roomId: room.body.id, checkIn: "2026-12-01", checkOut: "2026-12-03", guests: 1 });

    const res = await request(app).post(`/api/bookings/${booking.body.id}/review`).set(authHeader(customer.accessToken)).send({ rating: 5 });
    expect(res.status).toBe(400);
  });

  it("allows a review after the booking is COMPLETED and lists it publicly", async () => {
    const { customer, hotelId, bookingId } = await completedBooking();

    const created = await request(app).post(`/api/bookings/${bookingId}/review`).set(authHeader(customer.accessToken)).send({ rating: 5, comment: "Great!" });
    expect(created.status).toBe(201);

    const list = await request(app).get(`/api/hotels/${hotelId}/reviews`);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].rating).toBe(5);
  });

  it("rejects a second review for the same booking with 409", async () => {
    const { customer, bookingId } = await completedBooking();
    await request(app).post(`/api/bookings/${bookingId}/review`).set(authHeader(customer.accessToken)).send({ rating: 5 });
    const res = await request(app).post(`/api/bookings/${bookingId}/review`).set(authHeader(customer.accessToken)).send({ rating: 3 });
    expect(res.status).toBe(409);
  });
});
