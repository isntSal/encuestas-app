import { useState, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';

/* ══════════════════════════════════════════════════════════════
   CyberBarChart — 3D glass bar chart for survey results
   ══════════════════════════════════════════════════════════════ */

const BAR_COLORS  = ['#0f172a', '#10b981', '#6366f1', '#f59e0b', '#06b6d4'];
const DEMO_H      = [0.65, 0.35, 0.82, 0.48, 0.57];

/* ──── Interactive Bee ──── */
function InteractiveBee() {
  const groupRef = useRef();
  const leftWingRef = useRef();
  const rightWingRef = useRef();

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Smooth follow mouse (mapped to a reasonable 3D area)
    const targetX = state.mouse.x * 6;
    const targetY = state.mouse.y * 3 + 2; // hover above ground
    
    // Lerp position towards target
    groupRef.current.position.x += (targetX - groupRef.current.position.x) * 2 * delta;
    groupRef.current.position.y += (targetY - groupRef.current.position.y) * 2 * delta;
    
    // Add organic hovering/erratic motion
    const time = state.clock.elapsedTime;
    groupRef.current.position.y += Math.sin(time * 3) * 0.01;
    groupRef.current.position.z = 2 + Math.cos(time * 2) * 0.5; // keep it in foreground
    
    // Subtle rotation based on movement
    groupRef.current.rotation.y = (targetX - groupRef.current.position.x) * -0.2;
    groupRef.current.rotation.z = (targetX - groupRef.current.position.x) * -0.1;
    groupRef.current.rotation.x = Math.sin(time * 2) * 0.1;

    // Fast wing flapping (Z-axis rotation)
    if (leftWingRef.current && rightWingRef.current) {
      const flapAngle = Math.sin(time * 50) * 0.6; // rapid sine wave
      leftWingRef.current.rotation.z = flapAngle;
      rightWingRef.current.rotation.z = -flapAngle;
    }
  });

  return (
    <group ref={groupRef} position={[0, 2, 2]}>
      {/* Body: Yellow capsule */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.2, 0.4, 8, 16]} />
        <meshStandardMaterial color="#fcd34d" roughness={0.3} />
      </mesh>
      
      {/* Black Stripes */}
      <mesh position={[0, 0, -0.1]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.201, 0.06, 8, 24]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.201, 0.06, 8, 24]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} />
      </mesh>

      {/* Head/Eyes */}
      <mesh position={[0.08, 0.1, 0.25]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[-0.08, 0.1, 0.25]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      {/* Wings */}
      {/* Pivot points shifted outwards slightly so they hinge correctly */}
      <group ref={leftWingRef} position={[0.15, 0.15, 0]}>
        {/* Actual wing mesh offset from pivot */}
        <mesh position={[0.2, 0, 0]} rotation={[0.2, 0, 0]}>
          <boxGeometry args={[0.4, 0.02, 0.2]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.4} roughness={0.1} />
        </mesh>
      </group>
      
      <group ref={rightWingRef} position={[-0.15, 0.15, 0]}>
        <mesh position={[-0.2, 0, 0]} rotation={[-0.2, 0, 0]}>
          <boxGeometry args={[0.4, 0.02, 0.2]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.4} roughness={0.1} />
        </mesh>
      </group>
    </group>
  );
}

/* ──── Y-axis percentage labels (HTML overlay) ──── */
function YAxisLabels({ maxH }) {
  const ticks = [0, 25, 50, 75, 100];
  return (
    <Html
      position={[-2.2, 0, 0]}
      style={{ pointerEvents: 'none', userSelect: 'none' }}
    >
      <div style={{ position: 'relative', height: `${maxH * 60}px`, display: 'flex', flexDirection: 'column-reverse', justifyContent: 'space-between' }}>
        {ticks.map(t => (
          <div key={t} style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(71,85,105,0.7)', fontFamily: 'Inter,sans-serif', textAlign: 'right', lineHeight: 1 }}>
            {t}%
          </div>
        ))}
      </div>
    </Html>
  );
}

/* ──── Single 3D glass bar ──── */
function GlassBar({ position, targetHeight, color, label, isHovered, onHover, onUnhover, pct }) {
  const meshRef   = useRef();
  const lightRef  = useRef();
  const currentH  = useRef(0.01);

  useFrame((_, delta) => {
    currentH.current += (targetHeight - currentH.current) * Math.min(delta * 4, 1);
    if (meshRef.current) {
      meshRef.current.scale.y    = Math.max(0.01, currentH.current);
      meshRef.current.position.y = currentH.current / 2;
    }
    if (lightRef.current) {
      lightRef.current.position.y = currentH.current + 0.5;
    }
  });

  const barColor = new THREE.Color(color);

  return (
    <group position={position}>
      {/* Main glass bar */}
      <mesh
        ref={meshRef}
        onPointerOver={e => { e.stopPropagation(); onHover(); }}
        onPointerOut={e  => { e.stopPropagation(); onUnhover(); }}
        scale-y={0.01}
        position-y={0.005}
      >
        <boxGeometry args={[0.55, 1, 0.55]} />
        <meshPhysicalMaterial
          transmission={0.88}
          transparent
          opacity={isHovered ? 0.97 : 0.82}
          roughness={0.06}
          thickness={2.5}
          color={barColor}
          emissive={barColor}
          emissiveIntensity={isHovered ? 0.2 : 0.02}
          metalness={0.05}
          clearcoat={1}
          clearcoatRoughness={0.04}
          ior={1.5}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Glow light */}
      <pointLight
        ref={lightRef}
        color={color}
        intensity={isHovered ? 2 : 0.8}
        distance={5}
        decay={2}
        position={[0, 1, 0]}
      />

      {/* Label below bar */}
      <Html position={[0, -0.28, 0]} center distanceFactor={9} style={{ pointerEvents: 'none', userSelect: 'none' }}>
        <div style={{
          textAlign: 'center',
          fontFamily: 'Inter, sans-serif',
          fontSize: '11px',
          fontWeight: 700,
          color: isHovered ? color : 'rgba(51,65,85,0.85)',
          textShadow: isHovered ? `0 0 8px ${color}` : 'none',
          whiteSpace: 'nowrap',
          maxWidth: '90px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          transition: 'color 0.2s',
        }}>
          {label}
        </div>
      </Html>

      {/* Percentage badge above bar — clamped so it never overflows viewport */}
      <Html position={[0, Math.min(targetHeight + 0.35, 2.5), 0]} center distanceFactor={9} style={{ pointerEvents: 'none', userSelect: 'none' }}>
        <div style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: isHovered ? '13px' : '11px',
          fontWeight: 800,
          color: isHovered ? '#fff' : '#1e293b',
          background: isHovered ? 'rgba(15,23,42,0.9)' : 'rgba(255,255,255,0.65)',
          border: `1px solid ${color}${isHovered ? '90' : '40'}`,
          borderRadius: '6px',
          padding: '2px 8px',
          boxShadow: isHovered ? `0 4px 12px rgba(0,0,0,0.15)` : '0 2px 6px rgba(0,0,0,0.05)',
          whiteSpace: 'nowrap',
          transition: 'all 0.2s',
        }}>
          {pct}
        </div>
      </Html>
    </group>
  );
}

/* ──── Reflective grid floor ──── */
function ReflectiveFloor() {
  return (
    <Grid
      position={[0, -0.01, 0]}
      args={[20, 20]}
      cellSize={0.5}
      cellThickness={0.4}
      cellColor="#e2e8f0"
      sectionSize={2}
      sectionThickness={0.8}
      sectionColor="#cbd5e1"
      fadeDistance={14}
      fadeStrength={1.2}
      infiniteGrid
    />
  );
}

/* ──── Dashed grid lines (SVG overlay) — percentage guides ──── */

/* ──── Scene ──── */
function Scene({ opciones, results, isPublished }) {
  const [hoveredBar, setHoveredBar] = useState(null);

  const totalVotes  = Object.values(results).reduce((a, b) => a + b, 0);
  const hasRealData = isPublished && totalVotes > 0;
  const MAX_H = 2.2; // max bar height — kept conservative so badges never overflow

  const barData = useMemo(() => {
    const count   = Math.max(1, opciones.length);
    const spacing = Math.max(1.0, 5.5 / count); // auto-space based on count
    const startX  = -((count - 1) * spacing) / 2;

    return opciones.map((op, i) => {
      const ratio = hasRealData
        ? (totalVotes > 0 ? (results[op] || 0) / totalVotes : 0)
        : DEMO_H[i % DEMO_H.length];

      const votes  = hasRealData ? (results[op] || 0) : null;
      const pctNum = hasRealData ? Math.round(ratio * 100) : Math.round(DEMO_H[i % DEMO_H.length] * 100);
      const pct    = `${pctNum}%`;

      return {
        key:          op,
        label:        op,
        position:     [startX + i * spacing, 0, 0],
        targetHeight: Math.max(0.12, ratio * MAX_H),
        color:        BAR_COLORS[i % BAR_COLORS.length],
        pct:          votes !== null ? `${votes} · ${pct}` : pct,
      };
    });
  }, [opciones, results, isPublished, totalVotes, hasRealData]);

  return (
    <>
      <ambientLight intensity={0.7} color="#ffffff" />
      <directionalLight position={[4, 10, 6]}  intensity={0.6}  color="#ffffff" />
      <directionalLight position={[-4, 6, -4]} intensity={0.3} color="#cbd5e1" />

      {barData.map((bar, i) => (
        <GlassBar
          key={bar.key}
          index={i}
          position={bar.position}
          targetHeight={bar.targetHeight}
          color={bar.color}
          label={bar.label}
          pct={bar.pct}
          isHovered={hoveredBar === i}
          onHover={() => setHoveredBar(i)}
          onUnhover={() => setHoveredBar(null)}
        />
      ))}

      <ReflectiveFloor />

      {/* Fog starts far enough so tallest bars are never clipped */}
      <fog attach="fog" args={['#ffffff', 14, 26]} />
      <InteractiveBee />
    </>
  );
}

/* ──── Main export ──── */
export default function CyberBarChart({
  titulo,
  descripcion,
  pregunta,
  tipo,
  opciones = [],
  results  = {},
  isPublished = false,
}) {
  const totalVotes  = Object.values(results).reduce((a, b) => a + b, 0);
  const hasRealData = isPublished && totalVotes > 0;

  // ── Camera scales with bar count ──
  // Si/No (2 bars): z=9.5, fov=38, y=3.2  ← reference, do not change
  // Extra bars widen Z, FOV, and raise Y slightly for more breathing room
  const barCount  = Math.max(2, opciones.length);
  const extraBars = barCount - 2;
  const cameraZ   = 9.5 + extraBars * 1.5;   // 2→9.5  3→11  4→12.5  5→14
  const cameraFov = 38  + extraBars * 3;      // 2→38°  3→41° 4→44°   5→47°
  const cameraY   = 3.2 + extraBars * 0.15;  // 2→3.2  3→3.35 4→3.5  5→3.65

  return (
    <div className="w-full flex flex-col bg-transparent relative">

      {/* ── Top text area ── */}
      <div className="flex flex-col items-center px-6 pt-7 pb-0 gap-3">
        <h1
          className="text-3xl font-black tracking-tight uppercase leading-none text-center"
          style={{
            fontFamily: 'Outfit, Inter, sans-serif',
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {titulo || 'Nueva Encuesta'}
        </h1>

        {descripcion && (
          <div className="w-full max-w-2xl mx-auto glass-panel rounded-xl px-5 py-2.5">
            <div className="max-h-20 overflow-y-auto custom-scrollbar">
              <p className="text-xs text-slate-600 font-medium leading-relaxed text-center whitespace-pre-line">{descripcion}</p>
            </div>
          </div>
        )}

        {pregunta && (
          <div className="w-full max-w-xl mx-auto glass-panel rounded-xl px-5 py-2.5 text-center">
            <p className="text-sm text-slate-800 font-semibold leading-snug">{pregunta}</p>
          </div>
        )}
      </div>

      {/* ── 3D Canvas — fixed compact size ── */}
      <div
        className="relative mx-auto w-full bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-200"
        style={{ height: '300px', maxWidth: '680px' }}
      >
        {/* Border glow overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-10 rounded-3xl"
          style={{
            border: '1px solid rgba(255,255,255,0.05)',
            boxShadow: 'inset 0 0 40px rgba(0,0,0,0.3)',
          }}
        />

        <Canvas
          camera={{ position: [0, cameraY, cameraZ], fov: cameraFov }}
          gl={{
            antialias: true,
            alpha: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.3,
          }}
          style={{ background: 'transparent', width: '100%', height: '100%' }}
        >
          <Scene
            opciones={opciones}
            results={results}
            isPublished={isPublished}
            tipo={tipo}
          />
          <OrbitControls
            enablePan={false}
            enableZoom={false}
            minPolarAngle={Math.PI / 5}
            maxPolarAngle={Math.PI / 2.6}
            minAzimuthAngle={-Math.PI / 5}
            maxAzimuthAngle={Math.PI / 5}
            autoRotate
            autoRotateSpeed={0.35}
            dampingFactor={0.08}
            enableDamping
          />
        </Canvas>
      </div>

      {/* Live counter */}
      {hasRealData && (
        <div className="flex justify-center pb-4">
          <span
            className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 rounded-full"
            style={{
              background: 'rgba(15,23,42,0.1)',
              border: '1px solid rgba(15,23,42,0.2)',
              color: '#0f172a',
              boxShadow: '0 0 10px rgba(15,23,42,0.1)',
            }}
          >
            <span className="w-2 h-2 rounded-full bg-slate-900 animate-pulse" />
            {totalVotes} respuesta{totalVotes !== 1 ? 's' : ''} en vivo
          </span>
        </div>
      )}
    </div>
  );
}
