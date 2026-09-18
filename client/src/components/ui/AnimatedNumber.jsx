import { useEffect, useRef, useState } from 'react';
import { animate, useReducedMotion, useInView } from 'framer-motion';

/**
 * Eased count-up. Renders the final value immediately under reduced motion
 * so data is always readable; re-animates from the previous value on change.
 */
export default function AnimatedNumber({ value = 0, suffix = '', prefix = '', decimals = 0, className, style }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { once: true, margin: '0px 0px -5% 0px' });
  const [display, setDisplay] = useState(reduce ? value : 0);
  const previous = useRef(0);

  useEffect(() => {
    if (!inView) return undefined;
    if (reduce) { setDisplay(value); previous.current = value; return undefined; }
    const controls = animate(previous.current, value, {
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v),
      onComplete: () => { previous.current = value; },
    });
    return () => controls.stop();
  }, [inView, value, reduce]);

  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: 'tabular-nums', ...style }}>
      {prefix}{Number(display).toFixed(decimals)}{suffix}
    </span>
  );
}
