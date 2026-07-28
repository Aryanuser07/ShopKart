import React, { useEffect, useRef } from 'react';

export const ParticleCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Particles array
    const particlesCount = 120;
    const particles: Array<{
      x: number;
      y: number;
      z: number;
      radius: number;
      color: string;
      speed: number;
      alpha: number;
    }> = [];

    const colors = ['#38bdf8', '#818cf8', '#c084fc', '#34d399', '#f472b6'];

    for (let i = 0; i < particlesCount; i++) {
      particles.push({
        x: (Math.random() - 0.5) * width * 1.5,
        y: (Math.random() - 0.5) * height * 1.5,
        z: Math.random() * width,
        radius: Math.random() * 2.5 + 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.7 + 0.3
      });
    }

    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX - window.innerWidth / 2) * 0.05;
      mouseY = (e.clientY - window.innerHeight / 2) * 0.05;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const render = () => {
      ctx.fillStyle = 'rgba(2, 6, 23, 0.25)';
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.z -= p.speed;

        if (p.z <= 0) {
          p.z = width;
          p.x = (Math.random() - 0.5) * width * 1.5;
          p.y = (Math.random() - 0.5) * height * 1.5;
        }

        const k = 400 / p.z;
        const px = p.x * k + cx + mouseX;
        const py = p.y * k + cy + mouseY;
        const size = p.radius * k;

        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          ctx.beginPath();
          ctx.arc(px, py, Math.max(0.5, size), 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.min(1, Math.max(0.1, (1 - p.z / width) * p.alpha));
          ctx.fill();

          // Connect nearby points with light line trails
          if (i % 8 === 0) {
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px - (px - cx) * 0.05, py - (py - cy) * 0.05);
            ctx.strokeStyle = p.color;
            ctx.lineWidth = size * 0.5;
            ctx.globalAlpha = p.alpha * 0.2;
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  );
};
