import { useEffect, useLayoutEffect, useRef } from 'react';
import { acquireScrollLock } from '../lib/scrollLock';
import { useReducedMotionPreference } from '../lib/useMedia';

/** A single loading surface survives the HTML → React handoff without restarting its artwork. */
export function Preloader({ ready, onComplete }: { ready: boolean; onComplete: () => void }) {
  const bootstrap = useRef(document.getElementById('im-boot-loader'));
  const fallbackRef = useRef<HTMLDivElement>(null);
  const readyRef = useRef(ready); readyRef.current = ready;
  const completeRef = useRef(onComplete); completeRef.current = onComplete;
  const reduced = useReducedMotionPreference();
  const reducedRef = useRef(reduced); reducedRef.current = reduced;
  const checkRef = useRef<() => void>(() => {});
  const generation = useRef(0);

  useLayoutEffect(() => {
    const root = bootstrap.current ?? fallbackRef.current;
    if (!root) return;
    const version = ++generation.current;
    let active = true, completed = false, leaving = false, introDone = false;
    let fontsReady = !document.fonts;
    let departure = 0;
    const unlock = acquireScrollLock();
    document.documentElement.classList.add('im-booting');
    root.dataset.state = 'loading';
    const skip = root.querySelector<HTMLButtonElement>('.im-loader__skip');
    if (skip) skip.hidden = true;

    const finish = () => {
      if (!active || completed) return;
      completed = true;
      root.dataset.state = 'complete';
      document.documentElement.classList.remove('im-booting');
      unlock();
      if (bootstrap.current) root.remove();
      completeRef.current();
    };
    const check = () => {
      if (!active || completed) return;
      if (leaving) { if (reducedRef.current) finish(); return; }
      if (!readyRef.current || !fontsReady || (!introDone && !reducedRef.current)) return;
      leaving = true;
      root.dataset.state = 'leaving';
      if (reducedRef.current) finish();
      else departure = window.setTimeout(finish, 500);
    };
    checkRef.current = check;
    const arrive = () => { introDone = true; check(); };
    const animation = (event: AnimationEvent) => {
      if (event.animationName === 'im-loader-enter') arrive();
    };
    const transition = (event: TransitionEvent) => {
      if (event.target === root && event.propertyName === 'opacity' && leaving) finish();
    };
    root.addEventListener('animationend', animation);
    root.addEventListener('transitionend', transition);
    skip?.addEventListener('click', finish);
    // These are fallbacks for a missing animation event or a stalled font request;
    // elapsed time alone never reports a pending scene as ready.
    const intro = window.setTimeout(arrive, 950);
    const fontDeadline = window.setTimeout(() => { fontsReady = true; check(); }, 2500);
    const slow = window.setTimeout(() => { if (active && !completed && skip) skip.hidden = false; }, 6000);
    if (document.fonts) void document.fonts.ready.then(() => {
      if (!active) return;
      fontsReady = true; check();
    }).catch(() => { if (active) { fontsReady = true; check(); } });
    check();
    return () => {
      active = false;
      window.clearTimeout(intro); window.clearTimeout(fontDeadline);
      window.clearTimeout(slow); window.clearTimeout(departure);
      root.removeEventListener('animationend', animation);
      root.removeEventListener('transitionend', transition);
      skip?.removeEventListener('click', finish);
      document.documentElement.classList.remove('im-booting');
      unlock();
      checkRef.current = () => {};
      // StrictMode immediately acquires the same existing HTML node again.
      // Remove abandoned bootstrap markup only after a real unmount.
      if (bootstrap.current) queueMicrotask(() => {
        if (generation.current === version) root.remove();
      });
    };
  }, []);

  useEffect(() => { checkRef.current(); }, [ready, reduced]);

  if (bootstrap.current) return null;
  return <div ref={fallbackRef} id="im-boot-loader" className="im-loader" data-state="loading" role="status" aria-live="polite" aria-label="در حال آماده‌شدن سایت">
    <div className="im-loader__body">
      <img className="im-loader__art" src="./loader.svg" width="360" height="360" alt="" draggable={false} />
      <p className="im-loader__brand" dir="ltr">persianbotyar</p>
      <p className="im-loader__status"><span>در حال آماده‌شدن فضا</span><span className="im-loader__signal" aria-hidden="true"><i /><i /><i /></span></p>
      <button className="im-loader__skip" type="button" hidden>ورود به سایت</button>
    </div>
  </div>;
}
