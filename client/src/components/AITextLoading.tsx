import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AITextLoadingProps {
  texts?: string[];
  className?: string;
  interval?: number;
}

export const AITextLoading: React.FC<AITextLoadingProps> = ({
  texts = [
    "Thinking...",
    "Searching ShopKart Catalog...",
    "Analyzing Customer Preferences...",
    "Computing Best Deals...",
    "Recommending Products..."
  ],
  className = "",
  interval = 1200
}) => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTextIndex((prevIndex) => (prevIndex + 1) % texts.length);
    }, interval);

    return () => clearInterval(timer);
  }, [interval, texts.length]);

  return (
    <div className="flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="relative w-full px-4 py-2 text-center"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTextIndex}
            initial={{ opacity: 0, y: 15 }}
            animate={{
              opacity: 1,
              y: 0,
              backgroundPosition: ["200% center", "-200% center"],
            }}
            exit={{ opacity: 0, y: -15 }}
            transition={{
              opacity: { duration: 0.3 },
              y: { duration: 0.3 },
              backgroundPosition: {
                duration: 2.5,
                ease: "linear",
                repeat: Infinity,
              },
            }}
            className={`flex justify-center whitespace-nowrap bg-[length:200%_100%] bg-gradient-to-r from-[#242b27] via-[#eb9800] to-[#242b27] bg-clip-text font-black text-lg sm:text-xl text-transparent ${className}`}
          >
            {texts[currentTextIndex]}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default AITextLoading;
