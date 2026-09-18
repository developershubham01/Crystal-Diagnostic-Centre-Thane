"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, Float, ContactShadows } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * HeroCrystal — rotating crystal containing an abstract molecular structure.
 * Pure procedural geometry (no external assets). Interactive: drag to rotate,
 * pointer parallax. Complexity is reduced automatically on low-power devices.
 */

interface Atom {
  pos: [number, number, number];
  color: string;
  size: number;
}

const PALETTE = ["#FFC000", "#FFCE3E", "#F5F5F5", "#29ABE2", "#917300"];

function Molecule({ mobile }: { mobile: boolean }) {
  const group = useRef<THREE.Group>(null);

  const { atoms, bonds } = useMemo(() => {
    // Deterministic pseudo-random molecule
    const rand = (() => {
      let s = 42;
      return () => {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
      };
    })();
    const atoms: Atom[] = [{ pos: [0, 0, 0], color: "#FFC000", size: 0.34 }];
    const count = mobile ? 7 : 10;
    for (let i = 0; i < count; i++) {
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      const r = 0.9 + rand() * 1.15;
      atoms.push({
        pos: [
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta) * 0.8,
          r * Math.cos(phi),
        ],
        color: PALETTE[i % PALETTE.length],
        size: 0.12 + rand() * 0.1,
      });
    }
    const bonds: { from: THREE.Vector3; to: THREE.Vector3; mid: number }[] = [];
    for (let i = 1; i < atoms.length; i++) {
      bonds.push({
        from: new THREE.Vector3(...atoms[0].pos),
        to: new THREE.Vector3(...atoms[i].pos),
        mid: 0,
      });
    }
    // A few atom-to-atom bonds for a richer lattice
    for (let i = 1; i < atoms.length - 1; i += 2) {
      bonds.push({
        from: new THREE.Vector3(...atoms[i].pos),
        to: new THREE.Vector3(...atoms[i + 1].pos),
        mid: 0,
      });
    }
    return { atoms, bonds };
  }, [mobile]);

  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.12;
      group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.18) * 0.08;
    }
  });

  return (
    <group ref={group}>
      {atoms.map((a, i) => (
        <mesh key={`a-${i}`} position={a.pos}>
          <sphereGeometry args={[a.size, mobile ? 16 : 24, mobile ? 16 : 24]} />
          <meshStandardMaterial
            color={a.color}
            emissive={a.color}
            emissiveIntensity={i === 0 ? 0.5 : 0.22}
            metalness={0.25}
            roughness={0.28}
          />
        </mesh>
      ))}
      {bonds.map((b, i) => {
        const dir = new THREE.Vector3().subVectors(b.to, b.from);
        const len = dir.length();
        const mid = new THREE.Vector3().addVectors(b.from, b.to).multiplyScalar(0.5);
        const quat = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          dir.clone().normalize()
        );
        const euler = new THREE.Euler().setFromQuaternion(quat);
        return (
          <mesh key={`b-${i}`} position={mid} rotation={euler}>
            <cylinderGeometry args={[0.028, 0.028, len, 8]} />
            <meshStandardMaterial color="#f5f5f5" transparent opacity={0.75} emissive="#FFC000" emissiveIntensity={0.18} />
          </mesh>
        );
      })}
    </group>
  );
}

function CrystalShell({ quality }: { quality: "high" | "low" }) {
  const mesh = useRef<THREE.Mesh>(null);
  const geo = useMemo(() => new THREE.IcosahedronGeometry(2.05, quality === "high" ? 1 : 0), [quality]);
  useFrame((_, delta) => {
    if (mesh.current) mesh.current.rotation.y -= delta * 0.05;
  });
  return (
    <mesh ref={mesh} geometry={geo}>
      {quality === "high" ? (
        <meshPhysicalMaterial
          color="#2a2a2a"
          transmission={0.82}
          thickness={1.4}
          roughness={0.16}
          ior={1.42}
          metalness={0.1}
          clearcoat={0.7}
          clearcoatRoughness={0.25}
          transparent
          opacity={0.96}
        />
      ) : (
        <meshStandardMaterial
          color="#242424"
          transparent
          opacity={0.4}
          roughness={0.2}
          metalness={0.35}
          flatShading
        />
      )}
    </mesh>
  );
}

function Particles({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 2.6 + Math.random() * 1.8;
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 4.4;
      arr[i * 3] = r * Math.cos(theta);
      arr[i * 3 + 1] = y;
      arr[i * 3 + 2] = r * Math.sin(theta);
    }
    return arr;
  }, [count]);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.03;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.055} color="#FFC000" transparent opacity={0.65} sizeAttenuation />
    </points>
  );
}

function Rig({ enabled }: { enabled: boolean }) {
  useFrame((state) => {
    if (!enabled) return;
    const { camera, pointer } = state;
    camera.position.x += (pointer.x * 0.6 - camera.position.x + 0.0) * 0.03;
    camera.position.y += (pointer.y * 0.4 - camera.position.y) * 0.03;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function HeroCrystal({ mobile = false }: { mobile?: boolean }) {
  const quality: "high" | "low" = mobile ? "low" : "high";
  return (
    <Canvas
      dpr={[1, mobile ? 1.4 : 2]}
      camera={{ position: [0, 0.4, 6.2], fov: 42 }}
      gl={{ antialias: !mobile, alpha: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
      aria-hidden="true"
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} color="#fff4d6" />
      <pointLight position={[-4, -3, 2]} intensity={30} color="#FFC000" distance={12} />
      <pointLight position={[4, 3, -2]} intensity={22} color="#29ABE2" distance={12} />
      <Environment resolution={128}>
        <Lightformer intensity={2.2} position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[9, 9, 1]} color="#fff1c9" />
        <Lightformer intensity={1.4} position={[-5, 0, -2]} rotation-y={Math.PI / 2} scale={[7, 3, 1]} color="#ffe2a0" />
        <Lightformer intensity={1.1} position={[5, -1, 1]} rotation-y={-Math.PI / 2} scale={[7, 3, 1]} color="#bfe9f7" />
      </Environment>
      <Float speed={1.4} rotationIntensity={0.25} floatIntensity={0.55}>
        <CrystalShell quality={quality} />
        <Molecule mobile={mobile} />
      </Float>
      <Particles count={mobile ? 40 : 90} />
      <Rig enabled={!mobile} />
      {quality === "high" && <ContactShadows position={[0, -2.6, 0]} opacity={0.45} scale={9} blur={2.6} far={4} color="#000000" />}
    </Canvas>
  );
}
