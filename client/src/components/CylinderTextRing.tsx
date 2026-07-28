import React, { useEffect, useRef } from 'react';

interface CylinderTextRingProps {
  text?: string;
  radius?: number;
  speed?: number;
}

export const CylinderTextRing: React.FC<CylinderTextRingProps> = ({
  text = 'EVERYWHERE • SHOPKART AGENTIC • AI COMMERCE • ',
  radius = 240,
  speed = 0.008
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 1000);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 300);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    const fullText = (text + ' ').repeat(3);
    const chars = fullText.split('');
    const total = chars.length;

    let rotationY = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      rotationY += speed;

      const cx = width / 2;
      const cy = height / 2;
      const fov = 450;

      // Project each character onto 3D cylinder surface
      const projectedChars: Array<{
        char: string;
        x: number;
        y: number;
        z: number;
        scale: number;
        alpha: number;
        angle: number;
      }> = [];

      for (let i = 0; i < total; i++) {
        const charAngle = (i / total) * Math.PI * 2 + rotationY;
        
        // 3D Cylinder coordinates
        const x3d = Math.sin(charAngle) * radius;
        const z3d = Math.cos(charAngle) * radius;
        const y3d = Math.sin(charAngle * 0.5) * 15; // Subtle 3D wave tilt

        // Perspective projection
        const scale = fov / (fov + z3d + radius);
        const px = cx + x3d * scale;
        const py = cy + y3d * scale;

        // Calculate opacity based on Z position so back characters cull/fade out gracefully
        // z3d > 0 means FRONT of cylinder, z3d <= 0 means BACK of cylinder
        const normalZ = z3d / radius; // -1 (back) to +1 (front)
        const alpha = Math.max(0, Math.pow((normalZ + 0.95) / 1.95, 2.5));

        projectedChars.push({
          char: chars[i],
          x: px,
          y: py,
          z: z3d,
          scale,
          alpha,
          angle: charAngle
        });
      }

      // Sort characters by Z depth so front characters render on top of back characters!
      projectedChars.sort((a, b) => a.z - b.z);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (const p of projectedChars) {
        if (p.alpha < 0.05) continue; // Cull unreadable back text

        ctx.save();
        ctx.translate(p.x, p.y);

        // Compute 3D perspective scale and character rotation angle so text faces camera properly
        const fontSize = Math.max(14, Math.min(36, 26 * p.scale));
        ctx.font = `900 ${fontSize}px "Plus Jakarta Sans", "Inter", sans-serif`;

        // Front text glowing style
        if (p.z > 0) {
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 12 * p.scale;
          
          // Gradient fill
          const gradient = ctx.createLinearGradient(0, -fontSize / 2, 0, fontSize / 2);
          gradient.addColorStop(0, `rgba(255, 255, 255, ${p.alpha})`);
          gradient.addColorStop(0.5, `rgba(56, 189, 248, ${p.alpha})`);
          gradient.addColorStop(1, `rgba(129, 140, 248, ${p.alpha * 0.9})`);
          ctx.fillStyle = gradient;
        } else {
          ctx.shadowBlur = 0;
          ctx.fillStyle = `rgba(148, 163, 184, ${p.alpha * 0.25})`;
        }

        ctx.globalAlpha = p.alpha;
        ctx.fillText(p.char, 0, 0);
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [text, radius, speed]);

  return (
    <div className="relative w-full h-[280px] sm:h-[320px] flex items-center justify-center pointer-events-none overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};
