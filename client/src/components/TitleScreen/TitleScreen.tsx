import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import './TitleScreen.css';

const LEAN_PRINCIPLES = [
  'Eliminate Waste • Kaizen',
  'Continuous Flow • Pull System',
  'Respect for People • Heijunka',
  'Value Stream Mapping • 5S',
  'Just-In-Time • Jidoka',
];

export const TitleScreen: React.FC = () => {
  const setShowTitleScreen = useGameStore((s) => s.setShowTitleScreen);
  const [phase, setPhase] = useState<'intro' | 'main' | 'exit'>('intro');
  const [principleIdx, setPrincipleIdx] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  // Cycle through lean principles
  useEffect(() => {
    const id = setInterval(() => {
      setPrincipleIdx((i) => (i + 1) % LEAN_PRINCIPLES.length);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  // Transition: intro → main after short delay
  useEffect(() => {
    const t = setTimeout(() => setPhase('main'), 600);
    return () => clearTimeout(t);
  }, []);

  // Particle / grid canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles: { x: number; y: number; vx: number; vy: number; r: number; alpha: number; color: string }[] = [];
    const COLORS = ['#00f3ff', '#9d00ff', '#ff00ff', '#00ff88'];
    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        r: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.6 + 0.2,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      });
    }

    let frame = 0;
    const draw = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Scrolling grid
      const gridSize = 60;
      const offset = (frame * 0.4) % gridSize;
      ctx.strokeStyle = 'rgba(0,243,255,0.06)';
      ctx.lineWidth = 1;
      for (let x = -gridSize + offset; x < canvas.width + gridSize; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = -gridSize + offset; y < canvas.height + gridSize; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }

      // Horizon glow
      const horizGrad = ctx.createLinearGradient(0, canvas.height * 0.55, 0, canvas.height * 0.75);
      horizGrad.addColorStop(0, 'rgba(0,243,255,0.08)');
      horizGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = horizGrad;
      ctx.fillRect(0, canvas.height * 0.55, canvas.width, canvas.height * 0.2);

      // Particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha * (0.7 + 0.3 * Math.sin(frame * 0.02 + p.x));
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const handleStart = () => {
    setPhase('exit');
    setTimeout(() => setShowTitleScreen(false), 700);
  };

  return (
    <div className={`title-screen title-screen--${phase}`}>
      <canvas ref={canvasRef} className="title-canvas" />

      <div className="title-content">
        {/* Badge */}
        <div className="title-badge">
          <span className="title-badge__icon">⚙️</span>
          <span>LEAN STRATEGY SIMULATION</span>
        </div>

        {/* Main logo */}
        <div className="title-logo-wrap">
          <h1 className="title-logo">
            <span className="title-logo__lean">LEAN</span>
            <span className="title-logo__ops">OPS</span>
            <span className="title-logo__ai"> AI</span>
          </h1>
          <div className="title-logo__tagline">Master the Factory. Eliminate Waste. Achieve Flow.</div>
        </div>

        {/* Rotating principle ticker */}
        <div className="title-principles">
          <span className="title-principles__label">PRINCIPLE:</span>
          <span className="title-principles__text" key={principleIdx}>
            {LEAN_PRINCIPLES[principleIdx]}
          </span>
        </div>

        {/* Feature pills */}
        <div className="title-features">
          {['🏭 3D Factory', '🤖 AI Advisor', '📋 Kanban Board', '🏆 Missions', '🌳 Skill Tree'].map((f) => (
            <span key={f} className="title-feature-pill">{f}</span>
          ))}
        </div>

        {/* CTA */}
        <button className="title-cta" onClick={handleStart}>
          <span className="title-cta__text">▶ LAUNCH SIMULATION</span>
          <span className="title-cta__glow" />
        </button>

        <p className="title-hint">Optimize your production line · Apply Lean principles · Climb the leaderboard</p>
      </div>

      {/* Corner decorations */}
      <div className="title-corner title-corner--tl" />
      <div className="title-corner title-corner--tr" />
      <div className="title-corner title-corner--bl" />
      <div className="title-corner title-corner--br" />

      {/* Version stamp */}
      <div className="title-version">v2.0 · DIGITAL AI LEAN PLATFORM</div>
    </div>
  );
};
