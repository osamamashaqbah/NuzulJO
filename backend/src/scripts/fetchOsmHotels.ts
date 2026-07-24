import { writeFile, readFile } from "node:fs/promises";
import path from "node:path";

// Source: OpenStreetMap via Overpass API (https://overpass-api.de/api/interpreter), free, no API key.
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const CACHE_PATH = path.join(__dirname, "../../data/osm-hotels.json");

const OVERPASS_QUERY = `
[out:json][timeout:60];
area["ISO3166-1"="JO"][admin_level=2]->.jo;
(
  node["tourism"="hotel"](area.jo);
  way["tourism"="hotel"](area.jo);
);
out center tags;
`;

export interface OsmHotel {
  osmId: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string | null;
}

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function toAddress(tags: Record<string, string>): string | null {
  const parts = [tags["addr:street"], tags["addr:housenumber"], tags["addr:city"]].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

export async function fetchOsmHotels(forceRefresh = false): Promise<OsmHotel[]> {
  if (!forceRefresh) {
    try {
      const cached = await readFile(CACHE_PATH, "utf-8");
      return JSON.parse(cached) as OsmHotel[];
    } catch {
      // no cache yet, fall through to fetch
    }
  }

  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    body: "data=" + encodeURIComponent(OVERPASS_QUERY),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      "User-Agent": "NuzulJO-dev-seed-script (contact: opluss310@gmail.com)",
    },
  });
  if (!res.ok) throw new Error(`Overpass API error: ${res.status} ${await res.text()}`);

  const json = (await res.json()) as { elements: OverpassElement[] };
  const hotels: OsmHotel[] = json.elements
    .filter((el) => el.tags?.name)
    .map((el) => {
      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;
      return {
        osmId: `${el.type}/${el.id}`,
        name: el.tags!.name!,
        latitude: lat!,
        longitude: lon!,
        address: toAddress(el.tags!),
      };
    })
    .filter((h) => h.latitude != null && h.longitude != null);

  await writeFile(CACHE_PATH, JSON.stringify(hotels, null, 2), "utf-8");
  return hotels;
}
