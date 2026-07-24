import type { Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import type { AuthedRequest } from "../middleware/auth";

const userSelect = { id: true, name: true, email: true, role: true, phone: true, createdAt: true };

export async function listUsers(_req: AuthedRequest, res: Response) {
  const users = await prisma.user.findMany({ select: userSelect, orderBy: { createdAt: "desc" } });
  res.json(users);
}

const roleSchema = z.object({ role: z.enum(["CUSTOMER", "HOTEL_OWNER", "ADMIN"]) });

export async function updateUserRole(req: AuthedRequest, res: Response) {
  const parsed = roleSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const user = await prisma.user.update({
    where: { id: req.params.id as string },
    data: { role: parsed.data.role },
    select: userSelect,
  });
  console.warn(`[security] admin=${req.user!.userId} changed role of user=${user.id} to ${user.role}`);
  res.json(user);
}

export async function deleteUser(req: AuthedRequest, res: Response) {
  await prisma.user.delete({ where: { id: req.params.id as string } });
  res.status(204).send();
}

export async function listAllHotels(_req: AuthedRequest, res: Response) {
  const hotels = await prisma.hotel.findMany({
    include: { city: true, owner: { select: userSelect } },
    orderBy: { createdAt: "desc" },
  });
  res.json(hotels);
}

const hotelActiveSchema = z.object({ isActive: z.boolean() });

export async function setHotelActive(req: AuthedRequest, res: Response) {
  const parsed = hotelActiveSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const hotel = await prisma.hotel.update({ where: { id: req.params.id as string }, data: { isActive: parsed.data.isActive } });
  res.json(hotel);
}

export async function deleteHotelAdmin(req: AuthedRequest, res: Response) {
  await prisma.hotel.delete({ where: { id: req.params.id as string } });
  res.status(204).send();
}

export async function listAllReviews(_req: AuthedRequest, res: Response) {
  const reviews = await prisma.review.findMany({
    include: { user: { select: { id: true, name: true } }, hotel: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(reviews);
}

export async function deleteReview(req: AuthedRequest, res: Response) {
  await prisma.review.delete({ where: { id: req.params.id as string } });
  res.status(204).send();
}

export async function getReports(_req: AuthedRequest, res: Response) {
  const [userCount, hotelCount, bookingCount, revenue, bookingsByStatus] = await Promise.all([
    prisma.user.count(),
    prisma.hotel.count(),
    prisma.booking.count(),
    prisma.booking.aggregate({ where: { status: { in: ["CONFIRMED", "COMPLETED"] } }, _sum: { totalPrice: true } }),
    prisma.booking.groupBy({ by: ["status"], _count: true }),
  ]);

  res.json({
    userCount,
    hotelCount,
    bookingCount,
    totalRevenue: revenue._sum.totalPrice ?? 0,
    bookingsByStatus: Object.fromEntries(bookingsByStatus.map((b) => [b.status, b._count])),
  });
}
