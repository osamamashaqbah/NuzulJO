import { prisma, resetDb } from "../db";
import { createHotelWithRoom, createOwner } from "../fixtures";
import { isRoomAvailable } from "../../src/controllers/bookingController";

const d = (s: string) => new Date(s);

describe("isRoomAvailable", () => {
  afterEach(() => resetDb());
  afterAll(() => prisma.$disconnect());

  it("is available for a room with no bookings", async () => {
    const { room } = await createHotelWithRoom();
    await expect(isRoomAvailable(room.id, d("2026-08-01"), d("2026-08-03"))).resolves.toBe(true);
  });

  async function bookRoom(roomId: string, checkIn: string, checkOut: string, status: "PENDING" | "CONFIRMED" | "CANCELLED" | "REJECTED" | "COMPLETED" = "PENDING") {
    const guest = await prisma.user.create({
      data: { name: "Guest", email: `guest-${Date.now()}-${Math.random()}@nuzuljo.test`, passwordHash: "x", role: "CUSTOMER" },
    });
    const room = await prisma.room.findUniqueOrThrow({ where: { id: roomId } });
    return prisma.booking.create({
      data: {
        userId: guest.id,
        hotelId: room.hotelId,
        roomId,
        checkIn: d(checkIn),
        checkOut: d(checkOut),
        totalPrice: 100,
        status,
      },
    });
  }

  it("rejects an overlap where the new booking starts inside an existing one", async () => {
    const { room } = await createHotelWithRoom();
    await bookRoom(room.id, "2026-08-01", "2026-08-05");
    await expect(isRoomAvailable(room.id, d("2026-08-03"), d("2026-08-07"))).resolves.toBe(false);
  });

  it("rejects an overlap where the new booking ends inside an existing one", async () => {
    const { room } = await createHotelWithRoom();
    await bookRoom(room.id, "2026-08-05", "2026-08-10");
    await expect(isRoomAvailable(room.id, d("2026-08-01"), d("2026-08-07"))).resolves.toBe(false);
  });

  it("rejects a new booking that fully contains an existing one", async () => {
    const { room } = await createHotelWithRoom();
    await bookRoom(room.id, "2026-08-03", "2026-08-05");
    await expect(isRoomAvailable(room.id, d("2026-08-01"), d("2026-08-10"))).resolves.toBe(false);
  });

  it("allows a booking that starts exactly when the previous one ends (back-to-back)", async () => {
    const { room } = await createHotelWithRoom();
    await bookRoom(room.id, "2026-08-01", "2026-08-05");
    await expect(isRoomAvailable(room.id, d("2026-08-05"), d("2026-08-08"))).resolves.toBe(true);
  });

  it("does not count CANCELLED bookings as a conflict", async () => {
    const { room } = await createHotelWithRoom();
    await bookRoom(room.id, "2026-08-01", "2026-08-05", "CANCELLED");
    await expect(isRoomAvailable(room.id, d("2026-08-01"), d("2026-08-05"))).resolves.toBe(true);
  });

  it("does not count REJECTED bookings as a conflict", async () => {
    const { room } = await createHotelWithRoom();
    await bookRoom(room.id, "2026-08-01", "2026-08-05", "REJECTED");
    await expect(isRoomAvailable(room.id, d("2026-08-01"), d("2026-08-05"))).resolves.toBe(true);
  });

  it("counts CONFIRMED bookings as a conflict", async () => {
    const { room } = await createHotelWithRoom();
    await bookRoom(room.id, "2026-08-01", "2026-08-05", "CONFIRMED");
    await expect(isRoomAvailable(room.id, d("2026-08-01"), d("2026-08-05"))).resolves.toBe(false);
  });

  it("excludeBookingId lets a booking ignore its own row when re-checking availability", async () => {
    const { room } = await createHotelWithRoom();
    const booking = await bookRoom(room.id, "2026-08-01", "2026-08-05", "CONFIRMED");
    await expect(isRoomAvailable(room.id, d("2026-08-01"), d("2026-08-05"), booking.id)).resolves.toBe(true);
    await expect(isRoomAvailable(room.id, d("2026-08-01"), d("2026-08-05"))).resolves.toBe(false);
  });

  it("ignores unrelated owners/hotels (sanity check on fixtures)", async () => {
    await createOwner();
    const { room } = await createHotelWithRoom();
    await expect(isRoomAvailable(room.id, d("2026-09-01"), d("2026-09-02"))).resolves.toBe(true);
  });
});
