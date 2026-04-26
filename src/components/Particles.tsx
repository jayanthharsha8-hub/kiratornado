import { useEffect, useRef } from "react";

/** Lightweight canvas-based floating particles + fog overlay */
export const Particles = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    const particles: { x: number; y: number; r: number; vx: number; vy: number; alpha: number }[] = [];
    const COUNT = 40;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: 1 + Math.random() * 2,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -0.2 - Math.random() * 0.4,
        alpha: 0.15 + Math.random() * 0.35,
      });
    }

    let t = 0;
    function draw() {
      t += 0.005;
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      // Soft moving aura/smoke (two drifting radial gradients)
      const cx1 = canvas!.width * (0.3 + Math.sin(t) * 0.1);
      const cy1 = canvas!.height * (0.4 + Math.cos(t * 0.7) * 0.08);
      const aura1 = ctx!.createRadialGradient(cx1, cy1, 0, cx1, cy1, canvas!.width * 0.6);
      aura1.addColorStop(0, "rgba(0, 207, 255, 0.07)");
      aura1.addColorStop(1, "transparent");
      ctx!.fillStyle = aura1;
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height);

      const cx2 = canvas!.width * (0.7 + Math.cos(t * 1.1) * 0.1);
      const cy2 = canvas!.height * (0.75 + Math.sin(t * 0.9) * 0.06);
      const aura2 = ctx!.createRadialGradient(cx2, cy2, 0, cx2, cy2, canvas!.width * 0.5);
      aura2.addColorStop(0, "rgba(0, 240, 255, 0.05)");
      aura2.addColorStop(1, "transparent");
      ctx!.fillStyle = aura2;
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height);

      // Bottom fog band
      const fog = ctx!.createLinearGradient(0, canvas!.height * 0.6, 0, canvas!.height);
      fog.addColorStop(0, "transparent");
      fog.addColorStop(1, "rgba(0, 207, 255, 0.04)");
      ctx!.fillStyle = fog;
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height);

      // Particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -10) { p.y = canvas!.height + 10; p.x = Math.random() * canvas!.width; }
        if (p.x < -10) p.x = canvas!.width + 10;
        if (p.x > canvas!.width + 10) p.x = -10;

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(0, 240, 255, ${p.alpha})`;
        ctx!.fill();

        // glow
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(0, 240, 255, ${p.alpha * 0.15})`;
        ctx!.fill();
      }

      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 -z-10"
      style={{ opacity: 0.8 }}
    />
  );
};
