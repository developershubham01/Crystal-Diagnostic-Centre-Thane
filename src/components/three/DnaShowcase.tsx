"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, Float } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * DnaShowcase — abstract DNA double-helix visual for the "science" section.
 * Rotation is driven by page scroll (respecting reduced motion — handled by
 * the Lazy3D wrapper, which never mounts this scene when reduced motion is set).
 * Abstract visualisation only; it does not depict any real equipment.
 */

function Helix({ mobile, scrollRef }: { mobile: boolean; scrollRef: React.MutableRefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const turns = 3.2;
  const steps = mobile ? 22 : 34;
  const height = 5.6;

  const { strandA, strandB, rungs } = useMemo(() => {
    const strandA: THREE.Vector3[] = [];
    const strandB: THREE.Vector3[] = [];
    const rungs: { a: THREE.Vector3; b: THREE.Vector3 }[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const angle = t * Math.PI * 2 * turns;
      const y = (t - 0.5) * height;
      const r = 1.05;
      const a = new THREE.Vector3(r * Math.cos(angle), y, r * Math.sin(angle));
      const b = new THREE.Vector3(-r * Math.cos(angle), y, -r * Math.sin(angle));
      strandA.push(a);
      strandB.push(b);
      if (i % 2 === 0) rungs.push({ a, b });
    }
    return { strandA, strandB, rungs };
  }, [steps, height]);

  const strandMeshes = useMemo(() => {
    const make = (points: THREE.Vector3[], color: string) => (
      <group key={color}>
        {points.map((p, i) => (
          <mesh key={i} position={p}>
            <sphereGeometry args={[0.085, mobile ? 10 : 16, mobile ? 10 : 16]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} roughness={0.3} metalness={0.2} />
          </mesh>
        ))}
      </group>
    );
    return [make(strandA, "#FFC000"), make(strandB, "#F5F5F5")];
  }, [strandA, strandB, mobile]);

  useFrame((state, delta) => {
    if (!group.current) return;
    // Base slow rotation + scroll-driven boost
    const scrollBoost = Math.min(Math.abs(scrollRef.current * 0.004), 0.25);
    group.current.rotation.y += delta * (0.18 + scrollBoost);
    group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.06;
  });

  const renderRungs = () =>
    rungs.map((r, i) => {
      const dir = new THREE.Vector3().subVectors(r.b, r.a);
      const len = dir.length();
      const mid = new THREE.Vector3().addVectors(r.a, r.b).multiplyScalar(0.5);
      const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
      const euler = new THREE.Euler().setFromQuaternion(quat);
      return (
        <mesh key={`rung-${i}`} position={mid} rotation={euler}>
          <cylinderGeometry args={[0.028, 0.028, len, 6]} />
          <meshStandardMaterial color="#e8e8e8" transparent opacity={0.6} emissive="#FFC000" emissiveIntensity={0.14} />
        </mesh>
      );
    });

  return (
    <group ref={group} rotation={[0.12, 0, 0.1]}>
      {strandMeshes}
      {renderRungs()}
    </group>
  );
}

function OrbitRing({ radius, tilt, color }: { radius: number; tilt: number; color: string }) {
  return (
    <mesh rotation={[Math.PI / 2 + tilt, 0, 0]}>
      <torusGeometry args={[radius, 0.008, 8, 64]} />
      <meshStandardMaterial color={color} transparent opacity={0.35} />
    </mesh>
  );
}

export default function DnaShowcase({ mobile = false }: { mobile?: boolean }) {
  const scrollRef = useRef(0);
  useEffect(() => {
    const onScroll = () => {
      scrollRef.current = window.scrollY;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <Canvas
      dpr={[1, mobile ? 1.3 : 2]}
      camera={{ position: [0, 0, 7], fov: 40 }}
      gl={{ antialias: !mobile, alpha: true }}
      style={{ background: "transparent" }}
      aria-hidden="true"
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 6, 6]} intensity={1.1} color="#fff4d6" />
      <pointLight position={[-4, -2, 2]} intensity={26} color="#FFC000" distance={12} />
      <Environment resolution={96}>
        <Lightformer intensity={1.6} position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[8, 8, 1]} color="#fff1c9" />
        <Lightformer intensity={1.1} position={[-4, 0, -1]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} color="#ffe2a0" />
      </Environment>
      <Float speed={1.1} rotationIntensity={0.15} floatIntensity={0.4}>
        <Helix mobile={mobile} scrollRef={scrollRef} />
      </Float>
      <OrbitRing radius={2.4} tilt={0.4} color="#FFC000" />
      <OrbitRing radius={2.9} tilt={-0.25} color="#29ABE2" />
    </Canvas>
  );
}
