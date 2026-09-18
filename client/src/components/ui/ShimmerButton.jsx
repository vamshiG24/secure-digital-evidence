import { motion, useReducedMotion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { spring } from './motion';

/**
 * Primary CTA with a sweeping light shimmer, spring press feedback and a
 * built-in loading state that keeps the button width stable.
 */
export default function ShimmerButton({ children, loading = false, disabled, className = '', size = 'lg', style, ...rest }) {
  const reduce = useReducedMotion();
  return (
    <motion.button
      className={`btn btn-primary ${size === 'lg' ? 'btn-lg' : size === 'sm' ? 'btn-sm' : ''} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      whileHover={reduce ? undefined : { scale: 1.015 }}
      whileTap={reduce ? undefined : { scale: 0.975 }}
      transition={spring}
      style={{ position: 'relative', overflow: 'hidden', ...style }}
      {...rest}
    >
      {!reduce && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.28) 50%, transparent 70%)',
            backgroundSize: '250% 100%',
            animation: 'gradient-shift 2.8s linear infinite',
            pointerEvents: 'none',
          }}
        />
      )}
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, visibility: loading ? 'hidden' : 'visible' }}>
        {children}
      </span>
      {loading && (
        <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
          <Loader2 size={18} className="animate-spin" aria-label="Loading" />
        </span>
      )}
    </motion.button>
  );
}
