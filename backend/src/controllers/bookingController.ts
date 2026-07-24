import type { Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import type { AuthedRequest } from "../middleware/auth";
import { sendMail } from "../utils/mailer";
import { streamReceiptPdf } from "../utils/receiptPdf";

const ACTIVE_STATUSES = ["PENDING", "CONFIRMED"] as const;

const createBookingSchema = z
  .object({
    roomId: z.string().uuid(),
    checkIn: z.coerce.date(),
    checkOut: z.coerce.date(),
    guests: z.number().int().positive().default(1),
  })
  .refine((d) => d.checkOut > d.checkIn, { message: "checkOut must be after checkIn", path: ["checkOut"] })
  .refine((d) => d.checkIn >= new Date(new Date().toDateString()), { message: "checkIn cannot be in the past", path: ["checkIn"] });

async function isRoomAvailable(roomId: string, checkIn: Date, checkOut: Date, excludeBookingId?: string) {
  const overlapping = await prisma.booking.findFirst({
    where: {
      roomId,
      status: { in: [...ACTIVE_STATUSES] },
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      checkIn: { lt: checkOut },
      checkOut: { gt: checkIn },
    },
  });
  return !overlapping;
}

export async function checkAvailability(req: AuthedRequest, res: Response) {
  const parsed = z.object({ checkIn: z.coerce.date(), checkOut: z.coerce.date() }).safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { checkIn, checkOut } = parsed.data;

  const available = await isRoomAvailable(req.params.id as string, checkIn, checkOut);
  res.json({ available });
}

export async function createBooking(req: AuthedRequest, res: Response) {
  const parsed = createBookingSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { roomId, checkIn, checkOut, guests } = parsed.data;

  const room = await prisma.room.findUnique({ where: { id: roomId }, include: { hotel: true } });
  if (!room || room.status !== "AVAILABLE") return res.status(404).json({ error: "Room not available" });
  if (guests > room.capacity) return res.status(400).json({ error: `Room capacity is ${room.capacity}` });

  if (!(await isRoomAvailable(roomId, checkIn, checkOut))) {
    return res.status(409).json({ error: "Room is already booked for those dates" });
  }

  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  const totalPrice = Number(room.pricePerNight) * nights;

  const booking = await prisma.booking.create({
    data: {
      userId: req.user!.userId,
      hotelId: room.hotelId,
      roomId,
      checkIn,
      checkOut,
      guests,
      totalPrice,
      payment: { create: { amount: totalPrice, status: "PENDING" } },
    },
    include: { room: true, hotel: true, user: { select: { id: true, name: true, email: true } } },
  });

  await sendMail(
    booking.user.email,
    "NuzulJO — Booking received",
    `<p>Hi ${booking.user.name},</p><p>Your booking at <b>${booking.hotel.name}</b> (${nights} night(s)) is pending confirmation by the hotel.</p>`,
  );

  res.status(201).json(booking);
}

export async function listMyBookings(req: AuthedRequest, res: Response) {
  const bookings = await prisma.booking.findMany({
    where: { userId: req.user!.userId },
    include: { room: true, hotel: true, payment: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(bookings);
}

export async function listHotelBookings(req: AuthedRequest, res: Response) {
  const hotel = await prisma.hotel.findUnique({ where: { id: req.params.hotelId as string } });
  if (!hotel || hotel.ownerId !== req.user!.userId) return res.status(404).json({ error: "Hotel not found" });

  const bookings = await prisma.booking.findMany({
    where: { hotelId: hotel.id },
    include: { room: true, user: { select: { id: true, name: true, email: true, phone: true } }, payment: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(bookings);
}

const statusUpdateSchema = z.object({ status: z.enum(["CONFIRMED", "REJECTED", "COMPLETED"]) });

export async function updateBookingStatus(req: AuthedRequest, res: Response) {
  const parsed = statusUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id as string },
    include: { hotel: true, user: true },
  });
  if (!booking || booking.hotel.ownerId !== req.user!.userId) return res.status(404).json({ error: "Booking not found" });

  const allowed: Record<string, string[]> = {
    PENDING: ["CONFIRMED", "REJECTED"],
    CONFIRMED: ["COMPLETED"],
  };
  if (!allowed[booking.status]?.includes(parsed.data.status)) {
    return res.status(400).json({ error: `Cannot move booking from ${booking.status} to ${parsed.data.status}` });
  }

  const updated = await prisma.booking.update({ where: { id: booking.id }, data: { status: parsed.data.status } });

  if (parsed.data.status === "CONFIRMED" || parsed.data.status === "REJECTED") {
    await sendMail(
      booking.user.email,
      `NuzulJO — Booking ${parsed.data.status.toLowerCase()}`,
      `<p>Hi ${booking.user.name},</p><p>Your booking at <b>${booking.hotel.name}</b> was ${parsed.data.status.toLowerCase()}.</p>`,
    );
  }

  res.json(updated);
}

export async function cancelBooking(req: AuthedRequest, res: Response) {
  const booking = await prisma.booking.findUnique({ where: { id: req.params.id as string } });
  if (!booking || booking.userId !== req.user!.userId) return res.status(404).json({ error: "Booking not found" });
  if (!ACTIVE_STATUSES.includes(booking.status as (typeof ACTIVE_STATUSES)[number])) {
    return res.status(400).json({ error: `Cannot cancel a ${booking.status} booking` });
  }

  const updated = await prisma.booking.update({ where: { id: booking.id }, data: { status: "CANCELLED" } });
  res.json(updated);
}

export async function getBookingReceipt(req: AuthedRequest, res: Response) {
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id as string },
    include: { room: true, hotel: true, user: { select: { id: true, name: true, email: true } } },
  });
  if (!booking) return res.status(404).json({ error: "Booking not found" });
  if (booking.userId !== req.user!.userId && booking.hotel.ownerId !== req.user!.userId) {
    return res.status(404).json({ error: "Booking not found" });
  }

  streamReceiptPdf(res, {
    bookingId: booking.id,
    hotelName: booking.hotel.name,
    roomType: booking.room.type,
    guestName: booking.user.name,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    guests: booking.guests,
    totalPrice: booking.totalPrice.toString(),
    status: booking.status,
  });
}
