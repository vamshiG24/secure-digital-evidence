import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import {
  FolderOpen, FileText, Users, ClipboardList,
  TrendingUp, AlertCircle, CheckCircle, Clock,
  Activity, Shield, Zap, BarChart2, Eye, Sparkles
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] } },
};

function StatCard({ icon: Icon, label, value, color, gradient, delay = 0, trend, onClick }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const target = parseInt(value) || 0;
    if (target === 0) return;
    const step = Math.ceil(target / 30);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 30);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <motion.div variants={itemVariants}
      whileHover={{ y: -6, boxShadow: '0 16px 48px rgba(29,78,216,0.15)' }}
      onClick={onClick}
      style={{
        background: 'white', borderRadius: 20, padding: '22px 24px',
        border: '1px solid rgba(29,78,216,0.1)', position: 'relative', overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default', transition: 'box-shadow 0.3s ease',
      }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: gradient }} />
      <div style={{ position: 'absolute', right: -16, top: -16, width: 100, height: 100, borderRadius: '50%', background: `${color}08` }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            {label}
          </div>
          <div style={{ fontSize: 34, fontWeight: 800, color: '#0f172a', lineHeight: 1, fontFamily: "'Space Grotesk'" }}>
            {count}
          </div>
          {trend && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: 12, color: '#16a34a', fontWeight: 600 }}>
              <TrendingUp size={12} /> {trend}
            </div>
          )}
        </div>
        <div style={{
          width: 48, height: 48, borderRadius: 14, flexShrink: 0,
          background: `${color}12`, border: `1.5px solid ${color}25`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={22} color={color} />
        </div>
      </div>
    </motion.div>
  );
}

function CaseRow({ caseItem, index, onClick }) {
  const priorityColors = {
    Critical: '#dc2626', High: '#ea580c', Medium: '#ca8a04', Low: '#16a34a'
  };
  const statusColors = {
    Open: '#16a34a', 'In Progress': '#1d4ed8', Closed: '#64748b'
  };

  return (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
      whileHover={{ backgroundColor: 'rgba(59,130,246,0.05)' }}>
      <td style={{ paddingLeft: 20, padding: '14px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 800, color: '#1d4ed8', background: '#eff6ff', padding: '1px 5px', borderRadius: 4 }}>
            {caseItem.caseNumber || 'CASE'}
          </span>
          <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 13.5 }}>
            {caseItem.title}
          </span>
        </div>
        <div style={{ fontSize: 11.5, color: '#94a3b8' }}>
          Registered: {new Date(caseItem.createdAt).toLocaleDateString()}
        </div>
      </td>

      <td>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600,
          background: `${statusColors[caseItem.status] || '#64748b'}12`,
          color: statusColors[caseItem.status] || '#64748b',
          border: `1px solid ${statusColors[caseItem.status] || '#64748b'}25`,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
          {caseItem.status}
        </span>
      </td>
      <td>
        <span style={{
          display: 'inline-flex', padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 700,
          background: `${priorityColors[caseItem.priority] || '#16a34a'}10`,
          color: priorityColors[caseItem.priority] || '#16a34a',
          border: `1px solid ${priorityColors[caseItem.priority] || '#16a34a'}25`,
          textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>
          {caseItem.priority}
        </span>
      </td>
      <td style={{ color: '#475569', fontSize: 13 }}>
        {caseItem.assignedTo?.name || 'Unassigned'}
      </td>
    </motion.tr>
  );
}

function ActivityFeed({ logs }) {
  const actionColors = {
    USER_LOGIN: { color: '#16a34a', icon: CheckCircle },
    USER_LOGOUT: { color: '#64748b', icon: Activity },
    USER_REGISTER: { color: '#1d4ed8', icon: Users },
    MFA_CHALLENGE: { color: '#ca8a04', icon: Shield },
    'Create Case': { color: '#7c3aed', icon: FolderOpen },
    'Upload Evidence': { color: '#06b6d4', icon: FileText },
    'Verify Evidence Integrity': { color: '#16a34a', icon: CheckCircle },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {logs.slice(0, 8).map((log, i) => {
        const ac = actionColors[log.action] || { color: '#64748b', icon: Activity };
        const IconComp = ac.icon;
        return (
          <motion.div key={log._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0',
              borderBottom: i < logs.slice(0, 8).length - 1 ? '1px solid var(--border)' : 'none',
            }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10, flexShrink: 0,
              background: `${ac.color}10`, border: `1px solid ${ac.color}20`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <IconComp size={14} color={ac.color} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>
                {log.action.replace(/_/g, ' ')}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {log.details || log.user?.email || 'System action'}
              </div>
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [casesRes, logsRes] = await Promise.allSettled([
          API.get('/api/cases'),
          user?.role === 'admin' ? API.get('/api/logs') : Promise.resolve({ data: [] }),
        ]);
        if (casesRes.status === 'fulfilled') setCases(casesRes.value.data);
        if (logsRes.status === 'fulfilled') setLogs(logsRes.value.data);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const stats = {
    total: cases.length,
    open: cases.filter(c => c.status === 'Open').length,
    progress: cases.filter(c => c.status === 'In Progress').length,
    closed: cases.filter(c => c.status === 'Closed').length,
  };

  if (loading) {
    return (
      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 28 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 110, borderRadius: 20 }} />
          ))}
        </div>
        <div className="skeleton" style={{ height: 300, borderRadius: 20 }} />
      </div>
    );
  }

  return (
    <motion.div className="page-body" variants={containerVariants} initial="hidden" animate="visible">

      {/* Header */}
      <motion.div variants={itemVariants} style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: "'Space Grotesk'", fontSize: 26, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
              Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'},{' '}
              <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
            </h1>
            <p style={{ color: '#64748b', fontSize: 14 }}>
              Here's your operations overview for today, {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Quick Command Action Launchpad */}
      <motion.div variants={itemVariants} style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 24
      }}>
        {[
          { label: 'Register New Investigation', desc: 'Seal new case dossier', icon: FolderOpen, color: '#1d4ed8', bg: '#eff6ff', action: () => navigate('/cases?create=true') },
          { label: 'Run Vault Integrity Audit', desc: 'Scan all SHA-256 seals', icon: Shield, color: '#16a34a', bg: '#f0fdf4', action: () => navigate('/evidence?audit=true') },
          { label: 'AI Forensic Studio', desc: 'Gemini 2.5 Multimodal RAG', icon: Sparkles, color: '#7c3aed', bg: '#faf5ff', action: () => navigate('/ai-studio') },
          { label: 'Compliance Audit Trail', desc: 'Export court-admissible logs', icon: ClipboardList, color: '#0891b2', bg: '#ecfeff', action: () => navigate('/audit-logs') },
        ].map((act, i) => {
          const Icon = act.icon;
          return (
            <div key={i}
              onClick={act.action}
              style={{
                background: 'white', borderRadius: 16, border: '1px solid var(--border)',
                padding: '16px 18px', cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: 14
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(29,78,216,0.1)'; e.currentTarget.style.borderColor = act.color; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: act.bg, color: act.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={20} />
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>{act.label}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{act.desc}</div>
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Stat Cards */}
      <motion.div variants={itemVariants}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard icon={FolderOpen} label="Total Cases" value={stats.total} color="#1d4ed8"
          gradient="linear-gradient(90deg, #1d4ed8, #3b82f6)" trend="+2 this week" onClick={() => navigate('/cases')} />
        <StatCard icon={AlertCircle} label="Open Cases" value={stats.open} color="#16a34a"
          gradient="linear-gradient(90deg, #16a34a, #22c55e)" onClick={() => navigate('/cases?status=Open')} />
        <StatCard icon={Clock} label="In Progress" value={stats.progress} color="#ca8a04"
          gradient="linear-gradient(90deg, #ca8a04, #fbbf24)" onClick={() => navigate('/cases?status=In Progress')} />
        <StatCard icon={CheckCircle} label="Closed Cases" value={stats.closed} color="#64748b"
          gradient="linear-gradient(90deg, #475569, #64748b)" onClick={() => navigate('/cases?status=Closed')} />
      </motion.div>


      {/* Case Distribution Progress Analytics Bar */}
      <motion.div variants={itemVariants}
        style={{
          background: 'white', borderRadius: 20, border: '1px solid var(--border)',
          padding: 20, marginBottom: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
        }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', fontFamily: "'Space Grotesk'" }}>
              Case Health & Status Distribution
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>Live workload metrics across active investigations</div>
          </div>
          <div style={{ display: 'flex', gap: 14, fontSize: 12, fontWeight: 600 }}>
            <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a' }} />
              Open ({stats.total ? Math.round((stats.open / stats.total) * 100) : 0}%)
            </span>
            <span style={{ color: '#ca8a04', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ca8a04' }} />
              In Progress ({stats.total ? Math.round((stats.progress / stats.total) * 100) : 0}%)
            </span>
            <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#64748b' }} />
              Closed ({stats.total ? Math.round((stats.closed / stats.total) * 100) : 0}%)
            </span>
          </div>
        </div>

        {/* Progress Bar Container */}
        <div style={{ height: 10, borderRadius: 99, background: '#f1f5f9', display: 'flex', overflow: 'hidden', gap: 2 }}>
          <div style={{ width: `${stats.total ? (stats.open / stats.total) * 100 : 0}%`, background: 'linear-gradient(90deg, #16a34a, #22c55e)', transition: 'width 0.5s ease' }} />
          <div style={{ width: `${stats.total ? (stats.progress / stats.total) * 100 : 0}%`, background: 'linear-gradient(90deg, #ca8a04, #eab308)', transition: 'width 0.5s ease' }} />
          <div style={{ width: `${stats.total ? (stats.closed / stats.total) * 100 : 0}%`, background: 'linear-gradient(90deg, #64748b, #94a3b8)', transition: 'width 0.5s ease' }} />
        </div>
      </motion.div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>

        {/* Recent Cases Table */}
        <motion.div variants={itemVariants}
          style={{ background: 'white', borderRadius: 20, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 17, color: '#0f172a' }}>Recent Cases</h2>
              <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Latest investigation activities</p>
            </div>
            <div onClick={() => navigate('/cases')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#1d4ed8', fontWeight: 600, cursor: 'pointer' }}>
              <Eye size={13} /> View All
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '10px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Case</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Priority</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Assigned</th>
              </tr>
            </thead>
            <tbody>
              {cases.slice(0, 6).map((c, i) => (
                <CaseRow key={c._id} caseItem={c} index={i} onClick={() => navigate(`/cases/${c._id}`)} />
              ))}
              {cases.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8', fontSize: 14 }}>
                  No cases found. Create your first case.
                </td></tr>
              )}
            </tbody>
          </table>
        </motion.div>

        {/* Activity Feed */}
        <motion.div variants={itemVariants}
          style={{ background: 'white', borderRadius: 20, border: '1px solid var(--border)', overflow: 'hidden', height: 'fit-content' }}>
          <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 9, flexShrink: 0,
              background: 'rgba(29,78,216,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Activity size={15} color="#1d4ed8" />
            </div>
            <div>
              <h2 style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 16, color: '#0f172a' }}>Activity Feed</h2>
              <p style={{ fontSize: 12, color: '#64748b' }}>Recent system events</p>
            </div>
          </div>
          <div style={{ padding: '8px 20px 16px' }}>
            {logs.length > 0 ? (
              <ActivityFeed logs={logs} />
            ) : (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8', fontSize: 13 }}>
                {user?.role === 'admin' ? 'No recent activity' : 'Activity feed available for admins'}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
