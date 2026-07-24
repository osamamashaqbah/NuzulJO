import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

// Deletes all rows in FK-safe order. Used in beforeEach so every test starts from a clean slate
// against the real nuzuljo_test database — no mocking of Prisma.
export async function resetDb() {
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.hotelAmenity.deleteMany();
  await prisma.roomImage.deleteMany();
  await prisma.room.deleteMany();
  await prisma.hotelImage.deleteMany();
  await prisma.hotel.deleteMany();
  await prisma.amenity.deleteMany();
  await prisma.city.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
}
