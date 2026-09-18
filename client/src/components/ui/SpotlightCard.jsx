import { useCallback, useRef } from 'react';
import { motion, useMotionValue, useMotionTemplate, useReducedMotion } from 'framer-motion';
import { spring } from './motion';

/**
 * Card with a cursor-tracking radial spotlight and a subtle lift on hover.
 * Inspired by 21st.dev "spotlight" cards; pure transform/opacity so it stays on the GPU.
 */
export default function SpotlightCard({
  children,
  className = '',
  style,
  as: Tag = motion.div,
  spotlightColor = 'var(--primary-glow)',
  lift = true,
  ...rest
}) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const mx = useMotionValue(-1000);
  const my = useMotionValue(-1000);
  const background = useMotionTemplate`radial-gradient(420px circle at ${mx}px ${my}px, ${spotlightColor}, transparent 62%)`;

  const onMove = useCallback((e) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set(e.clientX - rect.left);
    my.set(e.clientY - rect.top);
  }, [mx, my]);

  const onLeave = useCallback(() => { mx.set(-1000); my.set(-1000); }, [mx, my]);

  return (
    <Tag
      ref={ref}
      className={`card spotlight ${className}`}
      style={{ position: 'relative', overflow: 'hidden', ...style }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      whileHover={lift && !reduce ? { y: -3, transition: spring } : undefined}
      {...rest}
    >
      <motion.div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.55,
          background, willChange: 'background',
        }}
      />
      <div style={{ position: 'relative', zIndex: 1, height: '100%' }}>{children}</div>
    </Tag>
  );
}
