import React, { useRef, useMemo, Suspense, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Text, Float, Sparkles } from '@react-three/drei';
import { useGameStore, StationId } from '../../store/gameStore';
import * as THREE from 'three';

// ── Station Positions along the conveyor belt ──
const stationPositions: Record<StationId, [number, number, number]> = {
  'raw-materials': [-9, 0, 0],
  'processing': [-4.5, 0, 0],
  'assembly': [0, 0, 0],
  'quality': [4.5, 0, 0],
  'shipping': [9, 0, 0],
};

const stationNames: Record<StationId, string> = {
  'raw-materials': 'RAW MATERIALS',
  'processing': 'PROCESSING',
  'assembly': 'ASSEMBLY',
  'quality': 'QUALITY CHECK',
  'shipping': 'SHIPPING',
};

const stationIcons: Record<StationId, string> = {
  'raw-materials': '📦',
  'processing': '⚙️',
  'assembly': '🤖',
  'quality': '🔍',
  'shipping': '🚀',
};

const statusColors: Record<string, { primary: string; emissive: string; glow: string }> = {
  optimal: { primary: '#00ff88', emissive: '#00aa55', glow: 'rgba(0, 255, 136, 0.4)' },
  warning: { primary: '#ffaa00', emissive: '#cc7700', glow: 'rgba(255, 170, 0, 0.4)' },
  bottleneck: { primary: '#ff0055', emissive: '#bb0033', glow: 'rgba(255, 0, 85, 0.6)' },
};

// ── Station Model ──
function Station({ stationId }: { stationId: StationId }) {
  const station = useGameStore((s) => s.stations[stationId]);
  const pos = stationPositions[stationId];
  const colors = statusColors[station?.status || 'optimal'];
  const [hovered, setHovered] = useState(false);

  const ringRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const radarRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.8;
    }
    if (coreRef.current) {
      coreRef.current.rotation.y = t * 0.5;
      coreRef.current.position.y = 1.1 + Math.sin(t * 2 + pos[0]) * 0.08;
    }
    if (radarRef.current) {
      radarRef.current.rotation.y = t * 1.2;
    }
  });

  const workloadPct = Math.min(100, Math.max(0, station?.workload || 40));
  const isBottleneck = station?.status === 'bottleneck';
  const isWarning = station?.status === 'warning';

  return (
    <group
      position={pos}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Platform Base */}
      <mesh position={[0, -0.15, 0]}>
        <cylinderGeometry args={[1.7, 1.9, 0.3, 8]} />
        <meshStandardMaterial color="#1e1e32" metalness={0.8} roughness={0.25} />
      </mesh>

      {/* Outer Hex Neon Ring */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.75, 1.85, 8]} />
        <meshBasicMaterial color={colors.primary} transparent opacity={hovered ? 0.9 : 0.6} side={THREE.DoubleSide} />
      </mesh>

      {/* Rotating Cyber Ring */}
      <mesh ref={ringRef} position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.3, 1.45, 6]} />
        <meshBasicMaterial color={hovered ? '#00f3ff' : colors.primary} transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>

      {/* Station Pillars */}
      {[-1, 1].map((x, i) => (
        <group key={i} position={[x * 1.1, 0.6, -0.6]}>
          <mesh>
            <boxGeometry args={[0.15, 1.2, 0.15]} />
            <meshStandardMaterial color="#2a2a44" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.65, 0]}>
            <sphereGeometry args={[0.12, 12, 12]} />
            <meshBasicMaterial color={colors.primary} />
          </mesh>
        </group>
      ))}

      {/* Scanner Arch overhead */}
      <mesh position={[0, 1.3, -0.6]}>
        <boxGeometry args={[2.35, 0.12, 0.2]} />
        <meshStandardMaterial color="#2a2a44" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Holographic Station Core */}
      <Float speed={2.5} rotationIntensity={0.2} floatIntensity={0.3}>
        <mesh ref={coreRef} position={[0, 1.1, 0]}>
          <octahedronGeometry args={[0.65, 0]} />
          <meshStandardMaterial
            color="#252542"
            emissive={colors.primary}
            emissiveIntensity={hovered ? 1.2 : isBottleneck ? 1.0 : 0.4}
            metalness={0.8}
            roughness={0.2}
            wireframe={false}
          />
        </mesh>
      </Float>

      {/* Workload Vertical Gauge Bar */}
      <group position={[1.4, 0.6, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.18, 1.2, 0.18]} />
          <meshStandardMaterial color="#10101c" />
        </mesh>
        <mesh position={[0, (workloadPct / 100) * 0.55 - 0.55, 0.02]}>
          <boxGeometry args={[0.14, (workloadPct / 100) * 1.1, 0.14]} />
          <meshBasicMaterial color={colors.primary} />
        </mesh>
      </group>

      {/* Rotating Radar on top of arch */}
      <group ref={radarRef} position={[0, 1.5, -0.6]}>
        <mesh rotation={[Math.PI / 4, 0, 0]}>
          <coneGeometry args={[0.25, 0.2, 8, 1, true]} />
          <meshBasicMaterial color={colors.primary} wireframe />
        </mesh>
      </group>

      {/* Station Text Label in 3D */}
      <Text
        position={[0, -0.45, 1.9]}
        rotation={[-Math.PI / 6, 0, 0]}
        fontSize={0.28}
        color={hovered ? '#ffffff' : colors.primary}
        anchorX="center"
        anchorY="middle"
      >
        {`${stationIcons[stationId]} ${stationNames[stationId]}`}
      </Text>

      {/* Subtitle / Efficiency */}
      <Text
        position={[0, -0.75, 1.9]}
        rotation={[-Math.PI / 6, 0, 0]}
        fontSize={0.18}
        color="#8888bb"
        anchorX="center"
        anchorY="middle"
      >
        {`EFF: ${Math.round(station?.efficiency || 80)}% | LOAD: ${workloadPct}%`}
      </Text>

      {/* Bottleneck Alert Beacon */}
      {isBottleneck && (
        <group position={[0, 2.3, 0]}>
          <pointLight color="#ff0055" intensity={4} distance={6} />
          <Sparkles count={35} scale={[1.8, 1.8, 1.8]} color="#ff0055" speed={1.2} size={3} />
          <Text position={[0, 0.3, 0]} fontSize={0.22} color="#ff0055" anchorX="center" anchorY="middle">
            ⚠️ BOTTLENECK
          </Text>
        </group>
      )}

      {/* Warning Alert */}
      {isWarning && !isBottleneck && (
        <group position={[0, 2.3, 0]}>
          <pointLight color="#ffaa00" intensity={2} distance={4} />
          <Sparkles count={20} scale={[1.5, 1.5, 1.5]} color="#ffaa00" speed={0.8} size={2} />
          <Text position={[0, 0.3, 0]} fontSize={0.2} color="#ffaa00" anchorX="center" anchorY="middle">
            ⚡ HIGH LOAD
          </Text>
        </group>
      )}

      {/* Optimal Sparkles */}
      {!isBottleneck && !isWarning && (
        <Sparkles count={12} scale={[1.5, 1.5, 1.5]} position={[0, 1.2, 0]} color="#00ff88" speed={0.4} size={1.8} />
      )}
    </group>
  );
}

// ── Conveyor Belt with Moving Material Crates ──
function ConveyorSystem() {
  const beltLength = 22;
  const cratesRef = useRef<THREE.Group>(null);

  // Animate moving cargo on the conveyor line
  useFrame((state) => {
    if (cratesRef.current) {
      cratesRef.current.children.forEach((child, index) => {
        const speed = 0.8;
        let x = child.position.x + speed * 0.03;
        if (x > beltLength / 2) {
          x = -beltLength / 2;
        }
        child.position.x = x;
        // Bobbing animation
        child.position.y = 0.05 + Math.sin(state.clock.elapsedTime * 4 + index) * 0.015;
      });
    }
  });

  const cratePositions = useMemo(() => [-8, -5, -2, 1, 4, 7], []);

  return (
    <group position={[0, -0.15, 0]}>
      {/* Main Track Beam */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[beltLength, 0.16, 1.4]} />
        <meshStandardMaterial color="#141424" metalness={0.9} roughness={0.3} />
      </mesh>

      {/* Glowing Neon Guide Rails */}
      <mesh position={[0, 0.12, 0.65]}>
        <boxGeometry args={[beltLength, 0.08, 0.08]} />
        <meshBasicMaterial color="#00f3ff" />
      </mesh>
      <mesh position={[0, 0.12, -0.65]}>
        <boxGeometry args={[beltLength, 0.08, 0.08]} />
        <meshBasicMaterial color="#00f3ff" />
      </mesh>

      {/* Moving Crates / WIP Items */}
      <group ref={cratesRef}>
        {cratePositions.map((initX, i) => (
          <group key={i} position={[initX, 0.05, 0]}>
            {/* Cargo Box */}
            <mesh position={[0, 0.18, 0]}>
              <boxGeometry args={[0.45, 0.35, 0.45]} />
              <meshStandardMaterial
                color={i % 2 === 0 ? '#0077ff' : '#9d00ff'}
                emissive={i % 2 === 0 ? '#0055cc' : '#7700cc'}
                emissiveIntensity={0.5}
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>
            {/* Cargo Glow Strip */}
            <mesh position={[0, 0.36, 0]}>
              <boxGeometry args={[0.47, 0.03, 0.47]} />
              <meshBasicMaterial color="#00f3ff" />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

// ── 3D Worker Droids ──
function Workers3D() {
  const workers = useGameStore((s) => s.workers);

  return (
    <group>
      {workers.map((worker, i) => {
        const stationPos = stationPositions[worker.current_station as StationId] || [0, 0, 0];
        const lateralOffset = (i % 2 === 0 ? -0.9 : 0.9);
        const zOffset = 1.3;

        return (
          <group
            key={worker.id}
            position={[stationPos[0] + lateralOffset, 0, stationPos[2] + zOffset]}
          >
            {/* Worker Shadow Ring */}
            <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.3, 16]} />
              <meshBasicMaterial color="#00f3ff" transparent opacity={0.3} />
            </mesh>

            {/* Droid Body */}
            <mesh position={[0, 0.45, 0]}>
              <cylinderGeometry args={[0.18, 0.22, 0.55, 8]} />
              <meshStandardMaterial color="#2d3748" metalness={0.8} roughness={0.3} />
            </mesh>

            {/* Glowing Chest Core */}
            <mesh position={[0, 0.5, 0.15]}>
              <sphereGeometry args={[0.07, 12, 12]} />
              <meshBasicMaterial color="#00f3ff" />
            </mesh>

            {/* Droid Head */}
            <mesh position={[0, 0.85, 0]}>
              <sphereGeometry args={[0.16, 16, 16]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.5} roughness={0.4} />
            </mesh>

            {/* Visor */}
            <mesh position={[0, 0.86, 0.12]}>
              <boxGeometry args={[0.22, 0.08, 0.1]} />
              <meshBasicMaterial color="#00ff88" />
            </mesh>

            {/* Worker Name & Avatar in 3D */}
            <Text
              position={[0, 1.25, 0]}
              fontSize={0.2}
              color="#00f3ff"
              anchorX="center"
              anchorY="middle"
            >
              {`${worker.avatar} ${worker.name}`}
            </Text>
          </group>
        );
      })}
    </group>
  );
}

// ── Hovering AI Drone ──
function AIDrone3D() {
  const droneRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (droneRef.current) {
      droneRef.current.position.y = 3.8 + Math.sin(t * 1.5) * 0.35;
      droneRef.current.position.x = Math.sin(t * 0.4) * 5;
      droneRef.current.rotation.y = t * 0.5;
    }
    if (ringRef.current) {
      ringRef.current.rotation.x = t * 2;
      ringRef.current.rotation.y = t * 1.5;
    }
  });

  return (
    <group ref={droneRef} position={[0, 3.8, -2]}>
      {/* Central Core */}
      <mesh>
        <dodecahedronGeometry args={[0.45]} />
        <meshStandardMaterial
          color="#0066cc"
          emissive="#00f3ff"
          emissiveIntensity={1.0}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* Gyroscopic Neon Ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[0.7, 0.03, 16, 32]} />
        <meshBasicMaterial color="#9d00ff" />
      </mesh>

      {/* Scan Beam Projected to Floor */}
      <mesh position={[0, -1.8, 0]}>
        <cylinderGeometry args={[0.1, 1.2, 3.5, 16, 1, true]} />
        <meshBasicMaterial color="#00f3ff" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>

      <pointLight color="#00f3ff" intensity={4} distance={10} />
      <Sparkles count={25} scale={[2.5, 2.5, 2.5]} color="#00f3ff" speed={0.8} size={2.5} />

      <Text position={[0, 0.8, 0]} fontSize={0.22} color="#00f3ff" anchorX="center" anchorY="middle">
        🤖 AI ADVISOR DRONE
      </Text>
    </group>
  );
}

// ── Futuristic Factory Floor & Cyber Grid ──
function CyberFloor() {
  return (
    <group position={[0, -0.6, 0]}>
      {/* Reflective Dark Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[70, 50]} />
        <meshStandardMaterial color="#080816" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Neon Cyber Grid Lines */}
      <gridHelper args={[70, 70, '#00f3ff', '#1a1a3a']} position={[0, 0.01, 0]} />
    </group>
  );
}

// ── Main Scene Canvas Component ──
export const FactoryScene: React.FC = () => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
        pointerEvents: 'auto',
      }}
    >
      <Canvas
        camera={{ position: [0, 8.5, 15], fov: 42 }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color('#050512'));
        }}
      >
        <Suspense fallback={null}>
          <color attach="background" args={['#050512']} />

          {/* Ambient & Directional Lighting - Vibrant Cyber Studio */}
          <ambientLight intensity={1.3} />
          <directionalLight position={[10, 20, 10]} intensity={2.5} color="#e0f2fe" castShadow />
          <directionalLight position={[-12, 12, -8]} intensity={1.8} color="#c084fc" />
          <pointLight position={[0, 10, 5]} intensity={3.0} color="#38bdf8" distance={30} />
          <pointLight position={[-9, 5, 2]} intensity={2.0} color="#00ff88" distance={15} />
          <pointLight position={[9, 5, 2]} intensity={2.0} color="#00f3ff" distance={15} />

          {/* Cosmic Starfield */}
          <Stars radius={120} depth={50} count={3500} factor={3} saturation={0.5} fade speed={0.8} />

          {/* Factory Infrastructure */}
          <CyberFloor />
          <ConveyorSystem />

          {/* 5 Lean Stations */}
          {(Object.keys(stationPositions) as StationId[]).map((sid) => (
            <Station key={sid} stationId={sid} />
          ))}

          {/* Animated Workers & Drone */}
          <Workers3D />
          <AIDrone3D />

          {/* Atmospheric Cyber Sparkles */}
          <Sparkles count={120} scale={[30, 8, 16]} position={[0, 3, 0]} color="#38bdf8" speed={0.3} size={1.6} opacity={0.5} />

          {/* Interactive Camera Orbit Controls */}
          <OrbitControls
            enablePan={true}
            minPolarAngle={Math.PI / 8}
            maxPolarAngle={Math.PI / 2.3}
            minDistance={6}
            maxDistance={28}
            enableDamping
            dampingFactor={0.08}
            target={[0, 1.2, 0]}
          />
        </Suspense>
      </Canvas>

      {/* Helper HUD hint */}
      <div
        style={{
          position: 'absolute',
          top: 68,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 5,
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'rgba(0, 243, 255, 0.7)',
          background: 'rgba(5, 5, 18, 0.6)',
          padding: '4px 14px',
          borderRadius: 16,
          border: '1px solid rgba(0, 243, 255, 0.2)',
          pointerEvents: 'none',
          letterSpacing: '1px',
        }}
      >
        🖱️ Drag to rotate 3D factory • Scroll to zoom • Right-drag to pan
      </div>
    </div>
  );
};
