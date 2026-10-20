import { useEffect, useRef } from 'react';

/**
 * Pointer effects that never hide or replace the real cursor (so clicks land exactly where the arrow is):
 *  - a soft mint glow that trails a little behind the pointer and tightens over clickable elements,
 *  - a ripple ring on every click,
 *  - a few drifting sparkles on fast moves.
 * Desktop only (fine pointer); off with prefers-reduced-motion. Everything is pointer-events: none.
 */
export default function Cursor() {
  const glow = useRef(null);
  const canvas = useRef(null);

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const c = canvas.current; const ctx = c.getContext('2d');
    let w = (c.width = innerWidth); let h = (c.height = innerHeight);
    const onResize = () => { w = c.width = innerWidth; h = c.height = innerHeight; };

    let mx = -100, my = -100, gx = mx, gy = my, lastX = mx, lastY = my, hover = false, visible = false;
    const parts = []; const rings = [];
    const spawn = (x, y, n) => {
      for (let i = 0; i < n; i++) parts.push({ x, y, vx: (Math.random() - .5) * 1.2, vy: (Math.random() - .5) * 1.2 - .2, life: 1, r: 1 + Math.random() * 1.6, hue: Math.random() < .85 ? '46,230,182' : '255,107,0' });
      if (parts.length > 90) parts.splice(0, parts.length - 90);
    };
    const onMove = (e) => {
      mx = e.clientX; my = e.clientY; visible = true;
      const d = Math.hypot(mx - lastX, my - lastY);
      if (d > 14) { spawn(mx, my, 1); lastX = mx; lastY = my; }
      hover = !!e.target.closest?.('a, button, [role="button"], [role="radio"], input, textarea, summary, label');
    };
    const onDown = (e) => { rings.push({ x: e.clientX, y: e.clientY, t: 0 }); spawn(e.clientX, e.clientY, 8); };
    const onLeave = () => { visible = false; };

    let raf;
    const loop = () => {
      gx += (mx - gx) * .22; gy += (my - gy) * .22;
      if (glow.current) {
        glow.current.style.transform = `translate(${gx}px, ${gy}px) translate(-50%,-50%) scale(${hover ? .7 : 1})`;
        glow.current.style.opacity = visible ? (hover ? .9 : .55) : 0;
      }
      ctx.clearRect(0, 0, w, h);
      for (let i = rings.length - 1; i >= 0; i--) {
        const r = rings[i]; r.t += .045;
        if (r.t >= 1) { rings.splice(i, 1); continue; }
        ctx.beginPath(); ctx.arc(r.x, r.y, 6 + r.t * 34, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(46,230,182,${(1 - r.t) * .8})`; ctx.lineWidth = 2 * (1 - r.t) + .5; ctx.stroke();
      }
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.x += p.vx; p.y += p.vy; p.vy += .01; p.life -= .03;
        if (p.life <= 0) { parts.splice(i, 1); continue; }
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.hue},${p.life * .8})`; ctx.fill();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    addEventListener('mousemove', onMove, { passive: true });
    addEventListener('mousedown', onDown);
    document.documentElement.addEventListener('mouseleave', onLeave);
    addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('mousemove', onMove); removeEventListener('mousedown', onDown);
      document.documentElement.removeEventListener('mouseleave', onLeave); removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <>
      <canvas ref={canvas} className="cur-canvas" aria-hidden="true" />
      <div ref={glow} className="cur-glow" aria-hidden="true" />
    </>
  );
}
