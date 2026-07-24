import request from "supertest";
import { app } from "../../src/app";
import { prisma, resetDb } from "../db";
import { registerAndLogin, authHeader } from "../helpers";

describe("hotels API", () => {
  afterEach(() => resetDb());
  afterAll(() => prisma.$disconnect());

  describe("GET /api/hotels", () => {
    it("only returns active hotels", async () => {
      const owner = await registerAndLogin("HOTEL_OWNER");
      const active = await request(app).post("/api/hotels").set(authHeader(owner.accessToken)).send({ name: "Active Hotel" });
      const inactive = await request(app).post("/api/hotels").set(authHeader(owner.accessToken)).send({ name: "Inactive Hotel" });
      await prisma.hotel.update({ where: { id: inactive.body.id }, data: { isActive: false } });

      const res = await request(app).get("/api/hotels");
      const ids = res.body.map((h: { id: string }) => h.id);
      expect(ids).toContain(active.body.id);
      expect(ids).not.toContain(inactive.body.id);
    });

    it("applies price/roomType/capacity/amenity/rating filters correctly, not just 200", async () => {
      const owner = await registerAndLogin("HOTEL_OWNER");
      const city = await prisma.city.create({ data: { name: "Amman" } });
      const wifi = await prisma.amenity.create({ data: { key: "wifi", label: "WiFi" } });
      const pool = await prisma.amenity.create({ data: { key: "pool", label: "Pool" } });

      const matching = await request(app)
        .post("/api/hotels")
        .set(authHeader(owner.accessToken))
        .send({ name: "Matches", cityId: city.id, starRating: 5 });
      await prisma.hotel.update({
        where: { id: matching.body.id },
        data: { amenities: { create: [{ amenityId: wifi.id }, { amenityId: pool.id }] } },
      });
      await prisma.room.create({ data: { hotelId: matching.body.id, type: "DOUBLE", pricePerNight: 60, capacity: 2 } });

      const nonMatching = await request(app).post("/api/hotels").set(authHeader(owner.accessToken)).send({ name: "No Match", starRating: 2 });
      await prisma.room.create({ data: { hotelId: nonMatching.body.id, type: "SINGLE", pricePerNight: 200, capacity: 1 } });

      const res = await request(app).get("/api/hotels").query({
        city: "Amman",
        minPrice: 40,
        maxPrice: 100,
        roomType: "DOUBLE",
        capacity: 2,
        amenities: "wifi,pool",
        minRating: 4,
      });

      const ids = res.body.map((h: { id: string }) => h.id);
      expect(ids).toContain(matching.body.id);
      expect(ids).not.toContain(nonMatching.body.id);
    });

    it("rejects an out-of-range minRating with 400", async () => {
      const res = await request(app).get("/api/hotels").query({ minRating: 99 });
      expect(res.status).toBe(400);
    });
  });

  describe("write access control", () => {
    it("rejects hotel creation with 401 when unauthenticated", async () => {
      const res = await request(app).post("/api/hotels").send({ name: "X" });
      expect(res.status).toBe(401);
    });

    it("rejects hotel creation with 403 for a CUSTOMER", async () => {
      const customer = await registerAndLogin("CUSTOMER");
      const res = await request(app).post("/api/hotels").set(authHeader(customer.accessToken)).send({ name: "X" });
      expect(res.status).toBe(403);
    });

    it("allows a HOTEL_OWNER to create a hotel (201)", async () => {
      const owner = await registerAndLogin("HOTEL_OWNER");
      const res = await request(app).post("/api/hotels").set(authHeader(owner.accessToken)).send({ name: "My Hotel" });
      expect(res.status).toBe(201);
    });

    it("returns 404 (not 403) when a different owner tries to update someone else's hotel", async () => {
      const ownerA = await registerAndLogin("HOTEL_OWNER");
      const ownerB = await registerAndLogin("HOTEL_OWNER");
      const hotel = await request(app).post("/api/hotels").set(authHeader(ownerA.accessToken)).send({ name: "A's Hotel" });

      const res = await request(app).patch(`/api/hotels/${hotel.body.id}`).set(authHeader(ownerB.accessToken)).send({ name: "Hijacked" });
      expect(res.status).toBe(404);
    });

    it("returns 404 when a different owner tries to delete someone else's hotel", async () => {
      const ownerA = await registerAndLogin("HOTEL_OWNER");
      const ownerB = await registerAndLogin("HOTEL_OWNER");
      const hotel = await request(app).post("/api/hotels").set(authHeader(ownerA.accessToken)).send({ name: "A's Hotel" });

      const res = await request(app).delete(`/api/hotels/${hotel.body.id}`).set(authHeader(ownerB.accessToken));
      expect(res.status).toBe(404);

      const stillThere = await prisma.hotel.findUnique({ where: { id: hotel.body.id } });
      expect(stillThere).not.toBeNull();
    });
  });

  describe("GET /api/hotels/mine", () => {
    it("only lists hotels owned by the requesting owner", async () => {
      const ownerA = await registerAndLogin("HOTEL_OWNER");
      const ownerB = await registerAndLogin("HOTEL_OWNER");
      await request(app).post("/api/hotels").set(authHeader(ownerA.accessToken)).send({ name: "A1" });
      await request(app).post("/api/hotels").set(authHeader(ownerB.accessToken)).send({ name: "B1" });

      const res = await request(app).get("/api/hotels/mine").set(authHeader(ownerA.accessToken));
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe("A1");
    });
  });
});
