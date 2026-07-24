import { useEffect, useState } from "react";

// Real photos of Jordanian hotels/resorts (Wikimedia Commons, CC BY / CC BY-SA — free for
// commercial use with attribution, no API key, no card). Not tied to any specific listing
// in the database — this is the marketing hero, not a per-hotel photo.
const PHOTOS = [
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Kempinski_Hotel_Ishtar_-_Dead_Sea_-_Jordan.jpg/1280px-Kempinski_Hotel_Ishtar_-_Dead_Sea_-_Jordan.jpg",
    caption: "Kempinski Hotel Ishtar, Dead Sea",
    author: "Producer",
    license: "CC BY 3.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Kempinski_Hotel_Ishtar_-_Dead_Sea_-_Jordan.jpg",
  },
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Regency_Palace_Hotel%2C_Amman%2C_Jordan.jpeg/1280px-Regency_Palace_Hotel%2C_Amman%2C_Jordan.jpeg",
    caption: "Regency Palace Hotel, Amman",
    author: "Wikimedia Commons",
    license: "CC BY-SA 4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Regency_Palace_Hotel,_Amman,_Jordan.jpeg",
  },
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/M%C3%B6venpick_Aqaba_by_Night_%284269922782%29.jpg/1280px-M%C3%B6venpick_Aqaba_by_Night_%284269922782%29.jpg",
    caption: "Mövenpick Resort, Aqaba",
    author: "Wikimedia Commons",
    license: "CC BY 2.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:M%C3%B6venpick_Aqaba_by_Night_(4269922782).jpg",
  },
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/View_to_Wadi_Musa_from_hotel_outside_Petra.jpg/1280px-View_to_Wadi_Musa_from_hotel_outside_Petra.jpg",
    caption: "Hotel view over Wadi Musa, Petra",
    author: "Wikimedia Commons",
    license: "CC BY-SA 3.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:View_to_Wadi_Musa_from_hotel_outside_Petra.jpg",
  },
  {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Movenpick_Dead_Sea_-_Jordan.png/1280px-Movenpick_Dead_Sea_-_Jordan.png",
    caption: "Mövenpick Resort, Dead Sea",
    author: "Wikimedia Commons",
    license: "CC BY-SA 4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Movenpick_Dead_Sea_-_Jordan.png",
  },
];

export function Hero3D() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % PHOTOS.length), 5000);
    return () => clearInterval(id);
  }, []);

  const photo = PHOTOS[index]!;

  return (
    <div className="relative h-72 w-full overflow-hidden rounded-2xl sm:h-96">
      {/* All photos stay mounted and only fade via a plain CSS opacity transition — no
          mount/unmount timing to get wrong, so there's no chance of two photos stacking visibly. */}
      {PHOTOS.map((p, i) => (
        <img
          key={p.url}
          src={p.url}
          alt={p.caption}
          style={{
            opacity: i === index ? 1 : 0,
            transform: i === index ? "scale(1)" : "scale(1.05)",
            transition: "opacity 1.2s ease, transform 6s linear",
          }}
          className="absolute inset-0 h-full w-full object-cover"
          loading={i === 0 ? "eager" : "lazy"}
        />
      ))}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-neutral-950/70 via-transparent to-transparent" />

      <div className="absolute bottom-3 right-3 flex items-center gap-2">
        {PHOTOS.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Show photo ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${i === index ? "w-4 bg-amber-400" : "w-1.5 bg-white/40"}`}
          />
        ))}
      </div>

      <a
        href={photo.sourceUrl}
        target="_blank"
        rel="noreferrer"
        className="absolute bottom-2 left-3 text-[10px] text-white/60 hover:text-white/90"
      >
        {photo.caption} · {photo.author} · {photo.license}
      </a>
    </div>
  );
}
