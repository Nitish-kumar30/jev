import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '../lib/useReducedMotion';

const PARTICLE_COUNT = 46;

/**
 * Fixed backdrop: a slowly drifting particle field over a static neon grid.
 * Purely decorative, hidden from assistive tech, and frozen when the user
 * asks for reduced motion.
 */
export default function GridBackdrop() {
  const canvasRef = useRef(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    let frame;
    let particles = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = Array.from({ length: PARTICLE_COUNT }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 1.8 + 0.4,
        vx: (Math.random() - 0.5) * 0.16,
        vy: (Math.random() - 0.5) * 0.16,
        hue: Math.random() > 0.5 ? '34, 230, 255' : '124, 92, 255',
        a: Math.random() * 0.4 + 0.15,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = window.innerWidth;
        if (p.x > window.innerWidth) p.x = 0;
        if (p.y < 0) p.y = window.innerHeight;
        if (p.y > window.innerHeight) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.hue}, ${p.a})`;
        ctx.fill();
      }
      frame = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
    };
  }, [reduced]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-[var(--color-void)]" />
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(34,230,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(124,92,255,0.08) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage:
            'radial-gradient(ellipse at 50% 0%, black 10%, transparent 78%)',
        }}
      />
      <div className="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(124,92,255,0.22),transparent_65%)] blur-2xl" />
      <div className="absolute bottom-0 right-0 h-[420px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(34,230,255,0.12),transparent_65%)] blur-2xl" />
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}
