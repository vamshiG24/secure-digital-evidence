import { motion, useReducedMotion } from 'framer-motion';
import { Inbox } from 'lucide-react';
import { fadeUp, stagger } from './motion';

export { default as SpotlightCard } from './SpotlightCard';
export { default as BorderBeam } from './BorderBeam';
export { default as ShimmerButton } from './ShimmerButton';
export { default as AnimatedNumber } from './AnimatedNumber';
export { default as Modal } from './Modal';
export * from './motion';

/** Stagger container: children using <Reveal.Item /> animate in sequence. */
export function Reveal({ children, each = 0.05, delay = 0, className, style, as: Tag = motion.div, ...rest }) {
  const reduce = useReducedMotion();
  return (
    <Tag
      className={className} style={style}
      variants={reduce ? undefined : stagger(each, delay)}
      initial={reduce ? false : 'hidden'} animate="visible" {...rest}
    >
      {children}
    </Tag>
  );
}
Reveal.Item = function RevealItem({ children, className, style, as: Tag = motion.div, ...rest }) {
  const reduce = useReducedMotion();
  return (
    <Tag className={className} style={style} variants={reduce ? undefined : fadeUp} {...rest}>
      {children}
    </Tag>
  );
};

export function Avatar({ name = '', src, size = 36, style }) {
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?';
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: Math.max(11, size * 0.38), ...style }} aria-hidden={src ? undefined : 'true'}>
      {src ? <img src={src} alt={name} /> : initials}
    </span>
  );
}

export function Badge({ variant = 'neutral', children, className = '', style }) {
  return <span className={`badge badge-${String(variant).toLowerCase().replace(/\s+/g, '-')} ${className}`} style={style}>{children}</span>;
}

export const statusVariant = (s = '') => {
  const k = s.toLowerCase();
  if (k.startsWith('in')) return 'progress';
  if (k === 'open') return 'open';
  if (k === 'closed') return 'closed';
  if (k === 'suspended') return 'suspended';
  return 'neutral';
};

export function Skeleton({ h = 16, w = '100%', r, style }) {
  return <div className="skeleton" style={{ height: h, width: w, borderRadius: r, ...style }} aria-hidden="true" />;
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}
    >
      <div style={{ width: 56, height: 56, margin: '0 auto 16px', borderRadius: 16, display: 'grid', placeItems: 'center', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-faint)' }}>
        <Icon size={24} />
      </div>
      <h3 style={{ fontSize: 16, marginBottom: 6 }}>{title}</h3>
      {description && <p style={{ fontSize: 14, maxWidth: 380, margin: '0 auto' }}>{description}</p>}
      {action && <div style={{ marginTop: 18 }}>{action}</div>}
    </motion.div>
  );
}

export function SectionTitle({ icon: Icon, children, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
      <h3 className="card-title">{Icon && <Icon size={17} style={{ color: 'var(--primary)' }} />}{children}</h3>
      {right}
    </div>
  );
}

export function IconTile({ icon: Icon, tone = 'primary', size = 40 }) {
  return (
    <span style={{ width: size, height: size, borderRadius: 12, display: 'grid', placeItems: 'center', flexShrink: 0, background: `var(--${tone}-soft)`, color: `var(--${tone})` }}>
      <Icon size={size * 0.48} />
    </span>
  );
}
