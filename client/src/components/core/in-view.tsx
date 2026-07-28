import React from 'react';
import { motion, Variants, Transition, UseInViewOptions } from 'framer-motion';

export interface InViewProps {
  children: React.ReactNode;
  variants?: Variants;
  transition?: Transition;
  viewOptions?: UseInViewOptions;
  as?: React.ElementType;
  className?: string;
}

const defaultVariants: Variants = {
  hidden: { opacity: 0, y: 25 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.21, 0.47, 0.32, 0.98],
      staggerChildren: 0.08
    }
  },
};

export function InView({
  children,
  variants = defaultVariants,
  transition,
  viewOptions,
  as: Component = 'div',
  className = '',
}: InViewProps) {
  const MotionComponent = motion(Component as any);

  const mergedViewport = {
    once: true,
    amount: 0.1,
    ...viewOptions
  };

  return (
    <MotionComponent
      initial="hidden"
      whileInView="visible"
      viewport={mergedViewport}
      variants={variants}
      transition={transition}
      className={className}
    >
      {children}
    </MotionComponent>
  );
}

export default InView;
