import React, { useEffect, useRef } from 'react';
import anime from '../utils/animeHelper';

interface AnimeScrollObserverProps {
  children: React.ReactNode;
  className?: string;
  staggerSelector?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'scale' | 'flip';
}

export const AnimeScrollObserver: React.FC<AnimeScrollObserverProps> = ({
  children,
  className = '',
  staggerSelector,
  delay = 0,
  direction = 'up'
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animatedRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !animatedRef.current) {
            animatedRef.current = true;

            const targets = staggerSelector
              ? el.querySelectorAll(staggerSelector)
              : el;

            if (direction === 'up') {
              anime({
                targets,
                opacity: [0, 1],
                translateY: [60, 0],
                rotateX: [10, 0],
                duration: 1100,
                easing: 'easeOutExpo',
                delay: staggerSelector ? anime.stagger(140, { start: delay }) : delay
              });
            } else if (direction === 'scale') {
              anime({
                targets,
                opacity: [0, 1],
                scale: [0.85, 1],
                translateY: [40, 0],
                duration: 1000,
                easing: 'easeOutBack(1.5)',
                delay: staggerSelector ? anime.stagger(120, { start: delay }) : delay
              });
            } else if (direction === 'flip') {
              anime({
                targets,
                opacity: [0, 1],
                rotateY: [-45, 0],
                translateZ: [-100, 0],
                duration: 1200,
                easing: 'easeOutCubic',
                delay: staggerSelector ? anime.stagger(150, { start: delay }) : delay
              });
            }
          }
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [staggerSelector, delay, direction]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
};
