import React from 'react';
import { motion } from 'framer-motion';

interface ShimmerTextProps {
  text: string;
  className?: string;
}

export const ShimmerText: React.FC<ShimmerTextProps> = ({
  text,
  className = ''
}) => {
  return (
    <motion.span
      animate={{
        backgroundPosition: ["200% center", "-200% center"],
      }}
      className={`bg-[length:200%_100%] bg-gradient-to-r from-white via-amber-300 to-white bg-clip-text font-extrabold text-transparent inline-block ${className}`}
      transition={{
        duration: 2.5,
        ease: "linear",
        repeat: Infinity,
      }}
    >
      {text}
    </motion.span>
  );
};

export default ShimmerText;
