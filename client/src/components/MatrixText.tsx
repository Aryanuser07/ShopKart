import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";

interface LetterState {
  char: string;
  isMatrix: boolean;
  isSpace: boolean;
}

interface MatrixTextProps {
  text?: string;
  className?: string;
  initialDelay?: number;
  letterAnimationDuration?: number;
  letterInterval?: number;
}

export const MatrixText = ({
  text = "SUBSCRIBED!",
  className = "",
  initialDelay = 100,
  letterAnimationDuration = 400,
  letterInterval = 80,
}: MatrixTextProps) => {
  const [letters, setLetters] = useState<LetterState[]>(() =>
    text.split("").map((char) => ({
      char,
      isMatrix: false,
      isSpace: char === " ",
    }))
  );
  const [isAnimating, setIsAnimating] = useState(false);

  const getRandomChar = useCallback(
    () => (Math.random() > 0.5 ? "1" : "0"),
    []
  );

  const animateLetter = useCallback(
    (index: number) => {
      if (index >= text.length) return;

      requestAnimationFrame(() => {
        setLetters((prev) => {
          const newLetters = [...prev];
          if (!newLetters[index].isSpace) {
            newLetters[index] = {
              ...newLetters[index],
              char: getRandomChar(),
              isMatrix: true,
            };
          }
          return newLetters;
        });

        setTimeout(() => {
          setLetters((prev) => {
            const newLetters = [...prev];
            newLetters[index] = {
              ...newLetters[index],
              char: text[index],
              isMatrix: false,
            };
            return newLetters;
          });
        }, letterAnimationDuration);
      });
    },
    [getRandomChar, text, letterAnimationDuration]
  );

  const startAnimation = useCallback(() => {
    if (isAnimating) return;

    setIsAnimating(true);
    let currentIndex = 0;

    const animate = () => {
      if (currentIndex >= text.length) {
        setIsAnimating(false);
        return;
      }

      animateLetter(currentIndex);
      currentIndex++;
      setTimeout(animate, letterInterval);
    };

    animate();
  }, [animateLetter, text, isAnimating, letterInterval]);

  useEffect(() => {
    const timer = setTimeout(startAnimation, initialDelay);
    return () => clearTimeout(timer);
  }, []);

  const motionVariants = useMemo(
    () => ({
      matrix: {
        color: "#eb9800",
        textShadow: "0 2px 4px rgba(235, 152, 0, 0.5)",
      },
    }),
    []
  );

  return (
    <div
      aria-label="Matrix text animation"
      className={`flex items-center justify-start text-[#242b27] ${className}`}
    >
      <div className="flex items-center justify-center">
        <div className="flex flex-wrap items-center justify-center">
          {letters.map((letter, index) => (
            <motion.div
              animate={letter.isMatrix ? "matrix" : "normal"}
              className="w-[1ch] overflow-hidden text-center font-mono text-sm font-black tracking-wider"
              initial="initial"
              key={`${index}-${letter.char}`}
              style={{
                display: "inline-block",
                fontVariantNumeric: "tabular-nums",
              }}
              transition={{
                duration: 0.1,
                ease: "easeInOut",
              }}
              variants={motionVariants}
            >
              {letter.isSpace ? "\u00A0" : letter.char}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MatrixText;
