import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { getPointer, subscribeRaf, onResize } from '../lib/raf';
import { useMediaQuery } from '../lib/useMedia';

interface Star { x: number; y: number; r: number; a: number; s: number }

/** پس‌زمینه‌ی لایه‌لایه: هاله‌های نور (CSS) + میدان ستاره (کانواس) + گرید + نویز */
export function Backdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let stars: Star[] = [];

    const size = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(120, Math.floor(window.innerWidth / 12));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 1.4 + 0.3,
        a: Math.random(),
        s: Math.random() * 0.4 + 0.1,
      }));
    };

    const draw = (t: number) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);
      for (const st of stars) {
        const tw = (Math.sin(t / 700 + st.a * 10) + 1) / 2;
        ctx.globalAlpha = 0.22 + tw * 0.55;
        ctx.fillStyle = st.a > 0.6 ? '#5ef2ff' : '#a98cf0';
        ctx.beginPath();
        ctx.arc(st.x, (st.y + t * st.s * 0.02) % h, st.r, 0, 7);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    size();
    const unsubResize = onResize(size);
    const unsubRaf = reduced ? (() => { draw(0); return () => {}; })() : subscribeRaf((t) => draw(t));
    return () => { unsubResize(); unsubRaf(); };
  }, [reduced]);

  const spotRef = useRef<HTMLDivElement>(null);
  const fine = useMediaQuery('(hover: hover) and (pointer: fine)');

  /** هاله‌ای که با تأخیرِ نرم نشانگر را دنبال می‌کند؛ فقط روی دستگاهِ ماوس‌دار */
  useEffect(() => {
    const el = spotRef.current;
    if (!el || reduced || !fine) return;
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    return subscribeRaf(() => {
      const p = getPointer();
      if (!p.active) return;
      x += (p.x - x) * 0.12;
      y += (p.y - y) * 0.12;
      el.classList.add('is-live');
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });
  }, [fine, reduced]);

  return (
    <>
      <div className="v2-aurora" aria-hidden="true">
        <span className="a1" />
        <span className="a2" />
        <span className="a3" />
      </div>
      <canvas ref={canvasRef} className="v2-stars" aria-hidden="true" />
      <div className="v2-grid" aria-hidden="true" />
      <div ref={spotRef} className="v2-spot" aria-hidden="true" />
      <div className="v2-noise" aria-hidden="true" />
    </>
  );
}
