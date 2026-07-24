import { lazy, Suspense, useState, useEffect } from "react";

// three.js/@react-three/* are only pulled into a separate chunk and fetched when a
// capable device actually needs them — weak/mobile devices never download this bundle.
const Hero3DScene = lazy(() => import("./Hero3DScene"));

const staticFallback = (
  <div className="h-72 w-full rounded-2xl bg-gradient-to-br from-amber-500/20 via-neutral-800 to-cyan-900/30 sm:h-96" />
);

// Weak/mobile devices (or reduced-motion users) get a static gradient instead of the WebGL canvas.
function shouldUse3D() {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) return false;
  if (window.innerWidth < 640) return false;
  return true;
}

export function Hero3D() {
  const [use3D, setUse3D] = useState(false);

  useEffect(() => {
    setUse3D(shouldUse3D());
  }, []);

  if (!use3D) return staticFallback;

  return (
    <Suspense fallback={staticFallback}>
      <Hero3DScene />
    </Suspense>
  );
}
