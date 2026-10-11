import { useEffect, useRef } from 'react';

/**
 * DnaStrand Component
 * 
 * Fits precisely between the user's reference red lines (~38.6° slant, ~76px thickness).
 * Runs edge-to-edge from the bottom border of the viewport to the right border of the viewport.
 * Both ends terminate off-screen, guaranteeing an unbroken, 100% continuous flow with zero on-screen cut-offs.
 * Features chunkier, thicker beads, rungs, and glowing backbones.
 */
export default function DnaStrand({ className = '' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let angle = 0;

    // Ambient bio-particles around the corridor
    const particleCount = 22;
    const particles = Array.from({ length: particleCount }, () => ({
      x: (Math.random() - 0.5) * 360,
      y: (Math.random() - 0.5) * 360,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      radius: Math.random() * 1.8 + 0.8,
      alpha: Math.random() * 0.35 + 0.15,
      phase: Math.random() * Math.PI * 2,
    }));

    // Resize handling with DPR for crisp retina display
    let width = 0;
    let height = 0;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width || 400;
      height = rect.height || 360;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.resetTransform();
      ctx.scale(dpr, dpr);
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    const render = () => {
      angle += 0.015; // Continuous helical flow

      ctx.clearRect(0, 0, width, height);

      // Slant angle: exactly 38.6 degrees from horizontal, matching the red corridor lines
      const baseAxisAngle = -0.674; // -38.6 degrees
      const ux = Math.cos(baseAxisAngle);
      const uy = Math.sin(baseAxisAngle);

      // Transverse normal vector
      const vx = -uy;
      const vy = ux;

      // Centerline connects:
      // Bottom border entry: (width - 245, height)
      // Right border exit: (width, height - 195)
      // Midpoint:
      const cx = width - 122.5;
      const cy = height - 97.5;

      // Thickness: radius = 38px (diameter 76px fits snug between the 76px red lines)
      const radius = 38;

      // Length: 530px ensures both ends extend completely past screen boundaries
      const strandLength = 530;
      const numPairs = 38;
      const totalTurns = 2.45;

      // ─── Ambient Glow in the Corridor ───────────────────────────
      const glowGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, radius * 3.2);
      glowGrad.addColorStop(0, 'rgba(14, 165, 233, 0.16)');
      glowGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.05)');
      glowGrad.addColorStop(1, 'rgba(3, 7, 18, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 3.2, 0, Math.PI * 2);
      ctx.fill();

      // ─── Ambient Floating Particles ─────────────────────────────
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.phase += 0.02;

        if (p.x < -width / 2) p.x = width / 2;
        if (p.x > width / 2) p.x = -width / 2;
        if (p.y < -height / 2) p.y = height / 2;
        if (p.y > height / 2) p.y = -height / 2;

        const pAlpha = p.alpha * (0.6 + 0.4 * Math.sin(p.phase));
        ctx.fillStyle = `rgba(56, 189, 248, ${pAlpha})`;
        ctx.beginPath();
        ctx.arc(cx + p.x, cy + p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // ─── Calculate 3D Base Pairs ────────────────────────────────
      const pairs = [];
      for (let i = 0; i < numPairs; i++) {
        const u = -strandLength / 2 + (i / (numPairs - 1)) * strandLength;
        const theta = angle + (i / (numPairs - 1)) * totalTurns * Math.PI * 2;

        // Strand 1 (Cyan)
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);
        const x1 = cx + u * ux + (radius * cosT) * vx;
        const y1 = cy + u * uy + (radius * cosT) * vy;
        const z1 = radius * sinT; // Depth: [-radius, +radius]

        // Strand 2 (Violet / Blue) - 180 degrees opposite
        const x2 = cx + u * ux - (radius * cosT) * vx;
        const y2 = cy + u * uy - (radius * cosT) * vy;
        const z2 = -z1;

        // Midpoint of hydrogen bond
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;

        pairs.push({
          i,
          u,
          theta,
          p1: { x: x1, y: y1, z: z1 },
          p2: { x: x2, y: y2, z: z2 },
          mid: { x: mx, y: my, z: 0 },
        });
      }

      // ─── Build Draw Queue with Z-Buffering ───────────────────────
      const drawQueue = [];

      // 1. Backbone Segments (Thicker, glowing)
      for (let i = 0; i < numPairs - 1; i++) {
        const curr = pairs[i];
        const next = pairs[i + 1];

        const zSeg1 = (curr.p1.z + next.p1.z) / 2;
        drawQueue.push({
          type: 'backbone',
          z: zSeg1,
          strand: 1,
          from: curr.p1,
          to: next.p1,
        });

        const zSeg2 = (curr.p2.z + next.p2.z) / 2;
        drawQueue.push({
          type: 'backbone',
          z: zSeg2,
          strand: 2,
          from: curr.p2,
          to: next.p2,
        });
      }

      // 2. Base-Pair Rungs
      pairs.forEach(pair => {
        drawQueue.push({
          type: 'rung_half',
          z: pair.p1.z * 0.5,
          from: pair.p1,
          to: pair.mid,
          strand: 1,
        });

        drawQueue.push({
          type: 'rung_half',
          z: pair.p2.z * 0.5,
          from: pair.p2,
          to: pair.mid,
          strand: 2,
        });

        drawQueue.push({
          type: 'center_node',
          z: 0,
          pos: pair.mid,
        });

        // 3. Nucleotide Beads (Thicker, bolder)
        drawQueue.push({
          type: 'bead',
          z: pair.p1.z,
          strand: 1,
          pos: pair.p1,
        });

        drawQueue.push({
          type: 'bead',
          z: pair.p2.z,
          strand: 2,
          pos: pair.p2,
        });
      });

      // Sort back-to-front
      drawQueue.sort((a, b) => a.z - b.z);

      // ─── Execute Draw Calls ─────────────────────────────────────
      drawQueue.forEach(item => {
        const depthNorm = Math.max(0, Math.min(1, (item.z + radius) / (2 * radius)));

        if (item.type === 'backbone') {
          const alpha = 0.35 + 0.65 * depthNorm;
          const lineWidth = 2.4 + 2.0 * depthNorm; // Thicker backbone curves
          ctx.beginPath();
          ctx.moveTo(item.from.x, item.from.y);
          ctx.lineTo(item.to.x, item.to.y);
          ctx.lineWidth = lineWidth;
          ctx.lineCap = 'round';

          if (item.strand === 1) {
            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
            if (depthNorm > 0.5) {
              ctx.shadowColor = 'rgba(56, 189, 248, 0.7)';
              ctx.shadowBlur = 10;
            } else {
              ctx.shadowBlur = 0;
            }
          } else {
            ctx.strokeStyle = `rgba(129, 140, 248, ${alpha})`;
            if (depthNorm > 0.5) {
              ctx.shadowColor = 'rgba(129, 140, 248, 0.7)';
              ctx.shadowBlur = 10;
            } else {
              ctx.shadowBlur = 0;
            }
          }
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        if (item.type === 'rung_half') {
          const alpha = 0.28 + 0.6 * depthNorm;
          const lineWidth = 1.6 + 1.4 * depthNorm; // Thicker rungs
          ctx.beginPath();
          ctx.moveTo(item.from.x, item.from.y);
          ctx.lineTo(item.to.x, item.to.y);
          ctx.lineWidth = lineWidth;
          ctx.lineCap = 'round';

          if (item.strand === 1) {
            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
          } else {
            ctx.strokeStyle = `rgba(165, 180, 252, ${alpha})`;
          }
          ctx.stroke();
        }

        if (item.type === 'center_node') {
          ctx.beginPath();
          ctx.arc(item.pos.x, item.pos.y, 2.0, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
          ctx.fill();
        }

        if (item.type === 'bead') {
          // Thicker, chunkier beads
          const beadRadius = 3.2 + 2.8 * depthNorm;
          const alpha = 0.45 + 0.55 * depthNorm;

          ctx.beginPath();
          ctx.arc(item.pos.x, item.pos.y, beadRadius, 0, Math.PI * 2);

          if (item.strand === 1) {
            const beadGrad = ctx.createRadialGradient(
              item.pos.x - beadRadius * 0.3,
              item.pos.y - beadRadius * 0.3,
              beadRadius * 0.1,
              item.pos.x,
              item.pos.y,
              beadRadius
            );
            beadGrad.addColorStop(0, `rgba(224, 242, 254, ${alpha})`);
            beadGrad.addColorStop(0.4, `rgba(56, 189, 248, ${alpha})`);
            beadGrad.addColorStop(1, `rgba(2, 132, 199, ${alpha})`);
            ctx.fillStyle = beadGrad;

            if (depthNorm > 0.5) {
              ctx.shadowColor = 'rgba(56, 189, 248, 0.9)';
              ctx.shadowBlur = 14 * depthNorm;
            } else {
              ctx.shadowBlur = 0;
            }
          } else {
            const beadGrad = ctx.createRadialGradient(
              item.pos.x - beadRadius * 0.3,
              item.pos.y - beadRadius * 0.3,
              beadRadius * 0.1,
              item.pos.x,
              item.pos.y,
              beadRadius
            );
            beadGrad.addColorStop(0, `rgba(238, 242, 255, ${alpha})`);
            beadGrad.addColorStop(0.4, `rgba(129, 140, 248, ${alpha})`);
            beadGrad.addColorStop(1, `rgba(79, 70, 229, ${alpha})`);
            ctx.fillStyle = beadGrad;

            if (depthNorm > 0.5) {
              ctx.shadowColor = 'rgba(129, 140, 248, 0.9)';
              ctx.shadowBlur = 14 * depthNorm;
            } else {
              ctx.shadowBlur = 0;
            }
          }

          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ filter: 'drop-shadow(0 0 28px rgba(56, 189, 248, 0.18))' }}
      />
    </div>
  );
}
