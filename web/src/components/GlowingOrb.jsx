import React, { useEffect, useRef } from 'react';
import { VoiceState } from '../services/voiceEngine';

export default function GlowingOrb({ state = VoiceState.IDLE, audioRms = 0, size = 260 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let angle = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const baseRadius = size * 0.28;

      // React to audio RMS level
      const dynamicScale = state === VoiceState.LISTENING_FOR_COMMAND || state === VoiceState.SPEAKING
        ? 1 + (audioRms / 150)
        : 1;
      const r = baseRadius * dynamicScale;

      // Color Palette based on State
      let primaryColor = '#00F2FE';
      let secondaryColor = '#7F00FF';
      let glowColor = 'rgba(0, 242, 254, 0.45)';

      if (state === VoiceState.PAUSED) {
        primaryColor = '#EF4444';
        secondaryColor = '#991B1B';
        glowColor = 'rgba(239, 68, 68, 0.45)';
      } else if (state === VoiceState.HEARD_WAKE_WORD) {
        primaryColor = '#E100FF';
        secondaryColor = '#00F2FE';
        glowColor = 'rgba(225, 0, 255, 0.6)';
      } else if (state === VoiceState.PROCESSING) {
        primaryColor = '#F59E0B';
        secondaryColor = '#E100FF';
        glowColor = 'rgba(245, 158, 11, 0.5)';
      } else if (state === VoiceState.SPEAKING) {
        primaryColor = '#10B981';
        secondaryColor = '#00F2FE';
        glowColor = 'rgba(16, 185, 129, 0.5)';
      }

      // Outer Orbital Rings
      angle += state === VoiceState.PROCESSING ? 0.05 : 0.015;

      // Ring 1
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.55, 0, Math.PI * 2);
      ctx.strokeStyle = primaryColor;
      ctx.globalAlpha = 0.25;
      ctx.lineWidth = 2;
      ctx.setLineDash([12, 16]);
      ctx.stroke();
      ctx.restore();

      // Ring 2
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-angle * 1.3);
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.85, 0, Math.PI * 2);
      ctx.strokeStyle = secondaryColor;
      ctx.globalAlpha = 0.2;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 20]);
      ctx.stroke();
      ctx.restore();

      // Ambient Outer Glow
      const glowGrad = ctx.createRadialGradient(cx, cy, r * 0.4, cx, cy, r * 2.2);
      glowGrad.addColorStop(0, glowColor);
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Core Orb Gradient
      const orbGrad = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.25, r * 0.1, cx, cy, r);
      orbGrad.addColorStop(0, '#FFFFFF');
      orbGrad.addColorStop(0.3, primaryColor);
      orbGrad.addColorStop(1, secondaryColor);

      ctx.save();
      ctx.shadowColor = primaryColor;
      ctx.shadowBlur = 35;
      ctx.fillStyle = orbGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Audio Frequency Ripples when listening/speaking
      if (state === VoiceState.LISTENING_FOR_COMMAND || state === VoiceState.SPEAKING) {
        ctx.beginPath();
        for (let i = 0; i < 360; i += 10) {
          const rad = (i * Math.PI) / 180;
          const wave = Math.sin(rad * 6 + angle * 8) * (audioRms * 0.18);
          const px = cx + (r + 10 + wave) * Math.cos(rad);
          const py = cy + (r + 10 + wave) * Math.sin(rad);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.strokeStyle = primaryColor;
        ctx.globalAlpha = 0.6;
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [state, audioRms, size]);

  return (
    <div className="relative flex items-center justify-center select-none" style={{ width: size, height: size }}>
      <canvas
        ref={canvasRef}
        width={size * 1.5}
        height={size * 1.5}
        style={{ width: size * 1.25, height: size * 1.25 }}
        className="pointer-events-none"
      />
    </div>
  );
}
