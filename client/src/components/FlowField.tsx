import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { cn } from '../lib/utils';

type ColorTheme = 'aurora' | 'ember' | 'ocean';
type ParticleDensity = 'sparse' | 'medium' | 'dense';

interface Particle {
  x: number;
  y: number;
  speed: number;
  hue: number;
  life: number;
  maxLife: number;
}

interface ThemeConfig {
  hueStart: number;
  hueRange: number;
  saturation: number;
  lightness: number;
  bg: string;
  trailAlpha: number;
}

export interface FlowFieldProps {
  className?: string;
  children?: ReactNode;
  theme?: ColorTheme;
  density?: ParticleDensity;
}

const PARTICLE_COUNTS: Record<ParticleDensity, number> = {
  sparse: 600,
  medium: 1200,
  dense: 2000,
} as const;

// Warm Editorial Amber Gold on Cream Alabaster #faf9f6
const THEMES: Record<ColorTheme, ThemeConfig> = {
  aurora: {
    hueStart: 38,
    hueRange: 35,
    saturation: 95,
    lightness: 45,
    bg: '250, 249, 246', // #faf9f6
    trailAlpha: 0.08,
  },
  ember: {
    hueStart: 30,
    hueRange: 25,
    saturation: 95,
    lightness: 48,
    bg: '252, 250, 245',
    trailAlpha: 0.09,
  },
  ocean: {
    hueStart: 185,
    hueRange: 50,
    saturation: 85,
    lightness: 44,
    bg: '248, 249, 250',
    trailAlpha: 0.08,
  },
} as const;

function fieldAngle(x: number, y: number, t: number): number {
  const s = 0.0025;
  return (
    Math.sin(x * s + t * 0.0007) * Math.PI +
    Math.cos(y * s + t * 0.0005) * Math.PI +
    Math.sin((x + y) * s * 0.6 + t * 0.0009) * Math.PI * 0.6 +
    Math.cos((x - y) * s * 0.4 + t * 0.0006) * Math.PI * 0.4
  );
}

export default function FlowField({
  className,
  children,
  theme = 'aurora',
  density = 'medium',
}: FlowFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cfg = THEMES[theme];
    const count = PARTICLE_COUNTS[density];
    const dpr = window.devicePixelRatio ?? 1;

    let width = 0;
    let height = 0;
    let animId = 0;
    let time = 0;
    let particles: Particle[] = [];

    const spawnParticle = (): Particle => {
      const maxLife = 200 + Math.floor(Math.random() * 300);
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        speed: 1.1 + Math.random() * 1.8,
        hue: cfg.hueStart + Math.random() * cfg.hueRange,
        life: Math.floor(Math.random() * maxLife),
        maxLife,
      };
    };

    const resize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.parentElement.clientWidth || window.innerWidth;
      height = canvas.parentElement.clientHeight || window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);

      ctx.fillStyle = `rgb(${cfg.bg})`;
      ctx.fillRect(0, 0, width, height);

      particles = Array.from({ length: count }, spawnParticle);
    };

    const render = () => {
      time++;

      ctx.fillStyle = `rgba(${cfg.bg}, ${cfg.trailAlpha})`;
      ctx.fillRect(0, 0, width, height);

      for (const p of particles) {
        const angle = fieldAngle(p.x, p.y, time);

        p.x += Math.cos(angle) * p.speed;
        p.y += Math.sin(angle) * p.speed;
        p.life++;

        if (p.life > p.maxLife) {
          p.x = Math.random() * width;
          p.y = Math.random() * height;
          p.life = 0;
          p.hue = cfg.hueStart + Math.random() * cfg.hueRange;
          continue;
        }

        if (p.x < 0) p.x += width;
        else if (p.x > width) p.x -= width;
        if (p.y < 0) p.y += height;
        else if (p.y > height) p.y -= height;

        const progress = p.life / p.maxLife;
        const fadeIn = Math.min(progress * 8, 1);
        const fadeOut = Math.min((1 - progress) * 6, 1);
        const alpha = fadeIn * fadeOut * 0.95;

        const hueMod = (p.hue + (angle / (Math.PI * 2)) * 50 + 360) % 360;

        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hueMod}, ${cfg.saturation}%, ${cfg.lightness}%, ${alpha})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    resize();
    window.addEventListener('resize', resize);
    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [theme, density]);

  const bgColor = THEMES[theme].bg;

  return (
    <div
      className={cn(
        'relative flex min-h-[85vh] w-full items-center justify-center overflow-hidden',
        className
      )}
      style={{ background: `rgb(${bgColor})` }}
    >
      <canvas
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        ref={canvasRef}
      />

      {/* Radial vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background: `radial-gradient(ellipse 65% 60% at 50% 50%, transparent 20%, rgba(${bgColor}, 0.95) 100%)`,
        }}
      />

      {/* Soft top / bottom fades */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-40 z-0"
        style={{
          background: `linear-gradient(to bottom, rgb(${bgColor}), transparent)`,
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 z-0"
        style={{
          background: `linear-gradient(to top, rgb(${bgColor}), transparent)`,
        }}
      />

      <div className="relative z-10 w-full">
        {children}
      </div>
    </div>
  );
}
