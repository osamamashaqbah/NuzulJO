import request from "supertest";
import { app } from "../../src/app";
import { prisma, resetDb } from "../db";
import { registerAndLogin, authHeader } from "../helpers";

async function createHotelAndRoom(
  ownerToken: string,
  roomOverrides: Partial<{ capacity: number; status: "AVAILABLE" | "MAINTENANCE" | "UNAVAILABLE" }> = {},
) {
  const hotel = await request(app).post("/api/hotels").set(authHeader(ownerToken)).send({ name: "Booking Hotel" });
  const room = await request(app)
    .post(`/api/hotels/${hotel.body.id}/rooms`)
    .set(authHeader(ownerToken))
    .send({ type: "DOUBLE", pricePerNight: 50, capacity: roomOverrides.capacity ?? 2 });

  if (roomOverrides.status) {
    await prisma.room.update({ where: { id: room.body.id }, data: { status: roomOverrides.status } });
  }
  return { hotelId: hotel.body.id as string, roomId: room.body.id as string };
}

describe("bookings API", () => {
  afterEach(() => resetDb());
  afterAll(() => prisma.$disconnect());

  it("rejects a booking with more guests than the room's capacity", async () => {
    const owner = await registerAndLogin("HOTEL_OWNER");
    const { roomId } = await createHotelAndRoom(owner.accessToken, { capacity: 2 });
    const customer = await registerAndLogin("CUSTOMER");

    const res = await request(app)
      .post("/api/bookings")
      .set(authHeader(customer.accessToken))
      .send({ roomId, checkIn: "2026-11-01", checkOut: "2026-11-03", guests: 5 });
    expect(res.status).toBe(400);
  });

  it("rejects booking a room that's in MAINTENANCE", async () => {
    const owner = await registerAndLogin("HOTEL_OWNER");
    const { roomId } = await createHotelAndRoom(owner.accessToken, { status: "MAINTENANCE" });
    const customer = await registerAndLogin("CUSTOMER");

    const res = await request(app)
      .post("/api/bookings")
      .set(authHeader(customer.accessToken))
      .send({ roomId, checkIn: "2026-11-01", checkOut: "2026-11-03", guests: 1 });
    expect(res.status).toBe(404);
  });

  it("rejects a booking that overlaps an existing PENDING booking with 409", async () => {
    const owner = await registerAndLogin("HOTEL_OWNER");
    const { roomId } = await createHotelAndRoom(owner.accessToken);
    const customer = await registerAndLogin("CUSTOMER");

    await request(app).post("/api/bookings").set(authHeader(customer.accessToken)).send({ roomId, checkIn: "2026-11-01", checkOut: "2026-11-05", guests: 1 });
    const conflict = await request(app)
      .post("/api/bookings")
      .set(authHeader(customer.accessToken))
      .send({ roomId, checkIn: "2026-11-03", checkOut: "2026-11-06", guests: 1 });
    expect(conflict.status).toBe(409);
  });

  it("does not leak passwordHash in the booking creation response", async () => {
    const owner = await registerAndLogin("HOTEL_OWNER");
    const { roomId } = await createHotelAndRoom(owner.accessToken);
    const customer = await registerAndLogin("CUSTOMER");

    const res = await request(app)
      .post("/api/bookings")
      .set(authHeader(customer.accessToken))
      .send({ roomId, checkIn: "2026-11-01", checkOut: "2026-11-03", guests: 1 });

    expect(res.status).toBe(201);
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash/);
  });

  it("does not leak passwordHash when the owner lists bookings for their hotel", async () => {
    const owner = await registerAndLogin("HOTEL_OWNER");
    const { hotelId, roomId } = await createHotelAndRoom(owner.accessToken);
    const customer = await registerAndLogin("CUSTOMER");
    await request(app).post("/api/bookings").set(authHeader(customer.accessToken)).send({ roomId, checkIn: "2026-11-01", checkOut: "2026-11-03", guests: 1 });

    const res = await request(app).get(`/api/bookings/hotel/${hotelId}`).set(authHeader(owner.accessToken));
    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash/);
  });

  describe("status transitions", () => {
    async function setupPendingBooking() {
      const owner = await registerAndLogin("HOTEL_OWNER");
      const { hotelId, roomId } = await createHotelAndRoom(owner.accessToken);
      const customer = await registerAndLogin("CUSTOMER");
      const booking = await request(app)
        .post("/api/bookings")
        .set(authHeader(customer.accessToken))
        .send({ roomId, checkIn: "2026-11-01", checkOut: "2026-11-03", guests: 1 });
      return { owner, customer, hotelId, bookingId: booking.body.id as string };
    }

    it("allows the owner to move PENDING -> CONFIRMED", async () => {
      const { owner, bookingId } = await setupPendingBooking();
      const res = await request(app).patch(`/api/bookings/${bookingId}/status`).set(authHeader(owner.accessToken)).send({ status: "CONFIRMED" });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("CONFIRMED");
    });

    it("rejects skipping straight from PENDING to COMPLETED", async () => {
      const { owner, bookingId } = await setupPendingBooking();
      const res = await request(app).patch(`/api/bookings/${bookingId}/status`).set(authHeader(owner.accessToken)).send({ status: "COMPLETED" });
      expect(res.status).toBe(400);
    });

    it("allows CONFIRMED -> COMPLETED after confirming first", async () => {
      const { owner, bookingId } = await setupPendingBooking();
      await request(app).patch(`/api/bookings/${bookingId}/status`).set(authHeader(owner.accessToken)).send({ status: "CONFIRMED" });
      const res = await request(app).patch(`/api/bookings/${bookingId}/status`).set(authHeader(owner.accessToken)).send({ status: "COMPLETED" });
      expect(res.status).toBe(200);
    });

    it("rejects a different customer from cancelling someone else's booking (404)", async () => {
      const { bookingId } = await setupPendingBooking();
      const otherCustomer = await registerAndLogin("CUSTOMER");
      const res = await request(app).patch(`/api/bookings/${bookingId}/cancel`).set(authHeader(otherCustomer.accessToken));
      expect(res.status).toBe(404);
    });

    it("rejects cancelling an already-cancelled booking", async () => {
      const { customer, bookingId } = await setupPendingBooking();
      await request(app).patch(`/api/bookings/${bookingId}/cancel`).set(authHeader(customer.accessToken));
      const res = await request(app).patch(`/api/bookings/${bookingId}/cancel`).set(authHeader(customer.accessToken));
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/bookings/:id/receipt", () => {
    it("returns a PDF for the booking's owner (customer)", async () => {
      const owner = await registerAndLogin("HOTEL_OWNER");
      const { roomId } = await createHotelAndRoom(owner.accessToken);
      const customer = await registerAndLogin("CUSTOMER");
      const booking = await request(app)
        .post("/api/bookings")
        .set(authHeader(customer.accessToken))
        .send({ roomId, checkIn: "2026-11-01", checkOut: "2026-11-03", guests: 1 });

      const res = await request(app).get(`/api/bookings/${booking.body.id}/receipt`).set(authHeader(customer.accessToken));
      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toBe("application/pdf");
    });

    it("returns 404 for a user who is neither the guest nor the hotel owner", async () => {
      const owner = await registerAndLogin("HOTEL_OWNER");
      const { roomId } = await createHotelAndRoom(owner.accessToken);
      const customer = await registerAndLogin("CUSTOMER");
      const stranger = await registerAndLogin("CUSTOMER");
      const booking = await request(app)
        .post("/api/bookings")
        .set(authHeader(customer.accessToken))
        .send({ roomId, checkIn: "2026-11-01", checkOut: "2026-11-03", guests: 1 });

      const res = await request(app).get(`/api/bookings/${booking.body.id}/receipt`).set(authHeader(stranger.accessToken));
      expect(res.status).toBe(404);
    });
  });
});
