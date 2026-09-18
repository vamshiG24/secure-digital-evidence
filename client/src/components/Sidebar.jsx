import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Shield, LayoutDashboard, FolderOpen, FileText, Bell, ClipboardList,
  Users, LogOut, Sparkles, PanelLeftClose, PanelLeftOpen, User, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useNotifications from '../hooks/useNotifications.jsx';
import { Avatar } from './ui';
import { spring } from './ui/motion';

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/cases', icon: FolderOpen, label: 'Cases' },
  { to: '/evidence', icon: FileText, label: 'Evidence Vault' },
  { to: '/ai-studio', icon: Sparkles, label: 'AI Forensic Studio', tag: 'AI' },
  { to: '/notifications', icon: Bell, label: 'Notifications', badge: true },
  { to: '/audit-logs', icon: ClipboardList, label: 'Audit Logs', roles: ['admin'] },
  { to: '/users', icon: Users, label: 'User Directory', roles: ['admin', 'investigator'] },
];

const ROLE_TONE = { admin: 'danger', investigator: 'primary', analyst: 'success' };

export default function Sidebar({ collapsed, onToggleCollapsed, mobileOpen, onCloseMobile }) {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Signed out');
      navigate('/login');
    } catch {
      toast.error('Logout failed');
    }
  };

  const visible = NAV.filter(item => !item.roles || item.roles.includes(user?.role));
  const tone = ROLE_TONE[user?.role] || 'primary';

  return (
    <>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div className="sidebar-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCloseMobile} aria-hidden="true" />
        )}
      </AnimatePresence>

      <aside className="sidebar" data-collapsed={collapsed} data-open={mobileOpen} aria-label="Primary navigation">
        <div style={{ height: 3, background: 'linear-gradient(90deg, var(--brand-600), var(--brand-400), var(--cyan-500))', flexShrink: 0 }} />

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: collapsed ? '16px 0' : '16px 18px', justifyContent: collapsed ? 'center' : 'flex-start', borderBottom: '1px solid var(--border)', minHeight: 64 }}>
          <motion.div
            whileHover={{ rotate: -6, scale: 1.05 }} transition={spring}
            style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, var(--brand-600), var(--cyan-500))', boxShadow: '0 4px 14px var(--primary-glow)' }}
          >
            <Shield size={19} color="#fff" />
          </motion.div>
          {!collapsed && (
            <div className="nav-label" style={{ lineHeight: 1.15, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>SecureEvidence</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Digital Forensics Platform</div>
            </div>
          )}
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onCloseMobile} aria-label="Close navigation" style={{ marginLeft: 'auto', display: 'none' }} data-mobile-only>
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {!collapsed && <div className="eyebrow nav-label" style={{ padding: '6px 10px 10px' }}>Workspace</div>}
          {visible.map((item, i) => (
            <motion.div key={item.to} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03, ...spring }}>
              <NavLink to={item.to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} title={collapsed ? item.label : undefined} aria-label={item.label}>
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span layoutId="nav-active-bar" transition={spring} aria-hidden="true"
                        style={{ position: 'absolute', left: -1, top: 8, bottom: 8, width: 3, borderRadius: 99, background: 'var(--primary)' }} />
                    )}
                    <span style={{ position: 'relative', display: 'inline-flex' }}>
                      <item.icon size={18} strokeWidth={isActive ? 2.2 : 1.8} aria-hidden="true" />
                      {item.badge && unreadCount > 0 && collapsed && (
                        <span className="notif-dot" style={{ top: -4, right: -4 }} aria-hidden="true" />
                      )}
                    </span>
                    <span className="nav-label" style={{ flex: 1 }}>{item.label}</span>
                    {item.tag && <span className="nav-extra badge badge-purple" style={{ fontSize: 9.5, padding: '2px 6px' }}>{item.tag}</span>}
                    {item.badge && unreadCount > 0 && (
                      <span className="nav-extra" style={{ minWidth: 20, height: 20, padding: '0 6px', borderRadius: 99, display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, background: 'var(--danger)', color: '#fff' }}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            </motion.div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: 12, borderTop: '1px solid var(--border)' }}>
          <NavLink to="/profile" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} style={{ padding: collapsed ? 8 : '8px 10px' }} title={collapsed ? 'My profile' : undefined} aria-label="My profile">
            <Avatar name={user?.name} src={user?.avatarUrl} size={34} />
            <span className="nav-label" style={{ minWidth: 0, flex: 1 }}>
              <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</span>
              <span className={`badge badge-${tone}`} style={{ marginTop: 3, fontSize: 9.5, padding: '1px 6px' }}>{user?.role}</span>
            </span>
            <User size={15} className="nav-extra" style={{ color: 'var(--text-faint)' }} aria-hidden="true" />
          </NavLink>

          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout} aria-label="Sign out" style={{ flex: 1, justifyContent: collapsed ? 'center' : 'flex-start', color: 'var(--text-muted)' }}>
              <LogOut size={16} aria-hidden="true" /><span className="nav-label">Sign out</span>
            </button>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={onToggleCollapsed} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-pressed={collapsed} style={{ color: 'var(--text-muted)' }} data-desktop-only>
              {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
