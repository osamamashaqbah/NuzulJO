import { Link } from "react-router-dom";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { MouseEvent } from "react";
import type { Hotel } from "../types";

export function HotelCard({ hotel }: { hotel: Hotel }) {
  const cover = hotel.images[0]?.url ?? "/no-photo.svg";

  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const springConfig = { stiffness: 200, damping: 20 };
  const rotateX = useSpring(useTransform(y, [0, 1], [8, -8]), springConfig);
  const rotateY = useSpring(useTransform(x, [0, 1], [-8, 8]), springConfig);
  const shadowX = useTransform(x, [0, 1], [-16, 16]);
  const shadowY = useTransform(y, [0, 1], [-16, 16]);
  const boxShadow = useTransform([shadowX, shadowY], ([sx, sy]) => `${sx}px ${sy}px 40px -12px rgba(217,164,65,0.25)`);

  function onMouseMove(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width);
    y.set((e.clientY - rect.top) / rect.height);
  }
  function onMouseLeave() {
    x.set(0.5);
    y.set(0.5);
  }

  return (
    <Link to={`/hotels/${hotel.id}`} style={{ perspective: 800 }}>
      <motion.div
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        style={{ rotateX, rotateY, boxShadow }}
        className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur transition-colors hover:border-amber-400/50"
      >
        <div className="aspect-[4/3] overflow-hidden">
          <img src={cover} alt={hotel.name} className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
        </div>
        <div className="p-4" style={{ transform: "translateZ(20px)" }}>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-neutral-100">{hotel.name}</h3>
            {hotel.starRating && <span className="shrink-0 text-sm text-amber-400">{"★".repeat(hotel.starRating)}</span>}
          </div>
          <p className="mt-1 text-sm text-neutral-400">{hotel.city?.name ?? "Jordan"}</p>
        </div>
      </motion.div>
    </Link>
  );
}
