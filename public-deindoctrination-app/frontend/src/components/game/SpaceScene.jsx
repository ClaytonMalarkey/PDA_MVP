import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useGame } from '../../context/GameContext';

// Sun at the center
function Sun() {
  const meshRef = useRef();
  useFrame((_, delta) => {
    meshRef.current.rotation.y += delta * 0.1;
  });
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.5, 32, 32]} />
      <meshStandardMaterial emissive="#ff8c00" emissiveIntensity={2} color="#ffa500" />
      <pointLight intensity={2} distance={100} color="#fff5e0" />
    </mesh>
  );
}

// Orbital ring
function OrbitRing({ radius }) {
  const points = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
    }
    return pts;
  }, [radius]);

  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);

  return (
    <line geometry={geometry}>
      <lineBasicMaterial color="#ffffff" opacity={0.12} transparent />
    </line>
  );
}

// Planet component
function Planet({ planet, isColonized, isSelected, onClick }) {
  const meshRef = useRef();
  const groupRef = useRef();
  const angleRef = useRef(Math.random() * Math.PI * 2);

  useFrame((_, delta) => {
    angleRef.current += planet.speed * delta * 10;
    const x = Math.cos(angleRef.current) * planet.distance;
    const z = Math.sin(angleRef.current) * planet.distance;
    groupRef.current.position.set(x, 0, z);
    meshRef.current.rotation.y += delta * 0.5;
  });

  return (
    <group ref={groupRef}>
      <mesh
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); onClick(planet); }}
        scale={isSelected ? 1.3 : 1}
      >
        <sphereGeometry args={[planet.size, 32, 32]} />
        <meshStandardMaterial
          color={planet.color}
          emissive={isColonized ? planet.color : '#000000'}
          emissiveIntensity={isColonized ? 0.3 : 0}
        />
      </mesh>
      {/* Colonized indicator */}
      {isColonized && (
        <mesh position={[0, planet.size + 0.3, 0]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial emissive="#00ff88" emissiveIntensity={3} color="#00ff88" />
        </mesh>
      )}
      {/* Selection ring */}
      {isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[planet.size + 0.2, planet.size + 0.35, 32]} />
          <meshBasicMaterial color="#00ffff" side={THREE.DoubleSide} transparent opacity={0.6} />
        </mesh>
      )}
      {/* Planet label */}
      <Html position={[0, -planet.size - 0.4, 0]} center distanceFactor={15}>
        <div style={{
          color: isColonized ? '#00ff88' : '#aaa',
          fontSize: '10px',
          fontWeight: isColonized ? 'bold' : 'normal',
          whiteSpace: 'nowrap',
          textShadow: '0 0 4px rgba(0,0,0,0.8)',
          pointerEvents: 'none',
          userSelect: 'none',
        }}>
          {planet.name}
        </div>
      </Html>
    </group>
  );
}

// Saturn's rings
function SaturnRings({ planet }) {
  const groupRef = useRef();
  const angleRef = useRef(Math.random() * Math.PI * 2);

  useFrame((_, delta) => {
    angleRef.current += planet.speed * delta * 10;
    const x = Math.cos(angleRef.current) * planet.distance;
    const z = Math.sin(angleRef.current) * planet.distance;
    groupRef.current.position.set(x, 0, z);
  });

  // This is a simplified approach - the rings follow Saturn
  return null; // Saturn rings handled in Planet component styling
}

// Asteroid belt between Mars and Jupiter
function AsteroidBelt() {
  const count = 200;
  const meshRef = useRef();

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 10.5 + Math.random() * 1.5;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
      pos[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return pos;
  }, []);

  useFrame((_, delta) => {
    meshRef.current.rotation.y += delta * 0.002;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#888888" />
    </points>
  );
}

// Main 3D scene
export default function SpaceScene() {
  const { PLANETS, colonizedPlanets, selectedPlanet, setSelectedPlanet } = useGame();

  return (
    <Canvas
      camera={{ position: [0, 20, 30], fov: 60 }}
      style={{ background: '#000011' }}
      onClick={() => setSelectedPlanet(null)}
    >
      <ambientLight intensity={0.15} />
      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
      <Sun />
      <AsteroidBelt />
      {PLANETS.map(planet => (
        <group key={planet.id}>
          <OrbitRing radius={planet.distance} />
          <Planet
            planet={planet}
            isColonized={colonizedPlanets.includes(planet.id)}
            isSelected={selectedPlanet?.id === planet.id}
            onClick={setSelectedPlanet}
          />
        </group>
      ))}
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={5}
        maxDistance={60}
        maxPolarAngle={Math.PI / 2.2}
      />
    </Canvas>
  );
}
