import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle2, XCircle, ArrowUpRight, Inbox } from 'lucide-react';
import useNotifications from '../hooks/useNotifications.jsx';
import { Reveal, Skeleton, EmptyState, Badge, spring } from '../components/ui';

const TYPE = {
  info: { icon: Info, tone: 'primary' },
  warning: { icon: AlertTriangle, tone: 'warning' },
  success: { icon: CheckCircle2, tone: 'success' },
  error: { icon: XCircle, tone: 'danger' },
};

const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const groupLabel = (d) => {
  const date = new Date(d); const now = new Date();
  if (date.toDateString() === now.toDateString()) return 'Today';
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (date.toDateString() === y.toDateString()) return 'Yesterday';
  return 'Earlier';
};

export default function NotificationsPage() {
  const { items, unreadCount, loading, markRead, markAllRead } = useNotifications();
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  const visible = useMemo(() => (filter === 'unread' ? items.filter(n => !n.isRead) : items), [items, filter]);
  const groups = useMemo(() => {
    const map = new Map();
    for (const n of visible) {
      const k = groupLabel(n.createdAt);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(n);
    }
    return Array.from(map.entries());
  }, [visible]);

  return (
    <Reveal each={0.05}>
      <Reveal.Item className="page-header">
        <div>
          <h1>Notifications</h1>
          <p>{unreadCount > 0 ? `${unreadCount} unread` : 'You are all caught up'} · live updates enabled</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div role="tablist" aria-label="Filter" style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            {['all', 'unread'].map(f => (
              <button key={f} role="tab" aria-selected={filter === f} onClick={() => setFilter(f)} className="btn btn-sm" style={{ position: 'relative', background: 'transparent', color: filter === f ? 'var(--text-primary)' : 'var(--text-muted)', textTransform: 'capitalize', minHeight: 32 }}>
                {filter === f && <motion.span layoutId="notif-pill" transition={spring} style={{ position: 'absolute', inset: 0, borderRadius: 8, background: 'var(--surface)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }} />}
                <span style={{ position: 'relative' }}>{f}</span>
              </button>
            ))}
          </div>
          {unreadCount > 0 && <button className="btn btn-outline btn-sm" onClick={markAllRead}><CheckCheck size={15} /> Mark all read</button>}
        </div>
      </Reveal.Item>

      {loading ? (
        <div style={{ display: 'grid', gap: 10 }}>{[0, 1, 2, 3].map(i => <Skeleton key={i} h={76} r={14} />)}</div>
      ) : visible.length === 0 ? (
        <div className="card"><EmptyState icon={filter === 'unread' ? Inbox : Bell} title={filter === 'unread' ? 'No unread notifications' : 'No notifications yet'} description="Case assignments, evidence uploads and integrity alerts will appear here in real time." /></div>
      ) : (
        groups.map(([label, list]) => (
          <div key={label} style={{ marginBottom: 22 }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>{label}</div>
            <div style={{ display: 'grid', gap: 8 }}>
              <AnimatePresence initial={false}>
                {list.map(n => {
                  const t = TYPE[n.type] || TYPE.info;
                  return (
                    <motion.div key={n._id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 24 }} transition={spring}
                      className="card card-hover"
                      style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '14px 16px', borderLeft: `3px solid ${n.isRead ? 'transparent' : `var(--${t.tone})`}`, cursor: n.relatedLink ? 'pointer' : 'default' }}
                      onClick={() => { if (!n.isRead) markRead(n._id); if (n.relatedLink) navigate(n.relatedLink); }}
                      role={n.relatedLink ? 'link' : undefined} tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter') { markRead(n._id); if (n.relatedLink) navigate(n.relatedLink); } }}
                    >
                      <span style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, display: 'grid', placeItems: 'center', background: `var(--${t.tone}-soft)`, color: `var(--${t.tone})` }}>
                        <t.icon size={18} aria-hidden="true" />
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14.5, color: 'var(--text-primary)', fontWeight: n.isRead ? 500 : 650, lineHeight: 1.45 }}>{n.message}</div>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 6, fontSize: 12, color: 'var(--text-faint)' }}>
                          <span>{timeAgo(n.createdAt)}</span>
                          {!n.isRead && <Badge variant={t.tone} style={{ fontSize: 10 }}>New</Badge>}
                          {n.relatedLink && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--primary)', fontWeight: 600 }}>Open <ArrowUpRight size={12} /></span>}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        ))
      )}
    </Reveal>
  );
}
