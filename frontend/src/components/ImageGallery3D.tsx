import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export function ImageGallery3D({ images, alt }: { images: string[]; alt: string }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  function go(delta: number) {
    setDirection(delta);
    setIndex((i) => (i + delta + images.length) % images.length);
  }

  if (images.length === 0) return null;

  return (
    <div className="relative" style={{ perspective: 1200 }}>
      <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10">
        <AnimatePresence mode="popLayout" custom={direction}>
          <motion.img
            key={index}
            src={images[index]}
            alt={alt}
            custom={direction}
            initial={{ opacity: 0, rotateY: direction > 0 ? 60 : -60, scale: 0.92 }}
            animate={{ opacity: 1, rotateY: 0, scale: 1 }}
            exit={{ opacity: 0, rotateY: direction > 0 ? -60 : 60, scale: 0.92 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ transformStyle: "preserve-3d" }}
          />
        </AnimatePresence>

        {images.length > 1 && (
          <>
            <button
              onClick={() => go(-1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur hover:bg-black/60"
              aria-label="Previous image"
            >
              ‹
            </button>
            <button
              onClick={() => go(1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur hover:bg-black/60"
              aria-label="Next image"
            >
              ›
            </button>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-2 flex justify-center gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setDirection(i > index ? 1 : -1);
                setIndex(i);
              }}
              className={`h-1.5 rounded-full transition-all ${i === index ? "w-4 bg-amber-400" : "w-1.5 bg-white/30"}`}
              aria-label={`Go to image ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
