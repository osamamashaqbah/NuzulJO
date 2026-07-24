import { useEffect, useState } from "react";
import { api } from "../api/client";
import { HotelCard } from "../components/HotelCard";
import { Hero3D } from "../components/Hero3D";
import { AnimatedGradientBg } from "../components/AnimatedGradientBg";
import type { Hotel } from "../types";

const AMENITY_OPTIONS = ["wifi", "breakfast", "parking", "pool", "ac"];

export function HomePage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);

  function toggleAmenity(key: string) {
    setAmenities((prev) => (prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key]));
  }

  useEffect(() => {
    const params: Record<string, string> = {};
    if (q) params.q = q;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    if (minRating) params.minRating = minRating;
    if (amenities.length) params.amenities = amenities.join(",");

    setLoading(true);
    const timeout = setTimeout(() => {
      api
        .get("/hotels", { params })
        .then((res) => setHotels(res.data))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [q, minPrice, maxPrice, minRating, amenities]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <section className="relative mb-10 grid gap-6 overflow-hidden rounded-3xl border border-white/10 bg-neutral-900 p-6 sm:p-10 lg:grid-cols-2 lg:items-center">
        <AnimatedGradientBg />
        <div className="text-center lg:text-left">
          <h1 className="text-4xl font-semibold tracking-tight text-neutral-50">Find your stay in Jordan</h1>
          <p className="mt-2 text-neutral-400">Book directly with real hotels across Amman, the Dead Sea, Petra, Aqaba, and Jerash.</p>
        </div>
        <Hero3D />
      </section>

      <div className="mb-8 grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by hotel or city..."
          className="rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-amber-400 lg:col-span-2"
        />
        <input
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          placeholder="Min price (JOD)"
          type="number"
          className="rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-amber-400"
        />
        <input
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          placeholder="Max price (JOD)"
          type="number"
          className="rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-amber-400"
        />
        <select
          value={minRating}
          onChange={(e) => setMinRating(e.target.value)}
          className="rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-amber-400"
        >
          <option value="">Any rating</option>
          {[3, 4, 5].map((r) => (
            <option key={r} value={r}>
              {r}+ stars
            </option>
          ))}
        </select>
        <div className="flex flex-wrap gap-2 lg:col-span-3">
          {AMENITY_OPTIONS.map((a) => (
            <button
              key={a}
              onClick={() => toggleAmenity(a)}
              className={`rounded-full border px-3 py-1 text-xs capitalize transition ${
                amenities.includes(a) ? "border-amber-400 bg-amber-400/10 text-amber-400" : "border-white/10 text-neutral-400 hover:border-white/30"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-center text-neutral-500">Loading hotels...</p>
      ) : hotels.length === 0 ? (
        <p className="text-center text-neutral-500">No hotels match your filters.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {hotels.map((h) => (
            <HotelCard key={h.id} hotel={h} />
          ))}
        </div>
      )}
    </div>
  );
}
