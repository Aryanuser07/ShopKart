import type { LucideIcon } from 'lucide-react';
import { Cloud, Code, Cpu, Globe, Lock, Zap, Shield, CreditCard, Sparkles } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useRef, useState } from 'react';
import { cn } from '../lib/utils';

const TILT_MAX = 9;
const TILT_SPRING = { stiffness: 300, damping: 28 } as const;
const GLOW_SPRING = { stiffness: 180, damping: 22 } as const;

export interface SpotlightItem {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
}

const DEFAULT_ITEMS: SpotlightItem[] = [
  {
    icon: Zap,
    title: 'Sub-100ms Instant Search',
    description: 'Debounced multi-attribute product search with real-time category filtering.',
    color: '#d97706',
  },
  {
    icon: Lock,
    title: 'Stripe Encrypted Checkout',
    description: '256-bit SSL secured payments in Test Sandbox mode with webhooks.',
    color: '#2563eb',
  },
  {
    icon: Globe,
    title: 'Pan-India Fulfillment',
    description: 'Fast express shipping serving over 10,000+ pin codes across India.',
    color: '#059669',
  },
  {
    icon: Code,
    title: 'Developer REST API',
    description: 'Clean TypeScript Node/Express backend with JWT & refresh token authorization.',
    color: '#7c3aed',
  },
  {
    icon: Cpu,
    title: 'Smart Stock Management',
    description: 'Automated low stock alerts and real-time inventory count sync.',
    color: '#0284c7',
  },
  {
    icon: Cloud,
    title: 'Cloudinary Image CDN',
    description: 'High-resolution media optimization with local fallback image storage.',
    color: '#db2777',
  },
];

interface CardProps {
  item: SpotlightItem;
  dimmed: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
}

function Card({ item, dimmed, onHoverStart, onHoverEnd }: CardProps) {
  const Icon = item.icon;
  const cardRef = useRef<HTMLDivElement>(null);

  const normX = useMotionValue(0.5);
  const normY = useMotionValue(0.5);

  const rawRotateX = useTransform(normY, [0, 1], [TILT_MAX, -TILT_MAX]);
  const rawRotateY = useTransform(normX, [0, 1], [-TILT_MAX, TILT_MAX]);

  const rotateX = useSpring(rawRotateX, TILT_SPRING);
  const rotateY = useSpring(rawRotateY, TILT_SPRING);
  const glowOpacity = useSpring(0, GLOW_SPRING);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    normX.set((e.clientX - rect.left) / rect.width);
    normY.set((e.clientY - rect.top) / rect.height);
  };

  const handleMouseEnter = () => {
    glowOpacity.set(1);
    onHoverStart();
  };

  const handleMouseLeave = () => {
    normX.set(0.5);
    normY.set(0.5);
    glowOpacity.set(0);
    onHoverEnd();
  };

  return (
    <motion.div
      animate={{
        scale: dimmed ? 0.96 : 1,
        opacity: dimmed ? 0.45 : 1,
      }}
      className={cn(
        'group relative flex flex-col gap-5 overflow-hidden rounded-2xl border p-6',
        'border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-md',
        'transition-[border-color] duration-300',
        'hover:border-slate-300'
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      ref={cardRef}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 900,
      }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      {/* Static accent tint */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          background: `radial-gradient(ellipse at 20% 20%, ${item.color}14, transparent 65%)`,
        }}
      />

      {/* Hover glow layer */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          opacity: glowOpacity,
          background: `radial-gradient(ellipse at 20% 20%, ${item.color}2e, transparent 65%)`,
        }}
      />

      {/* Shimmer sweep */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-[55%] -translate-x-full -skew-x-12 bg-gradient-to-r from-transparent via-slate-900/5 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[280%]"
      />

      {/* Icon badge */}
      <div
        className="relative z-10 flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
        style={{
          background: `${item.color}18`,
          boxShadow: `inset 0 0 0 1px ${item.color}30`,
        }}
      >
        <Icon size={18} strokeWidth={2} style={{ color: item.color }} />
      </div>

      {/* Text */}
      <div className="relative z-10 flex flex-col gap-2">
        <h3 className="font-bold text-sm text-slate-900 tracking-tight">
          {item.title}
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          {item.description}
        </p>
      </div>

      {/* Accent bottom line */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 h-[2px] w-0 rounded-full transition-all duration-500 group-hover:w-full"
        style={{
          background: `linear-gradient(to right, ${item.color}80, transparent)`,
        }}
      />
    </motion.div>
  );
}

export interface SpotlightCardsProps {
  items?: SpotlightItem[];
  eyebrow?: string;
  heading?: string;
  className?: string;
}

export default function SpotlightCards({
  items = DEFAULT_ITEMS,
  eyebrow = 'Platform Highlights',
  heading = 'Built for Modern E-Commerce',
  className,
}: SpotlightCardsProps) {
  const [hoveredTitle, setHoveredTitle] = useState<string | null>(null);

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-3xl px-6 sm:px-8 pt-9 pb-10',
        'bg-white/80 border border-slate-200/80 shadow-lg backdrop-blur-sm',
        className
      )}
    >
      {/* Header */}
      <div className="relative mb-8 flex flex-col gap-1.5">
        <p className="font-bold text-[10px] text-cyan-600 uppercase tracking-[0.22em]">
          {eyebrow}
        </p>
        <h2 className="font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
          {heading}
        </h2>
      </div>

      {/* Card grid */}
      <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(item => (
          <Card
            dimmed={hoveredTitle !== null && hoveredTitle !== item.title}
            item={item}
            key={item.title}
            onHoverEnd={() => setHoveredTitle(null)}
            onHoverStart={() => setHoveredTitle(item.title)}
          />
        ))}
      </div>
    </div>
  );
}
