import type { Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import type { AuthedRequest } from "../middleware/auth";
import { saveCompressedImage } from "../utils/imageStorage";

const MAX_HOTEL_IMAGES = 8;

const hotelSchema = z.object({
  name: z.string().min(2).max(150),
  description: z.string().max(2000).optional(),
  address: z.string().max(300).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  cityId: z.string().uuid().optional(),
  starRating: z.number().int().min(1).max(5).optional(),
});

const hotelInclude = {
  city: true,
  images: { orderBy: { position: "asc" as const } },
  amenities: { include: { amenity: true } },
};

// List views (search grid, owner's hotel list) only ever render name/rating/city/cover image —
// selecting just that instead of the full hotelInclude cut the /api/hotels payload from ~400KB
// to a fraction of that for 300+ hotels, which matters on Render's free tier (slow cold DB conns).
const hotelListSelect = {
  id: true,
  name: true,
  starRating: true,
  isActive: true,
  city: { select: { id: true, name: true } },
  images: { orderBy: { position: "asc" as const }, take: 1 },
};

const searchSchema = z.object({
  q: z.string().optional(), // matches hotel name or city name
  city: z.string().optional(), // city name, exact
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  minRating: z.coerce.number().int().min(1).max(5).optional(), // filters on Hotel.starRating (seed data; swap for review avg once Reviews ship)
  roomType: z.enum(["SINGLE", "DOUBLE", "SUITE", "FAMILY"]).optional(),
  capacity: z.coerce.number().int().positive().optional(),
  amenities: z.string().optional(), // comma-separated amenity keys, hotel must have all
});

export async function listHotels(req: AuthedRequest, res: Response) {
  const parsed = searchSchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { q, city, minPrice, maxPrice, minRating, roomType, capacity, amenities } = parsed.data;

  const roomFilter = {
    ...(roomType ? { type: roomType } : {}),
    ...(capacity ? { capacity: { gte: capacity } } : {}),
    ...(minPrice != null || maxPrice != null
      ? { pricePerNight: { ...(minPrice != null ? { gte: minPrice } : {}), ...(maxPrice != null ? { lte: maxPrice } : {}) } }
      : {}),
  };
  const hasRoomFilter = Object.keys(roomFilter).length > 0;

  const amenityKeys = amenities ? amenities.split(",").map((s) => s.trim()).filter(Boolean) : [];

  const hotels = await prisma.hotel.findMany({
    where: {
      isActive: true,
      ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { city: { name: { contains: q, mode: "insensitive" } } }] } : {}),
      ...(city ? { city: { name: { equals: city, mode: "insensitive" } } } : {}),
      ...(minRating ? { starRating: { gte: minRating } } : {}),
      ...(hasRoomFilter ? { rooms: { some: roomFilter } } : {}),
      ...(amenityKeys.length ? { AND: amenityKeys.map((key) => ({ amenities: { some: { amenity: { key } } } })) } : {}),
    },
    select: hotelListSelect,
    orderBy: { createdAt: "desc" },
  });
  res.json(hotels);
}

export async function getHotel(req: AuthedRequest, res: Response) {
  const hotel = await prisma.hotel.findUnique({
    where: { id: (req.params.id as string) },
    include: { ...hotelInclude, rooms: { include: { images: { orderBy: { position: "asc" } } } } },
  });
  if (!hotel) return res.status(404).json({ error: "Hotel not found" });
  res.json(hotel);
}

export async function listMyHotels(req: AuthedRequest, res: Response) {
  const hotels = await prisma.hotel.findMany({
    where: { ownerId: req.user!.userId },
    select: hotelListSelect,
    orderBy: { createdAt: "desc" },
  });
  res.json(hotels);
}

export async function createHotel(req: AuthedRequest, res: Response) {
  const parsed = hotelSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const hotel = await prisma.hotel.create({
    data: { ...parsed.data, ownerId: req.user!.userId },
    include: hotelInclude,
  });
  res.status(201).json(hotel);
}

async function assertOwnsHotel(hotelId: string, userId: string) {
  const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
  return hotel && hotel.ownerId === userId ? hotel : null;
}

export async function updateHotel(req: AuthedRequest, res: Response) {
  const parsed = hotelSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const owned = await assertOwnsHotel((req.params.id as string), req.user!.userId);
  if (!owned) return res.status(404).json({ error: "Hotel not found" });

  const hotel = await prisma.hotel.update({ where: { id: (req.params.id as string) }, data: parsed.data, include: hotelInclude });
  res.json(hotel);
}

export async function uploadHotelImages(req: AuthedRequest, res: Response) {
  const owned = await assertOwnsHotel((req.params.id as string), req.user!.userId);
  if (!owned) return res.status(404).json({ error: "Hotel not found" });

  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (files.length === 0) return res.status(400).json({ error: "No images uploaded" });

  const existingCount = await prisma.hotelImage.count({ where: { hotelId: owned.id } });
  if (existingCount + files.length > MAX_HOTEL_IMAGES) {
    return res.status(400).json({ error: `Max ${MAX_HOTEL_IMAGES} images per hotel (has ${existingCount})` });
  }

  const created = [];
  for (const [i, file] of files.entries()) {
    const url = await saveCompressedImage(file.buffer, `hotels/${owned.id}`);
    created.push(await prisma.hotelImage.create({ data: { hotelId: owned.id, url, position: existingCount + i } }));
  }
  res.status(201).json(created);
}

export async function deleteHotel(req: AuthedRequest, res: Response) {
  const owned = await assertOwnsHotel((req.params.id as string), req.user!.userId);
  if (!owned) return res.status(404).json({ error: "Hotel not found" });

  await prisma.hotel.delete({ where: { id: (req.params.id as string) } });
  res.status(204).send();
}
