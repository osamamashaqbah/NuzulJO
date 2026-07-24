import type { Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import type { AuthedRequest } from "../middleware/auth";

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

export async function createReview(req: AuthedRequest, res: Response) {
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const booking = await prisma.booking.findUnique({ where: { id: req.params.bookingId as string } });
  if (!booking || booking.userId !== req.user!.userId) return res.status(404).json({ error: "Booking not found" });
  if (booking.status !== "COMPLETED") return res.status(400).json({ error: "Can only review after the stay is completed" });

  const existing = await prisma.review.findUnique({ where: { bookingId: booking.id } });
  if (existing) return res.status(409).json({ error: "Booking already reviewed" });

  const review = await prisma.review.create({
    data: {
      bookingId: booking.id,
      hotelId: booking.hotelId,
      userId: req.user!.userId,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    },
  });
  res.status(201).json(review);
}

export async function listHotelReviews(req: AuthedRequest, res: Response) {
  const reviews = await prisma.review.findMany({
    where: { hotelId: req.params.hotelId as string },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(reviews);
}
