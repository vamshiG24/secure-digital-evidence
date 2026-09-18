import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  FolderOpen, AlertTriangle, Clock, CheckCircle2, FileText, ShieldCheck, Plus, ArrowUpRight,
  Activity, Sparkles, Fingerprint, Zap, ClipboardList, Upload, Search
} from 'lucide-react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  SpotlightCard, AnimatedNumber, Reveal, Badge, statusVariant, Skeleton, EmptyState, Avatar, IconTile, spring
} from '../components/ui';

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

const fmtDate = (d) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

function StatTile({ icon, label, value, tone, to, hint }) {
  const navigate = useNavigate();
  return (
    <Reveal.Item>
      <SpotlightCard
        className="stat-card card-hover" style={{ '--stat-accent': `var(--${tone})`, cursor: to ? 'pointer' : 'default' }}
        onClick={to ? () => navigate(to) : undefined} role={to ? 'link' : undefined} tabIndex={to ? 0 : undefined}
        onKeyDown={to ? (e) => e.key === 'Enter' && navigate(to) : undefined}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div className="stat-label">{label}</div>
            <div className="stat-value" style={{ marginTop: 6 }}><AnimatedNumber value={value} /></div>
            {hint && <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 6 }}>{hint}</div>}
          </div>
          <IconTile icon={icon} tone={tone} />
        </div>
      </SpotlightCard>
    </Reveal.Item>
  );
}

/** SVG integrity ring: animated stroke, readable value in the centre. */
function IntegrityRing({ value = 100, size = 132 }) {
  const reduce = useReducedMotion();
  const r = (size - 14) / 2;
  const c = 2 * Math.PI * r;
  const tone = value >= 95 ? 'success' : value >= 80 ? 'warning' : 'danger';
  return (
    <div style={{ position: 'relative', width: size, height: size }} role="img" aria-label={`Vault integrity ${value}%`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth="10" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`var(--${tone})`} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c} initial={{ strokeDashoffset: reduce ? c * (1 - value / 100) : c }}
          animate={{ strokeDashoffset: c * (1 - value / 100) }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <div>
          <div className="stat-value" style={{ fontSize: 26 }}><AnimatedNumber value={value} suffix="%" /></div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>integrity</div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [cases, setCases] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [a, c, l] = await Promise.all([
          API.get('/api/cases/stats/analytics'),
          API.get('/api/cases'),
          user?.role === 'admin' ? API.get('/api/logs?limit=8') : Promise.resolve({ data: [] }),
        ]);
        if (!alive) return;
        setAnalytics(a.data); setCases(c.data); setLogs(l.data);
      } catch { /* toast handled globally by pages */ } finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [user?.role]);

  const critical = useMemo(() => cases.filter(c => ['Critical', 'High'].includes(c.priority) && c.status !== 'Closed').slice(0, 5), [cases]);
  const recent = useMemo(() => cases.slice(0, 6), [cases]);
  const total = analytics?.totalCases || 0;
  const pct = (n) => (total ? Math.round((n / total) * 100) : 0);

  if (loading) {
    return (
      <div style={{ display: 'grid', gap: 16 }} aria-busy="true">
        <Skeleton h={34} w={280} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>{[0, 1, 2, 3, 4].map(i => <Skeleton key={i} h={112} r={16} />)}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}><Skeleton h={360} r={16} /><Skeleton h={360} r={16} /></div>
      </div>
    );
  }

  return (
    <Reveal each={0.06}>
      {/* Header */}
      <Reveal.Item className="page-header">
        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
          <h1>{greeting()}, {user?.name?.split(' ')[0]}</h1>
          <p>Here's the state of your evidence vault and active investigations.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <motion.button className="btn btn-outline" whileTap={{ scale: 0.98 }} onClick={() => navigate('/evidence')}><Upload size={16} /> Ingest evidence</motion.button>
          {user?.role !== 'analyst' && (
            <motion.button className="btn btn-primary" whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} transition={spring} onClick={() => navigate('/cases?create=true')}><Plus size={16} /> New case</motion.button>
          )}
        </div>
      </Reveal.Item>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, marginBottom: 16 }}>
        <StatTile icon={FolderOpen} label="Total cases" value={total} tone="primary" to="/cases" hint={`${analytics?.clearanceRate ?? 0}% clearance rate`} />
        <StatTile icon={AlertTriangle} label="Open" value={analytics?.openCases || 0} tone="success" to="/cases?status=Open" hint={`${pct(analytics?.openCases || 0)}% of caseload`} />
        <StatTile icon={Clock} label="In progress" value={analytics?.inProgressCases || 0} tone="warning" to="/cases?status=In Progress" hint={`${pct(analytics?.inProgressCases || 0)}% of caseload`} />
        <StatTile icon={CheckCircle2} label="Closed" value={analytics?.closedCases || 0} tone="info" to="/cases?status=Closed" hint={`${pct(analytics?.closedCases || 0)}% of caseload`} />
        <StatTile icon={FileText} label="Evidence items" value={analytics?.totalEvidence || 0} tone="purple" to="/evidence" hint="Sealed with SHA-256" />
      </div>

      {/* Bento grid */}
      <div className="bento" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 14 }}>
        {/* Recent cases */}
        <Reveal.Item style={{ gridColumn: 'span 8' }}>
          <SpotlightCard lift={false} style={{ height: '100%' }}>
            <div className="card-header">
              <h3 className="card-title"><FolderOpen size={17} style={{ color: 'var(--primary)' }} /> Recent cases</h3>
              <Link to="/cases" className="btn btn-ghost btn-sm">View all <ArrowUpRight size={14} /></Link>
            </div>
            {recent.length === 0 ? (
              <EmptyState icon={FolderOpen} title="No cases yet" description="Create your first case to start ingesting evidence." action={user?.role !== 'analyst' && <button className="btn btn-primary btn-sm" onClick={() => navigate('/cases?create=true')}><Plus size={14} /> New case</button>} />
            ) : (
              <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                <table className="table">
                  <thead><tr><th>Case</th><th>Status</th><th>Priority</th><th>Lead</th><th style={{ textAlign: 'right' }}>Opened</th></tr></thead>
                  <tbody>
                    {recent.map((c, i) => (
                      <motion.tr key={c._id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.04 }}
                        onClick={() => navigate(`/cases/${c._id}`)} style={{ cursor: 'pointer' }} tabIndex={0} onKeyDown={e => e.key === 'Enter' && navigate(`/cases/${c._id}`)}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
                          <div className="mono" style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>{c.caseNumber}</div>
                        </td>
                        <td><Badge variant={statusVariant(c.status)}>{c.status}</Badge></td>
                        <td><Badge variant={c.priority}>{c.priority}</Badge></td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            <Avatar name={c.assignedTo?.name || '?'} src={c.assignedTo?.avatarUrl} size={24} />
                            <span style={{ fontSize: 13 }}>{c.assignedTo?.name || <span style={{ color: 'var(--text-faint)' }}>Unassigned</span>}</span>
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: 13, whiteSpace: 'nowrap' }}>{fmtDate(c.createdAt)}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SpotlightCard>
        </Reveal.Item>

        {/* Integrity */}
        <Reveal.Item style={{ gridColumn: 'span 4' }}>
          <SpotlightCard lift={false} spotlightColor="var(--accent-glow)" style={{ height: '100%' }}>
            <div className="card-header">
              <h3 className="card-title"><ShieldCheck size={17} style={{ color: 'var(--success)' }} /> Vault integrity</h3>
              <Badge variant="success"><Fingerprint size={11} /> SHA-256</Badge>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <IntegrityRing value={100} />
              <p style={{ fontSize: 13, textAlign: 'center', color: 'var(--text-muted)', maxWidth: 260 }}>
                Every stored file is bound to a hash-linked custody ledger. Run a full audit to re-hash all assets.
              </p>
              <button className="btn btn-outline btn-block" onClick={() => navigate('/evidence?audit=true')}><Zap size={15} /> Run integrity audit</button>
            </div>
          </SpotlightCard>
        </Reveal.Item>

        {/* Priority queue */}
        <Reveal.Item style={{ gridColumn: 'span 5' }}>
          <SpotlightCard lift={false} spotlightColor="var(--danger-soft)" style={{ height: '100%' }}>
            <div className="card-header">
              <h3 className="card-title"><AlertTriangle size={17} style={{ color: 'var(--danger)' }} /> Priority queue</h3>
              <span className="tag">{critical.length} active</span>
            </div>
            <div style={{ padding: '8px 12px 12px' }}>
              {critical.length === 0 ? (
                <EmptyState icon={CheckCircle2} title="Nothing urgent" description="No open Critical or High priority cases." />
              ) : critical.map((c) => (
                <motion.button key={c._id} onClick={() => navigate(`/cases/${c._id}`)} whileHover={{ x: 3 }} transition={spring}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 10px', borderRadius: 12, background: 'none', border: 'none', textAlign: 'left', color: 'inherit' }}>
                  <span style={{ width: 8, height: 36, borderRadius: 99, background: c.priority === 'Critical' ? 'var(--danger)' : '#f97316', flexShrink: 0 }} aria-hidden="true" />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.caseNumber} · {c.status}</span>
                  </span>
                  <Badge variant={c.priority}>{c.priority}</Badge>
                </motion.button>
              ))}
            </div>
          </SpotlightCard>
        </Reveal.Item>

        {/* Quick actions + activity */}
        <Reveal.Item style={{ gridColumn: 'span 7' }}>
          <SpotlightCard lift={false} style={{ height: '100%' }}>
            <div className="card-header">
              <h3 className="card-title"><Activity size={17} style={{ color: 'var(--primary)' }} /> {user?.role === 'admin' ? 'Security telemetry' : 'Quick actions'}</h3>
              {user?.role === 'admin' && <Link to="/audit-logs" className="btn btn-ghost btn-sm">Audit trail <ArrowUpRight size={14} /></Link>}
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: user?.role === 'admin' && logs.length ? 18 : 0 }}>
                {[
                  { icon: Search, label: 'Search vault', to: '/evidence' },
                  { icon: Sparkles, label: 'AI Studio', to: '/ai-studio' },
                  { icon: ClipboardList, label: 'Notifications', to: '/notifications' },
                ].map(a => (
                  <motion.button key={a.label} onClick={() => navigate(a.to)} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} transition={spring}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-primary)', fontWeight: 600, fontSize: 13.5 }}>
                    <a.icon size={16} style={{ color: 'var(--primary)' }} /> {a.label}
                  </motion.button>
                ))}
              </div>
              {user?.role === 'admin' && logs.length > 0 && (
                <div style={{ display: 'grid', gap: 2 }}>
                  {logs.slice(0, 6).map((log, i) => (
                    <motion.div key={log._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 + i * 0.04 }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 6px', borderBottom: i < 5 ? '1px solid var(--border)' : 'none' }}>
                      <span style={{ width: 6, height: 6, borderRadius: 99, background: /tamper|fail|block/i.test(log.action + log.details) ? 'var(--danger)' : 'var(--success)' }} aria-hidden="true" />
                      <span style={{ flex: 1, minWidth: 0, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{log.user?.name || 'System'}</strong>
                        <span style={{ color: 'var(--text-muted)' }}> · {log.action}</span>
                      </span>
                      <span style={{ fontSize: 11.5, color: 'var(--text-faint)', whiteSpace: 'nowrap' }}>{timeAgo(log.timestamp)}</span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </SpotlightCard>
        </Reveal.Item>
      </div>

      <style>{`
        @media (max-width: 1100px) { .bento > * { grid-column: span 12 !important; } }
      `}</style>
    </Reveal>
  );
}
