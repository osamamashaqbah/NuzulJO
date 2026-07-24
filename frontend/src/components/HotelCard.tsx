import { Link } from "react-router-dom";
import type { Hotel } from "../types";

export function HotelCard({ hotel }: { hotel: Hotel }) {
  const cover = hotel.images[0]?.url ?? "https://picsum.photos/seed/placeholder/800/600";
  return (
    <Link
      to={`/hotels/${hotel.id}`}
      className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur transition hover:border-amber-400/50 hover:shadow-xl hover:shadow-amber-500/10"
    >
      <div className="aspect-[4/3] overflow-hidden">
        <img src={cover} alt={hotel.name} className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-neutral-100">{hotel.name}</h3>
          {hotel.starRating && <span className="shrink-0 text-sm text-amber-400">{"★".repeat(hotel.starRating)}</span>}
        </div>
        <p className="mt-1 text-sm text-neutral-400">{hotel.city?.name ?? "Jordan"}</p>
      </div>
    </Link>
  );
}
