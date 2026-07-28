import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

export type TypewriterSequence = {
  text: string;
  deleteAfter?: boolean;
  pauseAfter?: number;
};

export type TypewriterTitleProps = {
  sequences?: TypewriterSequence[];
  typingSpeed?: number;
  startDelay?: number;
  autoLoop?: boolean;
  loopDelay?: number;
  deleteSpeed?: number;
  pauseBeforeDelete?: number;
  naturalVariance?: boolean;
  className?: string;
};

const DEFAULT_SEQUENCES: TypewriterSequence[] = [
  { text: 'Agentic AI Shopping Engine', deleteAfter: true },
  { text: '3D Interactive Product Catalog', deleteAfter: true },
  { text: 'Instant Stripe Test Checkout', deleteAfter: true },
  { text: 'Automated Recommendation System', deleteAfter: false },
];

export default function TypewriterTitle({
  sequences = DEFAULT_SEQUENCES,
  typingSpeed = 45,
  startDelay = 200,
  autoLoop = true,
  loopDelay = 1200,
  deleteSpeed = 25,
  pauseBeforeDelete = 1200,
  naturalVariance = true,
  className = ''
}: TypewriterTitleProps) {
  const [displayText, setDisplayText] = useState('');
  const sequenceIndexRef = useRef(0);
  const charIndexRef = useRef(0);
  const isDeletingRef = useRef(false);
  const timeoutRef = useRef<any>(null);

  const sequencesRef = useRef(sequences);
  useEffect(() => {
    sequencesRef.current = sequences;
  }, [sequences]);

  useEffect(() => {
    const getTypingDelay = () => {
      if (!naturalVariance) {
        return typingSpeed;
      }

      const random = Math.random();
      if (random < 0.1) {
        return typingSpeed * 2;
      }
      if (random > 0.9) {
        return typingSpeed * 0.5;
      }

      const variance = 0.4;
      const min = typingSpeed * (1 - variance);
      const max = typingSpeed * (1 + variance);
      return Math.random() * (max - min) + min;
    };

    const runTypewriter = () => {
      const currentSequence = sequencesRef.current[sequenceIndexRef.current];
      if (!currentSequence) {
        return;
      }

      if (isDeletingRef.current) {
        if (charIndexRef.current > 0) {
          charIndexRef.current -= 1;
          setDisplayText(currentSequence.text.slice(0, charIndexRef.current));
          timeoutRef.current = setTimeout(runTypewriter, deleteSpeed);
        } else {
          isDeletingRef.current = false;
          const isLastSequence =
            sequenceIndexRef.current === sequencesRef.current.length - 1;

          if (isLastSequence && autoLoop) {
            timeoutRef.current = setTimeout(() => {
              sequenceIndexRef.current = 0;
              runTypewriter();
            }, loopDelay);
          } else if (!isLastSequence) {
            timeoutRef.current = setTimeout(() => {
              sequenceIndexRef.current += 1;
              runTypewriter();
            }, 100);
          }
        }
      } else if (charIndexRef.current < currentSequence.text.length) {
        charIndexRef.current += 1;
        setDisplayText(currentSequence.text.slice(0, charIndexRef.current));
        timeoutRef.current = setTimeout(runTypewriter, getTypingDelay());
      } else {
        const pauseDuration = currentSequence.pauseAfter ?? pauseBeforeDelete;

        if (currentSequence.deleteAfter) {
          timeoutRef.current = setTimeout(() => {
            isDeletingRef.current = true;
            runTypewriter();
          }, pauseDuration);
        } else {
          const isLastSequence =
            sequenceIndexRef.current === sequencesRef.current.length - 1;

          if (isLastSequence && autoLoop) {
            timeoutRef.current = setTimeout(() => {
              sequenceIndexRef.current = 0;
              charIndexRef.current = 0;
              setDisplayText('');
              runTypewriter();
            }, loopDelay);
          } else if (!isLastSequence) {
            timeoutRef.current = setTimeout(() => {
              sequenceIndexRef.current += 1;
              charIndexRef.current = 0;
              setDisplayText('');
              runTypewriter();
            }, pauseDuration);
          }
        }
      }
    };

    timeoutRef.current = setTimeout(runTypewriter, startDelay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [
    typingSpeed,
    deleteSpeed,
    pauseBeforeDelete,
    autoLoop,
    loopDelay,
    startDelay,
    naturalVariance,
  ]);

  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative z-10 flex flex-col items-start justify-start text-left">
        <motion.div
          animate={{ opacity: 1 }}
          className="flex items-center justify-start text-left gap-1 font-mono text-xl sm:text-3xl md:text-4xl font-bold tracking-tight"
          initial={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-block min-h-[1.2em] text-[#eb9800] text-left">
            {displayText}
          </span>
          <motion.span
            animate={{
              opacity: [1, 1, 0, 0],
            }}
            className="inline-block h-[0.9em] w-[3px] bg-[#f59e0b] rounded-full shrink-0"
            transition={{
              duration: 0.9,
              repeat: Infinity,
              repeatType: 'loop',
              ease: 'linear',
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}
