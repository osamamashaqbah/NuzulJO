import { Suspense, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, ContactShadows, Sparkles } from "@react-three/drei";
import type { Group } from "three";

// A stylized Petra-Treasury-inspired arch monument floating over a Dead-Sea-blue reflective
// disc — real Jordan landmarks instead of a generic building block, built entirely from
// primitives so it stays free/open-source with no external model download.
function PetraMonument({ mouse }: { mouse: React.RefObject<{ x: number; y: number }> }) {
  const group = useRef<Group>(null);

  useFrame((_, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.18;
    const targetX = (mouse.current?.y ?? 0) * 0.12;
    const targetZ = (mouse.current?.x ?? 0) * -0.12;
    group.current.rotation.x += (targetX - group.current.rotation.x) * 0.05;
    group.current.rotation.z += (targetZ - group.current.rotation.z) * 0.05;
  });

  const columnPositions: [number, number, number][] = [
    [-1.15, 0, 0],
    [-0.62, 0, 0],
    [0.62, 0, 0],
    [1.15, 0, 0],
  ];

  return (
    <group ref={group} position={[0, -0.3, 0]}>
      {/* base podium */}
      <mesh position={[0, -1.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 0.3, 1.4]} />
        <meshStandardMaterial color="#caa063" metalness={0.55} roughness={0.4} />
      </mesh>

      {/* columns */}
      {columnPositions.map((pos, i) => (
        <mesh key={i} position={pos} castShadow>
          <cylinderGeometry args={[0.11, 0.13, 1.9, 16]} />
          <meshStandardMaterial color="#caa063" metalness={0.55} roughness={0.4} />
        </mesh>
      ))}

      {/* central archway (half torus) */}
      <mesh position={[0, 0.55, 0]} rotation={[0, 0, 0]} castShadow>
        <torusGeometry args={[0.62, 0.16, 16, 32, Math.PI]} />
        <meshStandardMaterial color="#e8b968" metalness={0.85} roughness={0.22} />
      </mesh>
      <mesh position={[-0.62, -0.35, 0]} castShadow>
        <boxGeometry args={[0.24, 1.0, 0.3]} />
        <meshStandardMaterial color="#e8b968" metalness={0.85} roughness={0.22} />
      </mesh>
      <mesh position={[0.62, -0.35, 0]} castShadow>
        <boxGeometry args={[0.24, 1.0, 0.3]} />
        <meshStandardMaterial color="#e8b968" metalness={0.85} roughness={0.22} />
      </mesh>

      {/* architrave (lintel band) */}
      <mesh position={[0, 1.02, 0]} castShadow>
        <boxGeometry args={[3.2, 0.22, 0.5]} />
        <meshStandardMaterial color="#caa063" metalness={0.55} roughness={0.4} />
      </mesh>

      {/* pediment (triangular roof) */}
      <mesh position={[0, 1.55, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1.65, 0.75, 4]} />
        <meshStandardMaterial color="#caa063" metalness={0.55} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.55, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#e8b968" metalness={0.85} roughness={0.22} />
      </mesh>
    </group>
  );
}

function DeadSeaDisc() {
  return (
    <mesh position={[0, -1.35, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <circleGeometry args={[3.4, 64]} />
      <meshStandardMaterial color="#0b3b52" metalness={0.9} roughness={0.12} />
    </mesh>
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
      {/* warm key light (evokes desert sun on sandstone) + cool Dead-Sea-blue fill + soft gold rim */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[4, 6, 3]} intensity={1.9} color="#ffe4b0" castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-4, 2, -3]} intensity={0.4} color="#4fb3e8" />
      <pointLight position={[0, 2.5, -4]} intensity={0.5} color="#f5c25a" />
      <Suspense fallback={null}>
        <Float speed={1.1} rotationIntensity={0} floatIntensity={0.5}>
          <PetraMonument mouse={mouse} />
        </Float>
        <DeadSeaDisc />
        <Sparkles count={50} scale={[4, 2.5, 4]} size={2.2} speed={0.25} color="#f5c25a" opacity={0.6} />
        <ContactShadows position={[0, -1.34, 0]} opacity={0.4} scale={8} blur={2.5} far={2} />
      </Suspense>
      <fog attach="fog" args={["#171717", 6, 14]} />
    </>
  );
}

export default function Hero3DScene() {
  return (
    <div className="h-72 w-full overflow-hidden rounded-2xl sm:h-96">
      <Canvas camera={{ position: [3.4, 1.6, 4.6], fov: 38 }} shadows dpr={[1, 1.5]}>
        <Scene />
      </Canvas>
    </div>
  );
}
