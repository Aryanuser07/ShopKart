import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface SwooshTextProps {
  text?: string;
  className?: string;
  shadowColors?: {
    first?: string;
    second?: string;
    third?: string;
    fourth?: string;
    glow?: string;
  };
}

export default function SwooshText({
  text = 'ShopKart',
  className = '',
  shadowColors = {
    first: '#f59e0b',
    second: '#eb9800',
    third: '#d97706',
    fourth: '#b45309',
    glow: '#f59e0b',
  },
}: SwooshTextProps) {
  const textShadowStyle = {
    textShadow: `4px 4px 0px ${shadowColors.first}, 
                 8px 8px 0px ${shadowColors.second}, 
                 12px 12px 0px ${shadowColors.third}, 
                 16px 16px 0px ${shadowColors.fourth}, 
                 25px 25px 8px ${shadowColors.glow}`,
  };

  const noShadowStyle = {
    textShadow: 'none',
  };

  return (
    <div className="text-left inline-block">
      <motion.div
        className={cn(
          'cursor-pointer text-left font-black text-6xl sm:text-8xl md:text-9xl',
          'tracking-tight transition-all duration-200 ease-in-out',
          'text-slate-950 italic',
          className
        )}
        style={textShadowStyle}
        whileHover={noShadowStyle}
      >
        {text}
      </motion.div>
    </div>
  );
}
