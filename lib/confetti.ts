/**
 * A tiny, dependency-free confetti burst. Spawns a short-lived full-screen
 * canvas, throws coloured paper outward from the upper-middle of the screen,
 * lets gravity pull it down, then removes itself. Safe to call repeatedly.
 */
export function fireConfetti(): void {
  if (typeof window === "undefined") return;

  // Respect users who prefer reduced motion.
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  const canvas = document.createElement("canvas");
  canvas.style.cssText =
    "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:9999";
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }
  ctx.scale(dpr, dpr);

  const W = window.innerWidth;
  const H = window.innerHeight;
  const colors = ["#34d399", "#60a5fa", "#f472b6", "#fbbf24", "#a78bfa", "#f87171"];

  const particles = Array.from({ length: 150 }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 8;
    return {
      x: W / 2,
      y: H / 3,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 5, // bias the burst upward
      size: 5 + Math.random() * 6,
      color: colors[(Math.random() * colors.length) | 0],
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.35,
    };
  });

  const duration = 2600;
  const start = performance.now();

  const frame = (now: number) => {
    const elapsed = now - start;
    const life = Math.max(0, 1 - elapsed / duration);
    ctx.clearRect(0, 0, W, H);

    for (const p of particles) {
      p.vy += 0.18; // gravity
      p.vx *= 0.99;
      p.vy *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.spin;

      ctx.save();
      ctx.globalAlpha = life;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }

    if (elapsed < duration) {
      requestAnimationFrame(frame);
    } else {
      canvas.remove();
    }
  };

  requestAnimationFrame(frame);
}
