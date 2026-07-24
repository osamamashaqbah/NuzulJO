import { motion } from "framer-motion";

// Lightweight animated gradient-mesh background (pure CSS blur, no WebGL) — cheap enough
// to run everywhere, used behind the hero and auth pages.
export function AnimatedGradientBg() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute -left-1/4 top-0 h-96 w-96 rounded-full bg-amber-500/20 blur-3xl"
        animate={{ x: [0, 60, 0], y: [0, 30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-0 top-20 h-96 w-96 rounded-full bg-cyan-800/20 blur-3xl"
        animate={{ x: [0, -50, 0], y: [0, 40, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-orange-700/10 blur-3xl"
        animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
