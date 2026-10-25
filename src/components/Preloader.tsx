import { useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { faDigit } from '../lib/fa';

/**
 * پرلودر کوتاه صفحه: درصد با ارقام فارسی تا ۱۰۰، سپس محو می‌شود.
 * روی «کاهش حرکت» اصلاً رندر نمی‌شود؛ کاربر مستقیم وارد صفحه می‌شود.
 */
export function Preloader() {
  const reduced = useReducedMotion();
  const [value, setValue] = useState(0);
  const [done, setDone] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (reduced) {
      setGone(true);
      return;
    }
    let current = 0;
    const timer = window.setInterval(() => {
      current = Math.min(100, current + Math.random() * 16 + 7);
      setValue(Math.round(current));
      if (current >= 100) {
        window.clearInterval(timer);
        window.setTimeout(() => setDone(true), 320);
        window.setTimeout(() => setGone(true), 1150);
      }
    }, 130);
    return () => window.clearInterval(timer);
  }, [reduced]);

  if (gone) return null;

  return (
    <div className={`v2-pre${done ? ' is-done' : ''}`} aria-hidden="true">
      <div className="v2-pre__box">
        <span className="v2-pre__mark">p</span>
        <span className="v2-pre__num">{faDigit(value)}٪</span>
        <span className="v2-pre__bar">
          <i style={{ width: `${value}%` }} />
        </span>
      </div>
    </div>
  );
}
