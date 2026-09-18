import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import toast from 'react-hot-toast';
import {
  Plus, Search, FolderOpen, X, Filter,
  User, Calendar, Flag, ArrowUpRight, Loader2,
  ChevronDown, CheckCircle, LayoutGrid, Kanban, List,
  Shield, Activity, ArrowRight, AlertTriangle, Hash, FileText
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const statusColors = {
  Open: '#16a34a', open: '#16a34a',
  'In Progress': '#1d4ed8', in_progress: '#1d4ed8', 'in progress': '#1d4ed8',
  Closed: '#64748b', closed: '#64748b',
  Suspended: '#ea580c', suspended: '#ea580c'
};
const priorityColors = {
  Critical: '#dc2626', critical: '#dc2626',
  High: '#ea580c', high: '#ea580c',
  Medium: '#ca8a04', medium: '#ca8a04',
  Low: '#16a34a', low: '#16a34a'
};

const KANBAN_COLUMNS = [
  { id: 'Open', title: 'Intake / Open', color: '#16a34a', bg: 'rgba(34,197,94,0.06)' },
  { id: 'In Progress', title: 'Active Investigation', color: '#1d4ed8', bg: 'rgba(29,78,216,0.06)' },
  { id: 'Suspended', title: 'Suspended / Pending', color: '#ea580c', bg: 'rgba(234,88,12,0.06)' },
  { id: 'Closed', title: 'Adjudicated / Closed', color: '#64748b', bg: 'rgba(100,116,139,0.06)' }
];

export default function CasesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'grid' | 'table'
  const [modalOpen, setModalOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ totalCases: 0, openCases: 0, criticalCases: 0, clearanceRate: 0 });

  const fetchCases = async () => {
    try {
      const [casesRes, statsRes] = await Promise.all([
        API.get('/api/cases'),
        API.get('/api/cases/stats/analytics').catch(() => ({ data: null }))
      ]);
      setCases(casesRes.data);
      if (statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (err) {
      toast.error('Failed to load cases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
    if (user?.role === 'admin' || user?.role === 'investigator') {
      API.get('/api/users').then(r => setUsers(r.data)).catch(() => {});
    }
    if (searchParams.get('create') === 'true') {
      setModalOpen(true);
    }
  }, [user, searchParams]);

  const handleUpdateCaseStatus = async (caseId, newStatus, e) => {
    e.stopPropagation();
    try {
      await API.put(`/api/cases/${caseId}`, { status: newStatus });
      toast.success(`Case advanced to ${newStatus}`);
      fetchCases();
    } catch {
      toast.error('Failed to update case status');
    }
  };

  const filtered = cases.filter(c => {
    const q = search.toLowerCase();
    const matchSearch =
      c.title.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      (c.caseNumber && c.caseNumber.toLowerCase().includes(q)) ||
      (c.assignedTo?.name && c.assignedTo.name.toLowerCase().includes(q));

    const matchPriority = filterPriority === 'All' || c.priority?.toLowerCase() === filterPriority.toLowerCase();
    const matchStatus = filterStatus === 'All' || c.status?.toLowerCase() === filterStatus.toLowerCase();

    return matchSearch && matchPriority && matchStatus;
  });

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      
      {/* Top Forensic HUD Analytics Banner */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14,
        marginBottom: 20
      }}>
        <div style={{ padding: '16px 20px', background: 'white', borderRadius: 16, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>Total Investigations</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', fontFamily: "'Space Grotesk'", marginTop: 4 }}>
            {cases.length}
          </div>
          <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600, marginTop: 4 }}>
            ● Active Forensics Registry
          </div>
        </div>

        <div style={{ padding: '16px 20px', background: 'white', borderRadius: 16, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>Critical / High Threats</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#dc2626', fontFamily: "'Space Grotesk'", marginTop: 4 }}>
            {cases.filter(c => ['critical', 'high'].includes(c.priority?.toLowerCase())).length}
          </div>
          <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 600, marginTop: 4 }}>
            ▲ Immediate Attention Needed
          </div>
        </div>

        <div style={{ padding: '16px 20px', background: 'white', borderRadius: 16, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>Under Lab Analysis</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#1d4ed8', fontFamily: "'Space Grotesk'", marginTop: 4 }}>
            {cases.filter(c => ['in progress', 'in_progress'].includes(c.status?.toLowerCase())).length}
          </div>
          <div style={{ fontSize: 11, color: '#1d4ed8', fontWeight: 600, marginTop: 4 }}>
            ■ Active Chain of Custody
          </div>
        </div>

        <div style={{ padding: '16px 20px', background: 'white', borderRadius: 16, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>Resolution / Clearance</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#16a34a', fontFamily: "'Space Grotesk'", marginTop: 4 }}>
            {stats.clearanceRate || (cases.length ? Math.round((cases.filter(c => c.status?.toLowerCase() === 'closed').length / cases.length) * 100) : 0)}%
          </div>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginTop: 4 }}>
            Case Adjudication Metric
          </div>
        </div>
      </div>

      {/* Action Controls & Filters Bar */}
      <div style={{
        background: 'white', borderRadius: 18, border: '1px solid var(--border)',
        padding: '16px 20px', marginBottom: 22, display: 'flex', flexWrap: 'wrap',
        alignItems: 'center', justifyContent: 'space-between', gap: 14
      }}>
        {/* Search Bar */}
        <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="input"
            placeholder="Search cases, case numbers (CASE-2026...), title, assignee..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 40, height: 40, borderRadius: 12 }}
          />
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--surface)', padding: 3, borderRadius: 10, border: '1px solid var(--border)' }}>
            {['All', 'Critical', 'High', 'Medium', 'Low'].map(p => (
              <button key={p}
                onClick={() => setFilterPriority(p)}
                style={{
                  border: 'none', padding: '6px 12px', borderRadius: 8, fontSize: 11.5, fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.15s',
                  background: filterPriority === p ? '#1d4ed8' : 'transparent',
                  color: filterPriority === p ? 'white' : '#64748b'
                }}>
                {p}
              </button>
            ))}
          </div>

          {/* View Mode Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'var(--surface)', padding: 3, borderRadius: 10, border: '1px solid var(--border)' }}>
            <button
              onClick={() => setViewMode('kanban')}
              title="Kanban Pipeline View"
              style={{
                border: 'none', padding: '6px 10px', borderRadius: 8, cursor: 'pointer',
                background: viewMode === 'kanban' ? 'white' : 'transparent',
                color: viewMode === 'kanban' ? '#1d4ed8' : '#64748b',
                boxShadow: viewMode === 'kanban' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
              }}>
              <Kanban size={15} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              title="Grid View"
              style={{
                border: 'none', padding: '6px 10px', borderRadius: 8, cursor: 'pointer',
                background: viewMode === 'grid' ? 'white' : 'transparent',
                color: viewMode === 'grid' ? '#1d4ed8' : '#64748b',
                boxShadow: viewMode === 'grid' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
              }}>
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              title="Forensic Table View"
              style={{
                border: 'none', padding: '6px 10px', borderRadius: 8, cursor: 'pointer',
                background: viewMode === 'table' ? 'white' : 'transparent',
                color: viewMode === 'table' ? '#1d4ed8' : '#64748b',
                boxShadow: viewMode === 'table' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
              }}>
              <List size={15} />
            </button>
          </div>

          {(user?.role === 'admin' || user?.role === 'investigator') && (
            <button onClick={() => setModalOpen(true)} className="btn btn-primary" style={{ padding: '8px 16px', height: 40 }}>
              <Plus size={16} /> New Investigation
            </button>
          )}
        </div>
      </div>

      {/* Main Cases View */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 210, borderRadius: 18 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '70px 20px', background: 'white', borderRadius: 20, border: '1px solid var(--border)' }}>
          <FolderOpen size={48} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>No investigations found</h3>
          <p style={{ fontSize: 13, color: '#64748b' }}>Try adjusting your search terms or filter criteria.</p>
        </div>
      ) : viewMode === 'kanban' ? (
        /* KANBAN PIPELINE VIEW */
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16,
          alignItems: 'flex-start'
        }}>
          {KANBAN_COLUMNS.map(col => {
            const colCases = filtered.filter(c => {
              const s = (c.status || '').toLowerCase();
              if (col.id === 'Open') return s === 'open';
              if (col.id === 'In Progress') return s === 'in progress' || s === 'in_progress';
              if (col.id === 'Suspended') return s === 'suspended';
              if (col.id === 'Closed') return s === 'closed';
              return false;
            });

            return (
              <div key={col.id} style={{
                background: col.bg, borderRadius: 18, border: `1px solid ${col.color}25`,
                padding: '14px 14px', minHeight: 480
              }}>
                {/* Column Header */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: 14, paddingBottom: 10, borderBottom: `1px solid ${col.color}20`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                    <span style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a' }}>{col.title}</span>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 99,
                    background: 'white', color: col.color, border: `1px solid ${col.color}30`
                  }}>
                    {colCases.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {colCases.map(c => (
                    <div key={c._id}
                      onClick={() => navigate(`/cases/${c._id}`)}
                      style={{
                        background: 'white', borderRadius: 14, padding: '14px 16px',
                        border: '1px solid rgba(29,78,216,0.1)', cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)', transition: 'all 0.2s',
                        position: 'relative', overflow: 'hidden'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(29,78,216,0.12)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)'; }}>
                      
                      {/* Priority Tag & Case Number */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: '#1d4ed8' }}>
                          {c.caseNumber || 'CASE'}
                        </span>
                        <span style={{
                          fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase',
                          padding: '2px 6px', borderRadius: 4,
                          background: `${priorityColors[c.priority]}15`,
                          color: priorityColors[c.priority],
                          border: `1px solid ${priorityColors[c.priority]}30`
                        }}>
                          {c.priority}
                        </span>
                      </div>

                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', lineHeight: 1.3, marginBottom: 6 }}>
                        {c.title}
                      </div>

                      <p style={{
                        fontSize: 12, color: '#64748b', lineHeight: 1.4, marginBottom: 12,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                      }}>
                        {c.description}
                      </p>

                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        paddingTop: 10, borderTop: '1px solid var(--border)', fontSize: 11, color: '#64748b'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <User size={12} />
                          <span style={{ maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.assignedTo?.name || 'Unassigned'}
                          </span>
                        </div>

                        {/* Quick Advance Status Dropdown */}
                        <select
                          value={c.status}
                          onClick={e => e.stopPropagation()}
                          onChange={e => handleUpdateCaseStatus(c._id, e.target.value, e)}
                          style={{
                            fontSize: 10.5, fontWeight: 700, border: '1px solid var(--border)',
                            borderRadius: 6, background: 'var(--surface)', padding: '2px 4px', color: '#334155'
                          }}>
                          <option value="Open">Open</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Suspended">Suspended</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filtered.map(c => (
            <div key={c._id}
              onClick={() => navigate(`/cases/${c._id}`)}
              style={{
                background: 'white', borderRadius: 18, border: '1px solid var(--border)',
                padding: '18px 20px', cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(29,78,216,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)'; }}>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{
                  fontSize: 11, fontFamily: 'monospace', fontWeight: 800, color: '#1d4ed8',
                  padding: '3px 8px', borderRadius: 6, background: '#eff6ff', border: '1px solid #bfdbfe'
                }}>
                  {c.caseNumber || 'CASE'}
                </span>
                <span style={{
                  fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
                  padding: '3px 8px', borderRadius: 6,
                  background: `${priorityColors[c.priority]}15`,
                  color: priorityColors[c.priority],
                  border: `1px solid ${priorityColors[c.priority]}30`
                }}>
                  {c.priority}
                </span>
              </div>

              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                {c.title}
              </h3>

              <p style={{
                fontSize: 12.5, color: '#64748b', lineHeight: 1.5, marginBottom: 14,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
              }}>
                {c.description}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: 11.5, color: '#64748b' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <User size={13} /> {c.assignedTo?.name || 'Unassigned'}
                </span>
                <span style={{
                  padding: '2px 8px', borderRadius: 99, fontWeight: 700, fontSize: 10.5,
                  background: `${statusColors[c.status]}15`, color: statusColors[c.status]
                }}>
                  {c.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div style={{ background: 'white', borderRadius: 18, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)', color: '#475569', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '14px 20px' }}>Case Number</th>
                <th style={{ padding: '14px 20px' }}>Title & Scope</th>
                <th style={{ padding: '14px 20px' }}>Priority</th>
                <th style={{ padding: '14px 20px' }}>Status</th>
                <th style={{ padding: '14px 20px' }}>Lead Officer</th>
                <th style={{ padding: '14px 20px' }}>Registered</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c._id}
                  onClick={() => navigate(`/cases/${c._id}`)}
                  style={{
                    borderBottom: '1px solid var(--border)', cursor: 'pointer',
                    background: i % 2 === 0 ? 'white' : '#fafbfc'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f0f6ff'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'white' : '#fafbfc'}>
                  <td style={{ padding: '14px 20px', fontFamily: 'monospace', fontWeight: 700, color: '#1d4ed8' }}>
                    {c.caseNumber || 'CASE'}
                  </td>
                  <td style={{ padding: '14px 20px', fontWeight: 600, color: '#0f172a' }}>
                    {c.title}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                      padding: '2px 8px', borderRadius: 6,
                      background: `${priorityColors[c.priority]}15`, color: priorityColors[c.priority]
                    }}>
                      {c.priority}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      padding: '2px 8px', borderRadius: 6,
                      background: `${statusColors[c.status]}15`, color: statusColors[c.status]
                    }}>
                      {c.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', color: '#475569' }}>
                    {c.assignedTo?.name || 'Unassigned'}
                  </td>
                  <td style={{ padding: '14px 20px', color: '#94a3b8', fontSize: 12 }}>
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Case Modal */}
      {modalOpen && (
        <CreateCaseModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onCreated={() => { setModalOpen(false); fetchCases(); }}
          users={users}
        />
      )}

    </div>
  );
}

function CreateCaseModal({ open, onClose, onCreated, users }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    assignedTo: '',
    courtReference: '',
    tags: 'Digital Forensics, Incident Response'
  });
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Title and description are required');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        assignedTo: formData.assignedTo || undefined
      };
      await API.post('/api/cases', payload);
      toast.success('Investigation registered in vault!');
      onCreated();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create case');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
    }}
    onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          width: '100%', maxWidth: 560, background: 'white',
          borderRadius: 22, border: '1px solid var(--border)',
          boxShadow: '0 25px 60px -12px rgba(15,23,42,0.3)',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}>
        
        <div style={{
          padding: '18px 24px', borderBottom: '1px solid var(--border)',
          background: 'var(--off-white)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FolderOpen size={20} color="#1d4ed8" />
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0, fontFamily: "'Space Grotesk'" }}>
              Register Forensic Investigation
            </h3>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
              Investigation Title *
            </label>
            <input
              type="text"
              required
              className="input"
              placeholder="e.g. Operation Dark Web Extortion Ring"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
              Investigative Scope & Description *
            </label>
            <textarea
              required
              className="input"
              rows={3}
              placeholder="Detail breach indicators, suspect entities, and seized digital media..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Threat Priority
              </label>
              <select
                className="input"
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Assign Lead Officer
              </label>
              <select
                className="input"
                value={formData.assignedTo}
                onChange={e => setFormData({ ...formData, assignedTo: e.target.value })}>
                <option value="">Unassigned</option>
                {users.map(u => (
                  <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Court Docket Reference
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g. FED-CR-2026-90"
                value={formData.courtReference}
                onChange={e => setFormData({ ...formData, courtReference: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Forensic Classification Tags
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Ransomware, Bitcoin, Phishing"
                value={formData.tags}
                onChange={e => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <button type="button" onClick={onClose} className="btn btn-outline">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary" style={{ minWidth: 150 }}>
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <><Shield size={14} /> Seal Case Record</>}
            </button>
          </div>
        </form>

      </motion.div>
    </div>
  );
}
