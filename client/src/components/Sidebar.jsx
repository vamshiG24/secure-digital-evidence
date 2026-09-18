import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
  Shield, LayoutDashboard, FolderOpen, FileText,
  Bell, ClipboardList, Users, LogOut, Settings,
  ChevronRight, Activity, Sparkles, User
} from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../api/axios';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/cases', icon: FolderOpen, label: 'Cases' },
  { to: '/evidence', icon: FileText, label: 'Evidence Vault' },
  { to: '/ai-studio', icon: Sparkles, label: 'AI Forensic Studio', badgeText: 'NEW' },
  { to: '/notifications', icon: Bell, label: 'Notifications', badge: true },
  { to: '/audit-logs', icon: ClipboardList, label: 'Audit Logs', adminOnly: true },
  { to: '/users', icon: Users, label: 'User Directory', adminOnly: true },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const { data } = await API.get('/api/notifications');
        setUnread(data.filter(n => !n.isRead).length);
      } catch {}
    };
    if (user) fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
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

  const visibleItems = navItems.filter(item =>
    !item.adminOnly || user?.role === 'admin'
  );

  const roleColors = {
    admin: { bg: 'rgba(239,68,68,0.1)', color: '#dc2626', border: 'rgba(239,68,68,0.2)' },
    investigator: { bg: 'rgba(59,130,246,0.1)', color: '#1d4ed8', border: 'rgba(59,130,246,0.2)' },
    analyst: { bg: 'rgba(34,197,94,0.1)', color: '#16a34a', border: 'rgba(34,197,94,0.2)' },
  };
  const roleStyle = roleColors[user?.role] || roleColors.investigator;

  return (
    <motion.aside className="sidebar"
      initial={{ x: -260 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}>

      {/* Top gradient accent */}
      <div style={{ height: 3, background: 'linear-gradient(90deg, #1d4ed8, #3b82f6, #06b6d4)', flexShrink: 0 }} />

      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)' }}>
        <motion.div style={{ display: 'flex', alignItems: 'center', gap: 12 }}
          whileHover={{ x: 2 }} transition={{ type: 'spring', stiffness: 400 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(29,78,216,0.3)',
            flexShrink: 0,
          }}>
            <Shield size={20} color="white" />
          </div>
          <div>
            <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 15, color: '#0f172a', lineHeight: 1.2 }}>
              SecureEvidence
            </div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>Digital Forensics Platform</div>
          </div>
        </motion.div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 12px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 8px 8px', marginBottom: 2 }}>
          Navigation
        </div>
        {visibleItems.map((item, i) => (
          <motion.div key={item.to}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}>
            <NavLink
              to={item.to}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 10px', borderRadius: 10, marginBottom: 2,
                textDecoration: 'none', fontSize: 14, fontWeight: 500,
                transition: 'all 0.2s ease', position: 'relative',
                background: isActive ? 'linear-gradient(135deg, rgba(29,78,216,0.1), rgba(59,130,246,0.07))' : 'transparent',
                color: isActive ? '#1d4ed8' : '#475569',
                border: isActive ? '1px solid rgba(29,78,216,0.15)' : '1px solid transparent',
              })}>
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div layoutId="nav-indicator"
                      style={{
                        position: 'absolute', left: 0, top: 4, bottom: 4,
                        width: 3, borderRadius: 99,
                        background: 'linear-gradient(180deg, #1d4ed8, #3b82f6)',
                      }}
                    />
                  )}
                  <item.icon size={17} style={{ flexShrink: 0, marginLeft: isActive ? 4 : 0, transition: 'margin 0.2s' }} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.badgeText && (
                    <span style={{
                      background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                      color: 'white', fontSize: 9, fontWeight: 800,
                      padding: '1px 6px', borderRadius: 99, letterSpacing: '0.05em'
                    }}>
                      {item.badgeText}
                    </span>
                  )}
                  {item.badge && unread > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      style={{
                        background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
                        color: 'white', fontSize: 10, fontWeight: 700,
                        padding: '1px 6px', borderRadius: 99,
                        boxShadow: '0 2px 8px rgba(29,78,216,0.4)',
                      }}>
                      {unread}
                    </motion.span>
                  )}
                  {isActive && <ChevronRight size={14} style={{ opacity: 0.5 }} />}
                </>
              )}
            </NavLink>
          </motion.div>
        ))}
      </nav>

      {/* Logout */}
      <div style={{ padding: '12px 12px 16px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        <motion.button
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleLogout}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 10px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: 'transparent', color: '#64748b', fontSize: 14, fontWeight: 500,
            transition: 'all 0.2s ease',
            fontFamily: 'inherit',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#dc2626'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; }}>
          <LogOut size={17} />
          Sign Out
        </motion.button>
      </div>
    </motion.aside>
  );
}
