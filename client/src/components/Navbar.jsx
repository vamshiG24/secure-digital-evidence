import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { 
  Search, Bell, Shield, User, Settings, LogOut, 
  ChevronDown, Check, Sparkles, FolderOpen, FileText, Activity, Zap
} from 'lucide-react';
import CommandPalette from './CommandPalette';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadNotifs, setUnreadNotifs] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const dropdownRef = useRef();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data } = await API.get('/api/notifications');
        setUnreadNotifs(data.filter(n => !n.isRead));
      } catch {}
    };
    if (user) fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch {
      toast.error('Logout failed');
    }
  };

  const markAllRead = async () => {
    try {
      await Promise.all(unreadNotifs.map(n => API.put(`/api/notifications/${n._id}/read`)));
      setUnreadNotifs([]);
      toast.success('All notifications marked as read');
    } catch {}
  };

  // Compute breadcrumb title based on path
  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return { title: 'Security Command Center', subtitle: 'Real-time Vault Telemetry & Threat Monitor' };
    if (path.startsWith('/cases')) return { title: 'Case Management Pipeline', subtitle: 'Digital Evidence Files & Investigations' };
    if (path.startsWith('/evidence')) return { title: 'Cryptographic Evidence Vault', subtitle: 'SHA-256 & Merkle Chain of Custody' };
    if (path.startsWith('/ai-studio')) return { title: 'AI Forensic Studio', subtitle: 'Multimodal RAG & Gemini 2.5 Intelligence' };
    if (path.startsWith('/notifications')) return { title: 'Alerts & Telemetry', subtitle: 'Live System & Custody Logs' };
    if (path.startsWith('/audit-logs')) return { title: 'Compliance Audit Trail', subtitle: 'Immutable Forensic Activity Logs' };
    if (path.startsWith('/users')) return { title: 'Personnel & Access Directory', subtitle: 'Role-Based Access Control' };
    if (path.startsWith('/profile')) return { title: 'Officer Profile', subtitle: 'Security Credentials & 2FA' };
    return { title: 'SecureEvidence', subtitle: 'Digital Forensics Command Platform' };
  };

  const breadcrumb = getBreadcrumbs();

  return (
    <>
      <header style={{
        height: 80, background: 'white', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 28px', position: 'sticky', top: 0, zIndex: 900,
        boxShadow: '0 4px 20px rgba(15,23,42,0.02)',
        position: 'relative'
      }}>
        {/* Top gradient accent line */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #1d4ed8, #3b82f6, #06b6d4)' }} />
        
        {/* Left: Breadcrumbs & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', fontFamily: "'Space Grotesk'" }}>
              {breadcrumb.title}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>
              {breadcrumb.subtitle}
            </div>
          </div>
          
          {/* Cyber HUD Status Badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 10px', borderRadius: 99,
            background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)',
            fontSize: 11, fontWeight: 700, color: '#15803d'
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', boxShadow: '0 0 8px #16a34a' }} />
            VAULT SEALED
          </div>
        </div>

        {/* Center: Command Palette Trigger */}
        <div
          onClick={() => setShowCommandPalette(true)}
          style={{
            flex: 1, maxWidth: 420, margin: '0 24px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#f8fafc', border: '1px solid var(--border)',
            borderRadius: 99, padding: '8px 16px', transition: 'all 0.2s',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = '#ffffff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = '#f8fafc'; }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#64748b', fontSize: 13 }}>
            <Search size={16} color="#3b82f6" />
            <span>Search cases, hashes, evidence...</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <kbd style={{
              background: '#e2e8f0', color: '#475569', fontSize: 10.5, fontWeight: 700,
              padding: '2px 6px', borderRadius: 5, border: '1px solid #cbd5e1'
            }}>
              Ctrl
            </kbd>
            <kbd style={{
              background: '#e2e8f0', color: '#475569', fontSize: 10.5, fontWeight: 700,
              padding: '2px 6px', borderRadius: 5, border: '1px solid #cbd5e1'
            }}>
              K
            </kbd>
          </div>
        </div>

        {/* Right: Actions (Notifications & User Profile) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>

        {/* Notification Bell Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            style={{
              width: 38, height: 38, borderRadius: 10, border: '1px solid var(--border)',
              background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', position: 'relative', color: '#475569'
            }}>
            <Bell size={18} />
            {unreadNotifs.length > 0 && (
              <span style={{
                position: 'absolute', top: -3, right: -3, width: 18, height: 18, borderRadius: '50%',
                background: '#dc2626', color: 'white', fontSize: 10, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white'
              }}>
                {unreadNotifs.length}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifDropdown && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                style={{
                  position: 'absolute', right: 0, top: 48, width: 320, background: 'white',
                  borderRadius: 16, border: '1px solid var(--border)', boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                  zIndex: 1000, overflow: 'hidden'
                }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Notifications ({unreadNotifs.length})</span>
                  {unreadNotifs.length > 0 && (
                    <button onClick={markAllRead} style={{ border: 'none', background: 'transparent', color: '#1d4ed8', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                      Mark all read
                    </button>
                  )}
                </div>
                <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                  {unreadNotifs.length === 0 ? (
                    <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>No unread notifications</div>
                  ) : (
                    unreadNotifs.map(n => (
                      <div key={n._id} style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', fontSize: 12, color: '#334155' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{n.title || 'Case Alert'}</div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{n.message}</div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Profile Avatar & Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, background: '#f8fafc',
              border: '1px solid var(--border)', padding: '4px 10px 4px 4px', borderRadius: 99,
              cursor: 'pointer'
            }}>
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg, #1d4ed8, #06b6d4)',
                color: 'white', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <div style={{ textTransform: 'capitalize', fontSize: 13, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 4 }}>
              {user?.name?.split(' ')[0]}
              <ChevronDown size={14} style={{ color: '#64748b' }} />
            </div>
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                style={{
                  position: 'absolute', right: 0, top: 48, width: 220, background: 'white',
                  borderRadius: 16, border: '1px solid var(--border)', boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                  zIndex: 1000, padding: 8
                }}>
                <div style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', marginBottom: 4 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{user?.name}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{user?.email}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Shield size={10} /> 2FA Verified ({user?.role})
                  </div>
                </div>

                <Link to="/profile" onClick={() => setShowUserMenu(false)} style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, fontSize: 13, color: '#334155', fontWeight: 500, cursor: 'pointer' }}>
                    <User size={15} /> My Profile & Settings
                  </div>
                </Link>

                <div onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, fontSize: 13, color: '#dc2626', fontWeight: 500, cursor: 'pointer', marginTop: 2 }}>
                  <LogOut size={15} /> Sign Out
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </div>
        </div>
      </header>
      <CommandPalette isOpen={showCommandPalette} onClose={() => setShowCommandPalette(false)} />
    </>
  );
}


