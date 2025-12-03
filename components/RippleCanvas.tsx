import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { VISUAL_CONFIG } from '../constants';

// Internal class for managing single ripple state
class Ripple {
  x: number;
  y: number;
  age: number;
  maxAge: number;
  active: boolean;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.age = 0;
    // 150ms per frame update logic? No, prompt says "diffusion speed 150ms/frame"
    // Wait, prompt says: "radius 5px to 80px... diffusion speed 150ms/frame"
    // That phrasing is ambiguous. Usually means 150ms per step or duration.
    // Let's interpret as: Smooth animation over approx 1.5 - 2 seconds.
    this.maxAge = 100; // Frames (approx 1.6s at 60fps)
    this.active = true;
  }

  update() {
    this.age++;
    if (this.age > this.maxAge) {
      this.active = false;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    // Normalized progress 0 to 1
    const progress = this.age / this.maxAge;
    
    // Radius easing: cubic out for "splash" feel, or linear. Let's do Linear to match "diffusion".
    // 5px start, 80px end.
    const currentRadius = 5 + (VISUAL_CONFIG.maxRadius - 5) * progress;

    // Opacity: 0.8 -> 0.2 -> 0
    let opacity = 0.8 * (1 - progress); 
    if (opacity < 0) opacity = 0;

    ctx.save();
    
    // Config for glowing effect
    ctx.shadowBlur = 10 + (progress * 10);
    ctx.shadowColor = `rgba(255, 255, 255, ${opacity})`;
    ctx.strokeStyle = `rgba(${VISUAL_CONFIG.rippleColor}, ${opacity})`;
    ctx.lineWidth = 2;

    // Draw 3-4 concentric rings
    // Inner rings are slightly smaller and fade faster
    const ringCount = 3;
    for (let i = 0; i < ringCount; i++) {
        const ringScale = 1 - (i * 0.15); // 100%, 85%, 70%
        const ringRadius = currentRadius * ringScale;
        
        if (ringRadius > 0) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, ringRadius, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    ctx.restore();
  }
}

export interface RippleCanvasHandle {
  addRipple: (x?: number, y?: number) => void;
}

const RippleCanvas = forwardRef<RippleCanvasHandle, {}>((props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ripplesRef = useRef<Ripple[]>([]);
  const animationFrameRef = useRef<number>(0);

  // Expose addRipple method to parent
  useImperativeHandle(ref, () => ({
    addRipple: (x?: number, y?: number) => {
      if (!canvasRef.current) return;
      
      const targetX = x ?? Math.random() * canvasRef.current.width;
      const targetY = y ?? Math.random() * canvasRef.current.height;
      
      ripplesRef.current.push(new Ripple(targetX, targetY));
    }
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize handler
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial size

    // Animation Loop
    const render = () => {
      // Clear with background color (to handle transparency trails if needed, but explicit clear is better)
      ctx.fillStyle = VISUAL_CONFIG.bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and Draw ripples
      // We iterate backwards to allow safe removal
      for (let i = ripplesRef.current.length - 1; i >= 0; i--) {
        const ripple = ripplesRef.current[i];
        ripple.update();
        ripple.draw(ctx);
        
        if (!ripple.active) {
          ripplesRef.current.splice(i, 1);
        }
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="block absolute top-0 left-0 w-full h-full cursor-pointer"
    />
  );
});

export default RippleCanvas;