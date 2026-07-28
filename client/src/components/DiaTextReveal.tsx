import React from 'react';
import { motion } from 'framer-motion';

interface DiaTextRevealProps {
  text?: string;
  className?: string;
  colors?: string[];
}

export const DiaTextReveal: React.FC<DiaTextRevealProps> = ({
  text = 'ShopKart',
  className = '',
  colors = ['#242b27', '#eb9800', '#f59e0b']
}) => {
  const words = (text || 'ShopKart').split('');

  return (
    <motion.div
      initial={{ opacity: 0, y: -2 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`inline-flex items-center font-black tracking-tight ${className}`}
    >
      <span className="text-[#242b27] font-black text-xl tracking-tight">
        Shop<span className="text-[#eb9800]">Kart</span>
      </span>
    </motion.div>
  );
};

export default DiaTextReveal;
