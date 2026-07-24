import bcrypt from "bcrypt";
import { prisma } from "./db";

export async function createOwner() {
  return prisma.user.create({
    data: {
      name: "Fixture Owner",
      email: `owner-${Date.now()}-${Math.random()}@nuzuljo.test`,
      passwordHash: await bcrypt.hash("password123", 4),
      role: "HOTEL_OWNER",
    },
  });
}

export async function createHotelWithRoom(overrides?: { pricePerNight?: number; capacity?: number; status?: "AVAILABLE" | "MAINTENANCE" | "UNAVAILABLE" }) {
  const owner = await createOwner();
  const hotel = await prisma.hotel.create({
    data: { name: "Fixture Hotel", ownerId: owner.id },
  });
  const room = await prisma.room.create({
    data: {
      hotelId: hotel.id,
      type: "DOUBLE",
      pricePerNight: overrides?.pricePerNight ?? 50,
      capacity: overrides?.capacity ?? 2,
      status: overrides?.status ?? "AVAILABLE",
    },
  });
  return { owner, hotel, room };
}
