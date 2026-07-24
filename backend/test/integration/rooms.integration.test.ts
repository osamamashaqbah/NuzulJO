import request from "supertest";
import { app } from "../../src/app";
import { prisma, resetDb } from "../db";
import { registerAndLogin, authHeader } from "../helpers";

async function createHotel(token: string, name = "Room Test Hotel") {
  const res = await request(app).post("/api/hotels").set(authHeader(token)).send({ name });
  return res.body.id as string;
}

describe("rooms API", () => {
  afterEach(() => resetDb());
  afterAll(() => prisma.$disconnect());

  it("rejects room creation by a non-owner of the hotel with 404", async () => {
    const ownerA = await registerAndLogin("HOTEL_OWNER");
    const ownerB = await registerAndLogin("HOTEL_OWNER");
    const hotelId = await createHotel(ownerA.accessToken);

    const res = await request(app)
      .post(`/api/hotels/${hotelId}/rooms`)
      .set(authHeader(ownerB.accessToken))
      .send({ type: "DOUBLE", pricePerNight: 50, capacity: 2 });
    expect(res.status).toBe(404);
  });

  it("creates a room and lists it under the hotel", async () => {
    const owner = await registerAndLogin("HOTEL_OWNER");
    const hotelId = await createHotel(owner.accessToken);

    const created = await request(app)
      .post(`/api/hotels/${hotelId}/rooms`)
      .set(authHeader(owner.accessToken))
      .send({ type: "SUITE", pricePerNight: 120, capacity: 4 });
    expect(created.status).toBe(201);

    const list = await request(app).get(`/api/hotels/${hotelId}/rooms`);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].type).toBe("SUITE");
  });

  it("reports availability true for an unbooked room and false once a conflicting booking exists", async () => {
    const owner = await registerAndLogin("HOTEL_OWNER");
    const hotelId = await createHotel(owner.accessToken);
    const room = await request(app)
      .post(`/api/hotels/${hotelId}/rooms`)
      .set(authHeader(owner.accessToken))
      .send({ type: "DOUBLE", pricePerNight: 50, capacity: 2 });

    const before = await request(app).get(`/api/rooms/${room.body.id}/availability`).query({ checkIn: "2026-10-01", checkOut: "2026-10-03" });
    expect(before.body.available).toBe(true);

    const customer = await registerAndLogin("CUSTOMER");
    await request(app)
      .post("/api/bookings")
      .set(authHeader(customer.accessToken))
      .send({ roomId: room.body.id, checkIn: "2026-10-01", checkOut: "2026-10-03", guests: 1 });

    const after = await request(app).get(`/api/rooms/${room.body.id}/availability`).query({ checkIn: "2026-10-01", checkOut: "2026-10-03" });
    expect(after.body.available).toBe(false);
  });
});
