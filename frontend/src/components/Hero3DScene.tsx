import { Suspense, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, ContactShadows, RoundedBox } from "@react-three/drei";
import type { Mesh } from "three";

// Stylized low-poly "hotel tower" built from primitives — no external model assets needed,
// keeps this free/open-source and avoids a large GLB download on first paint.
function HotelTower({ mouse }: { mouse: React.RefObject<{ x: number; y: number }> }) {
  const group = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (!group.current) return;
    // gentle idle auto-rotation plus a mouse-driven parallax tilt
    group.current.rotation.y += delta * 0.15;
    const targetX = (mouse.current?.y ?? 0) * 0.15;
    const targetZ = (mouse.current?.x ?? 0) * -0.15;
    group.current.rotation.x += (targetX - group.current.rotation.x) * 0.05;
    group.current.rotation.z += (targetZ - group.current.rotation.z) * 0.05;
  });

  const floors = 7;
  return (
    <group ref={group as never} position={[0, -0.5, 0]}>
      {/* base podium */}
      <RoundedBox args={[3.4, 0.4, 2.4]} radius={0.05} position={[0, -0.2, 0]}>
        <meshStandardMaterial color="#3a2a1c" metalness={0.3} roughness={0.6} />
      </RoundedBox>
      {Array.from({ length: floors }).map((_, i) => (
        <RoundedBox key={i} args={[2.6, 0.55, 1.8]} radius={0.04} position={[0, i * 0.62, 0]}>
          <meshStandardMaterial color={i % 2 === 0 ? "#caa15f" : "#b98d47"} metalness={0.55} roughness={0.35} />
        </RoundedBox>
      ))}
      {/* rooftop */}
      <RoundedBox args={[1.2, 0.25, 0.9]} radius={0.03} position={[0, floors * 0.62 + 0.1, 0]}>
        <meshStandardMaterial color="#0b3b4f" metalness={0.7} roughness={0.2} />
      </RoundedBox>
    </group>
  );
}

function Scene() {
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    function onMove(e: MouseEvent) {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    }
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <>
      {/* manual 3-point rig instead of a fetched HDRI: no network dependency, still gives real depth via
          key + fill + rim lights against the metalness/roughness materials below */}
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 6, 3]} intensity={1.7} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-4, 2, -3]} intensity={0.35} color="#4fb3e8" />
      <pointLight position={[0, 3, -4]} intensity={0.4} color="#d9a441" />
      <Suspense fallback={null}>
        <Float speed={1.2} rotationIntensity={0} floatIntensity={0.6}>
          <HotelTower mouse={mouse} />
        </Float>
        <ContactShadows position={[0, -0.75, 0]} opacity={0.5} scale={8} blur={2.5} far={2} />
      </Suspense>
    </>
  );
}

export default function Hero3DScene() {
  return (
    <div className="h-72 w-full overflow-hidden rounded-2xl sm:h-96">
      <Canvas camera={{ position: [3.2, 2.4, 4.2], fov: 40 }} shadows dpr={[1, 1.5]}>
        <Scene />
      </Canvas>
    </div>
  );
}
