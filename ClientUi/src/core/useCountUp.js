import { useEffect, useRef, useState } from 'react';

const prefersReducedMotion = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
};

/** Animates a number from its previous value to `target` (ease-out). Jumps straight there for reduced motion. */
export default function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(prefersReducedMotion() ? target : 0);
  const from = useRef(0);

  useEffect(() => {
    const end = Number(target) || 0;
    if (prefersReducedMotion()) { setValue(end); from.current = end; return undefined; }
    const start = from.current;
    const t0 = performance.now();
    let frame;
    const tick = (now) => {
      const p = Math.min((now - t0) / duration, 1);
      const eased = 1 - (1 - p) ** 3;
      setValue(start + (end - start) * eased);
      if (p < 1) frame = requestAnimationFrame(tick);
      else from.current = end;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}
