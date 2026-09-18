import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api/axios';
import {
  Search, FolderOpen, Shield, FileText, User, 
  ArrowRight, Sparkles, ClipboardList, PlusCircle, 
  CheckCircle, Zap, X, CornerDownLeft, Activity
} from 'lucide-react';

export default function CommandPalette({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ cases: [], evidence: [], users: [] });
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults({ cases: [], evidence: [], users: [] });
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Handle global keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open handled by parent or custom event
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced live search
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults({ cases: [], evidence: [], users: [] });
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await API.get(`/api/search/omni?q=${encodeURIComponent(query.trim())}`);
        setResults(data);
      } catch (err) {
        console.error('Omni search error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const quickActions = [
    { label: 'Create New Case Investigation', icon: PlusCircle, path: '/cases?create=true', badge: 'Action' },
    { label: 'Run Batch Vault Integrity Audit', icon: Shield, path: '/evidence?audit=true', badge: 'Security' },
    { label: 'Open AI Forensic Studio (Gemini 2.5)', icon: Sparkles, path: '/ai-studio', badge: 'AI Lab' },
    { label: 'Compliance & Tamper Audit Logs', icon: ClipboardList, path: '/audit-logs', badge: 'Audit' },
    { label: 'Threat Monitoring Dashboard', icon: Activity, path: '/dashboard', badge: 'Telemetry' },
  ];

  const filteredActions = query.trim()
    ? quickActions.filter(a => a.label.toLowerCase().includes(query.toLowerCase()))
    : quickActions;

  const handleSelectAction = (path) => {
    onClose();
    navigate(path);
  };

  const handleSelectCase = (caseId) => {
    onClose();
    navigate(`/cases/${caseId}`);
  };

  const handleSelectEvidence = (ev) => {
    onClose();
    if (ev.caseId?._id) {
      navigate(`/cases/${ev.caseId._id}`);
    } else {
      navigate(`/evidence?search=${encodeURIComponent(ev.fileName)}`);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '10vh', paddingLeft: 16, paddingRight: 16
      }}
      onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          style={{
            width: '100%', maxWidth: 640, background: '#ffffff',
            borderRadius: 20, boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.35)',
            border: '1px solid rgba(29, 78, 216, 0.18)', overflow: 'hidden',
            display: 'flex', flexDirection: 'column'
          }}
          onClick={(e) => e.stopPropagation()}>
          
          {/* Search Header Bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px',
            borderBottom: '1px solid var(--border)', background: 'var(--off-white)'
          }}>
            <Search size={20} color="#1d4ed8" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search cases, SHA-256 hashes, evidence files, investigators..."
              style={{
                flex: 1, border: 'none', background: 'transparent', outline: 'none',
                fontSize: 15, fontWeight: 500, color: '#0f172a'
              }}
            />
            {query && (
              <button onClick={() => setQuery('')}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={16} />
              </button>
            )}
            <kbd style={{
              background: '#e2e8f0', color: '#475569', fontSize: 11, fontWeight: 700,
              padding: '2px 7px', borderRadius: 6, border: '1px solid #cbd5e1'
            }}>
              ESC
            </kbd>
          </div>

          {/* Results Container */}
          <div style={{ maxHeight: 420, overflowY: 'auto', padding: '12px 14px' }}>
            {loading && (
              <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Zap size={14} className="animate-spin" color="#1d4ed8" /> Scanning digital forensic vault...
              </div>
            )}

            {/* Cases Results */}
            {results.cases.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.06em', padding: '6px 10px' }}>
                  Cases & Investigations ({results.cases.length})
                </div>
                {results.cases.map((c) => (
                  <div key={c._id}
                    onClick={() => handleSelectCase(c._id)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f0f6ff'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4338ca' }}>
                        <FolderOpen size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a' }}>{c.title}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#1d4ed8' }}>{c.caseNumber || 'CASE'}</span> • Priority: {c.priority} • Status: {c.status}
                        </div>
                      </div>
                    </div>
                    <CornerDownLeft size={13} color="#94a3b8" />
                  </div>
                ))}
              </div>
            )}

            {/* Evidence Results */}
            {results.evidence.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.06em', padding: '6px 10px' }}>
                  Evidence Files & Hashes ({results.evidence.length})
                </div>
                {results.evidence.map((ev) => (
                  <div key={ev._id}
                    onClick={() => handleSelectEvidence(ev)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f0fdf4'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#15803d' }}>
                        <Shield size={16} />
                      </div>
                      <div style={{ maxWidth: 440 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {ev.fileName}
                        </div>
                        <div style={{ fontSize: 10.5, fontFamily: 'monospace', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          SHA-256: {ev.fileHash}
                        </div>
                      </div>
                    </div>
                    <CornerDownLeft size={13} color="#94a3b8" />
                  </div>
                ))}
              </div>
            )}

            {/* Users / Investigators Results */}
            {results.users.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.06em', padding: '6px 10px' }}>
                  Personnel & Investigators ({results.users.length})
                </div>
                {results.users.map((u) => (
                  <div key={u._id}
                    onClick={() => { onClose(); navigate('/users'); }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f5f3ff'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
                        <User size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a' }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>
                          Role: <strong style={{ textTransform: 'capitalize' }}>{u.role}</strong> • {u.email}
                        </div>
                      </div>
                    </div>
                    <CornerDownLeft size={13} color="#94a3b8" />
                  </div>
                ))}
              </div>
            )}

            {/* Quick Actions */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.06em', padding: '6px 10px' }}>
                Quick Forensic Actions
              </div>
              {filteredActions.map((act, idx) => {
                const Icon = act.icon;
                return (
                  <div key={idx}
                    onClick={() => handleSelectAction(act.path)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155' }}>
                        <Icon size={16} />
                      </div>
                      <span style={{ fontSize: 13.5, fontWeight: 500, color: '#334155' }}>
                        {act.label}
                      </span>
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                      padding: '3px 8px', borderRadius: 6, background: '#f1f5f9', color: '#64748b'
                    }}>
                      {act.badge}
                    </span>
                  </div>
                );
              })}
            </div>

          </div>

          {/* Footer Navigation Hints */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 18px', borderTop: '1px solid var(--border)',
            background: 'var(--surface)', fontSize: 11, color: '#64748b'
          }}>
            <span>Forensic Omnibar v2.0 • Merkle Ledger Active</span>
            <div style={{ display: 'flex', gap: 12 }}>
              <span>Press <kbd style={{ padding: '2px 5px', background: 'white', borderRadius: 4, border: '1px solid #cbd5e1' }}>↵</kbd> to select</span>
              <span><kbd style={{ padding: '2px 5px', background: 'white', borderRadius: 4, border: '1px solid #cbd5e1' }}>esc</kbd> to close</span>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
