import bcrypt from "bcrypt";
import { prisma } from "../config/prisma";
import { fetchOsmHotels } from "./fetchOsmHotels";

// Jordan's main tourist cities, used only to bucket each OSM hotel into the nearest one
// (OSM addr:city tags are inconsistent/missing on most entries).
const CITIES = [
  { name: "Amman", nameAr: "عمان", lat: 31.9454, lon: 35.9284 },
  { name: "Dead Sea", nameAr: "البحر الميت", lat: 31.749, lon: 35.5763 },
  { name: "Petra", nameAr: "البتراء", lat: 30.3285, lon: 35.4478 },
  { name: "Aqaba", nameAr: "العقبة", lat: 29.5321, lon: 35.0063 },
  { name: "Jerash", nameAr: "جرش", lat: 32.2811, lon: 35.8994 },
];

const AMENITIES = [
  { key: "wifi", label: "Free WiFi" },
  { key: "breakfast", label: "Breakfast Included" },
  { key: "parking", label: "Free Parking" },
  { key: "pool", label: "Swimming Pool" },
  { key: "ac", label: "Air Conditioning" },
];

const ROOM_TYPES = ["SINGLE", "DOUBLE", "SUITE", "FAMILY"] as const;

function nearestCity(lat: number, lon: number) {
  let best = CITIES[0]!;
  let bestDist = Infinity;
  for (const city of CITIES) {
    const d = (lat - city.lat) ** 2 + (lon - city.lon) ** 2; // ponytail: planar approx, fine at country scale for nearest-city bucketing
    if (d < bestDist) {
      bestDist = d;
      best = city;
    }
  }
  return best;
}

// SEED (not from OSM): placeholder images via picsum.photos, deterministic per hotel/room id, free & no API key.
function placeholderImage(seed: string, w = 800, h = 600) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

async function main() {
  console.log("Fetching hotels from OpenStreetMap (Overpass API)...");
  const osmHotels = await fetchOsmHotels();
  console.log(`Got ${osmHotels.length} hotels from OSM.`);

  const cityRecords = await Promise.all(
    CITIES.map((c) =>
      prisma.city.upsert({ where: { name: c.name }, update: {}, create: { name: c.name, nameAr: c.nameAr } }),
    ),
  );
  const cityByName = new Map(cityRecords.map((c) => [c.name, c]));

  const amenityRecords = await Promise.all(
    AMENITIES.map((a) => prisma.amenity.upsert({ where: { key: a.key }, update: {}, create: a })),
  );

  // SEED (not from OSM): a placeholder owner account so imported hotels have a valid ownerId.
  // Real hotel owners register themselves later and claim/manage their own hotels.
  const seedOwnerEmail = "osm-import@nuzuljo.local";
  const seedOwner = await prisma.user.upsert({
    where: { email: seedOwnerEmail },
    update: {},
    create: {
      name: "NuzulJO Import Bot",
      email: seedOwnerEmail,
      passwordHash: await bcrypt.hash("change-me-not-a-real-login", 12),
      role: "HOTEL_OWNER",
    },
  });

  let created = 0;
  for (const osmHotel of osmHotels) {
    const existing = await prisma.hotel.findUnique({ where: { osmId: osmHotel.osmId } });
    if (existing) continue;

    const city = cityByName.get(nearestCity(osmHotel.latitude, osmHotel.longitude).name)!;

    const hotel = await prisma.hotel.create({
      data: {
        // real fields, from OSM:
        name: osmHotel.name,
        latitude: osmHotel.latitude,
        longitude: osmHotel.longitude,
        address: osmHotel.address,
        osmId: osmHotel.osmId,
        cityId: city.id,
        ownerId: seedOwner.id,
        // SEED (not from OSM): demo description/rating/images/rooms/amenities below.
        description: `${osmHotel.name} is located in ${city.name}, Jordan. (Seed description — replace with real content.)`,
        starRating: 3 + Math.floor(Math.random() * 3), // 3-5, seed only
        images: {
          create: [0, 1, 2].map((i) => ({ url: placeholderImage(`${osmHotel.osmId}-${i}`), position: i })),
        },
        amenities: {
          create: amenityRecords
            .filter(() => Math.random() > 0.3)
            .map((a) => ({ amenityId: a.id })),
        },
        rooms: {
          create: ROOM_TYPES.slice(0, 2 + Math.floor(Math.random() * 3)).map((type, i) => ({
            type,
            pricePerNight: 40 + i * 25 + Math.floor(Math.random() * 20), // seed price in JOD
            capacity: type === "SINGLE" ? 1 : type === "FAMILY" ? 4 : 2,
            images: { create: [{ url: placeholderImage(`${osmHotel.osmId}-room-${i}`), position: 0 }] },
          })),
        },
      },
    });
    created++;
    if (created % 25 === 0) console.log(`  ...${created} hotels created`);
  }

  console.log(`Done. Created ${created} new hotels (${osmHotels.length - created} already existed).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
