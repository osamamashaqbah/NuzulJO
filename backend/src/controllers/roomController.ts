import type { Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import type { AuthedRequest } from "../middleware/auth";
import { saveCompressedImage } from "../utils/imageStorage";

const MAX_ROOM_IMAGES = 5;

const roomSchema = z.object({
  type: z.enum(["SINGLE", "DOUBLE", "SUITE", "FAMILY"]),
  name: z.string().max(100).optional(),
  pricePerNight: z.number().positive(),
  capacity: z.number().int().min(1).max(20),
  status: z.enum(["AVAILABLE", "MAINTENANCE", "UNAVAILABLE"]).optional(),
  description: z.string().max(2000).optional(),
});

const roomInclude = { images: { orderBy: { position: "asc" as const } } };

async function assertOwnsHotel(hotelId: string, userId: string) {
  const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
  return hotel && hotel.ownerId === userId ? hotel : null;
}

async function assertOwnsRoom(roomId: string, userId: string) {
  const room = await prisma.room.findUnique({ where: { id: roomId }, include: { hotel: true } });
  return room && room.hotel.ownerId === userId ? room : null;
}

export async function listRoomsForHotel(req: AuthedRequest, res: Response) {
  const rooms = await prisma.room.findMany({
    where: { hotelId: req.params.hotelId as string },
    include: roomInclude,
    orderBy: { createdAt: "asc" },
  });
  res.json(rooms);
}

export async function getRoom(req: AuthedRequest, res: Response) {
  const room = await prisma.room.findUnique({ where: { id: req.params.id as string }, include: roomInclude });
  if (!room) return res.status(404).json({ error: "Room not found" });
  res.json(room);
}

export async function createRoom(req: AuthedRequest, res: Response) {
  const parsed = roomSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const hotelId = req.params.hotelId as string;
  const owned = await assertOwnsHotel(hotelId, req.user!.userId);
  if (!owned) return res.status(404).json({ error: "Hotel not found" });

  const room = await prisma.room.create({ data: { ...parsed.data, hotelId }, include: roomInclude });
  res.status(201).json(room);
}

export async function updateRoom(req: AuthedRequest, res: Response) {
  const parsed = roomSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const owned = await assertOwnsRoom(req.params.id as string, req.user!.userId);
  if (!owned) return res.status(404).json({ error: "Room not found" });

  const room = await prisma.room.update({ where: { id: owned.id }, data: parsed.data, include: roomInclude });
  res.json(room);
}

export async function deleteRoom(req: AuthedRequest, res: Response) {
  const owned = await assertOwnsRoom(req.params.id as string, req.user!.userId);
  if (!owned) return res.status(404).json({ error: "Room not found" });

  await prisma.room.delete({ where: { id: owned.id } });
  res.status(204).send();
}

export async function uploadRoomImages(req: AuthedRequest, res: Response) {
  const owned = await assertOwnsRoom(req.params.id as string, req.user!.userId);
  if (!owned) return res.status(404).json({ error: "Room not found" });

  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (files.length === 0) return res.status(400).json({ error: "No images uploaded" });

  const existingCount = await prisma.roomImage.count({ where: { roomId: owned.id } });
  if (existingCount + files.length > MAX_ROOM_IMAGES) {
    return res.status(400).json({ error: `Max ${MAX_ROOM_IMAGES} images per room (has ${existingCount})` });
  }

  const created = [];
  for (const [i, file] of files.entries()) {
    const url = await saveCompressedImage(file.buffer, `rooms/${owned.id}`);
    created.push(await prisma.roomImage.create({ data: { roomId: owned.id, url, position: existingCount + i } }));
  }
  res.status(201).json(created);
}
