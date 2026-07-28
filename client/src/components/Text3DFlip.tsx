import React from 'react';
import { motion, Transition } from 'framer-motion';
import { cn } from '../lib/utils';

interface Text3DFlipProps {
  children: string;
  className?: string;
  textClassName?: string;
  flipTextClassName?: string;
  rotateDirection?: 'top' | 'bottom';
  staggerDuration?: number;
  staggerFrom?: 'first' | 'last' | 'center';
  transition?: Transition;
}

export default function Text3DFlip({
  children = 'ShopKart',
  className = '',
  textClassName = '',
  flipTextClassName = '',
  rotateDirection = 'top',
  staggerDuration = 0.03,
  staggerFrom = 'first',
  transition = { type: 'spring', damping: 25, stiffness: 160 }
}: Text3DFlipProps) {
  const characters = children.split('');

  const getDelay = (index: number) => {
    if (staggerFrom === 'last') {
      return (characters.length - 1 - index) * staggerDuration;
    }
    if (staggerFrom === 'center') {
      const center = Math.floor(characters.length / 2);
      return Math.abs(center - index) * staggerDuration;
    }
    return index * staggerDuration;
  };

  const initialRotate = rotateDirection === 'top' ? -90 : 90;
  const hoverRotate = rotateDirection === 'top' ? 90 : -90;

  return (
    <motion.div
      initial="initial"
      whileHover="hover"
      className={cn('relative inline-flex items-center overflow-hidden cursor-pointer select-none', className)}
    >
      {/* Primary Layer */}
      <div className="inline-flex items-center">
        {characters.map((char, i) => (
          <motion.span
            key={i}
            variants={{
              initial: { y: 0, rotateX: 0, opacity: 1 },
              hover: { y: '-100%', rotateX: hoverRotate, opacity: 0 },
            }}
            transition={{
              ...transition,
              delay: getDelay(i),
            }}
            className={cn('inline-block origin-bottom font-black', textClassName)}
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        ))}
      </div>

      {/* 3D Flipped Secondary Layer */}
      <div className="absolute inset-0 inline-flex items-center">
        {characters.map((char, i) => (
          <motion.span
            key={i}
            variants={{
              initial: { y: '100%', rotateX: initialRotate, opacity: 0 },
              hover: { y: 0, rotateX: 0, opacity: 1 },
            }}
            transition={{
              ...transition,
              delay: getDelay(i),
            }}
            className={cn('inline-block origin-top font-black', flipTextClassName)}
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        ))}
      </div>
    </motion.div>
  );
}
