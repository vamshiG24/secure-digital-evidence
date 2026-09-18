import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Search, Bell, Sun, Moon, Menu, LogOut, User, Check, ChevronDown, Sparkles, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import useNotifications from '../hooks/useNotifications.jsx';
import CommandPalette from './CommandPalette';
import { Avatar } from './ui';
import { scaleIn, spring } from './ui/motion';

const TITLES = {
  '/dashboard': 'Dashboard', '/cases': 'Cases', '/evidence': 'Evidence Vault', '/ai-studio': 'AI Forensic Studio',
  '/notifications': 'Notifications', '/audit-logs': 'Audit Logs', '/users': 'User Directory', '/profile': 'My Profile',
};

const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

function useClickOutside(ref, onOut) {
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onOut(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [ref, onOut]);
}

export default function Navbar({ onOpenMobileNav }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { unread, unreadCount, markRead, markAllRead } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const notifRef = useRef(null);
  const menuRef = useRef(null);

  useClickOutside(notifRef, () => setNotifOpen(false));
  useClickOutside(menuRef, () => setMenuOpen(false));

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPaletteOpen(p => !p); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleLogout = async () => {
    try { await logout(); toast.success('Signed out'); navigate('/login'); }
    catch { toast.error('Logout failed'); }
  };

  const base = '/' + location.pathname.split('/')[1];
  const title = TITLES[base] || 'SecureEvidence';
  const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform);

  return (
    <>
      <header className="navbar">
        <button className="btn btn-ghost btn-icon" onClick={onOpenMobileNav} aria-label="Open navigation" data-mobile-only style={{ display: 'none' }}>
          <Menu size={20} />
        </button>

        <div style={{ minWidth: 0 }}>
          <div className="eyebrow" style={{ fontSize: 10 }}>{location.pathname.split('/').length > 2 ? 'Detail' : 'Overview'}</div>
          <h2 style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</h2>
        </div>

        {/* Search trigger */}
        <motion.button
          onClick={() => setPaletteOpen(true)} whileTap={{ scale: 0.98 }}
          aria-label="Open command palette"
          style={{
            marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, minHeight: 40, padding: '0 12px 0 14px',
            width: 'min(340px, 34vw)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)',
            background: 'var(--surface)', color: 'var(--text-muted)', fontSize: 14, cursor: 'text', textAlign: 'left',
          }}
          className="search-trigger"
        >
          <Search size={16} aria-hidden="true" />
          <span style={{ flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>Search cases, evidence, hashes…</span>
          <span className="kbd" aria-hidden="true">{isMac ? '⌘' : 'Ctrl'} K</span>
        </motion.button>

        {/* Theme */}
        <motion.button className="btn btn-ghost btn-icon" onClick={toggle} whileTap={{ rotate: 30, scale: 0.9 }} transition={spring}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} title="Toggle theme">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={theme} initial={{ rotate: -60, opacity: 0, scale: 0.6 }} animate={{ rotate: 0, opacity: 1, scale: 1 }} exit={{ rotate: 60, opacity: 0, scale: 0.6 }} transition={{ duration: 0.2 }} style={{ display: 'inline-flex' }}>
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </motion.span>
          </AnimatePresence>
        </motion.button>

        {/* Notifications */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button className="btn btn-ghost btn-icon" onClick={() => setNotifOpen(o => !o)} aria-label={`Notifications, ${unreadCount} unread`} aria-expanded={notifOpen} aria-haspopup="true" style={{ position: 'relative' }}>
            <motion.span animate={unreadCount ? { rotate: [0, -12, 12, -8, 8, 0] } : {}} transition={{ duration: 0.6, repeat: unreadCount ? Infinity : 0, repeatDelay: 6 }} style={{ display: 'inline-flex' }}>
              <Bell size={18} />
            </motion.span>
            {unreadCount > 0 && <span className="notif-dot notif-dot-pulse" aria-hidden="true" />}
          </button>
          <AnimatePresence>
            {notifOpen && (
              <motion.div className="dropdown" variants={scaleIn} initial="hidden" animate="visible" exit="exit" style={{ right: 0, top: 'calc(100% + 8px)', width: 360, transformOrigin: 'top right' }} role="menu">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                  <strong style={{ fontSize: 14 }}>Notifications</strong>
                  {unreadCount > 0 && <button className="btn btn-ghost btn-sm" onClick={markAllRead}><Check size={14} /> Mark all read</button>}
                </div>
                <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                  {unread.length === 0 ? (
                    <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>You're all caught up.</div>
                  ) : unread.slice(0, 8).map(n => (
                    <button key={n._id} className="dropdown-item" style={{ alignItems: 'flex-start', padding: '12px 14px' }} role="menuitem"
                      onClick={() => { markRead(n._id); setNotifOpen(false); if (n.relatedLink) navigate(n.relatedLink); }}>
                      <span style={{ width: 8, height: 8, marginTop: 6, borderRadius: 99, background: 'var(--primary)', flexShrink: 0 }} aria-hidden="true" />
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'block', color: 'var(--text-primary)', fontSize: 13.5, lineHeight: 1.4 }}>{n.message}</span>
                        <span style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>{timeAgo(n.createdAt)}</span>
                      </span>
                      <ChevronRight size={14} style={{ color: 'var(--text-faint)', marginTop: 4 }} aria-hidden="true" />
                    </button>
                  ))}
                </div>
                <button className="dropdown-item" style={{ justifyContent: 'center', borderTop: '1px solid var(--border)', color: 'var(--primary)', fontWeight: 600 }} onClick={() => { setNotifOpen(false); navigate('/notifications'); }}>
                  View all notifications
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User menu */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button onClick={() => setMenuOpen(o => !o)} aria-label="Account menu" aria-expanded={menuOpen} aria-haspopup="true"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px 4px 4px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer' }}>
            <Avatar name={user?.name} src={user?.avatarUrl} size={32} />
            <span className="nav-label" style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} data-desktop-only>{user?.name?.split(' ')[0]}</span>
            <ChevronDown size={14} style={{ color: 'var(--text-faint)' }} aria-hidden="true" />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div className="dropdown" variants={scaleIn} initial="hidden" animate="visible" exit="exit" style={{ right: 0, top: 'calc(100% + 8px)', width: 240, transformOrigin: 'top right' }} role="menu">
                <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{user?.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
                </div>
                <button className="dropdown-item" role="menuitem" onClick={() => { setMenuOpen(false); navigate('/profile'); }}><User size={16} /> My profile</button>
                <button className="dropdown-item" role="menuitem" onClick={() => { setMenuOpen(false); navigate('/ai-studio'); }}><Sparkles size={16} /> AI Forensic Studio</button>
                <button className="dropdown-item danger" role="menuitem" onClick={handleLogout}><LogOut size={16} /> Sign out</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}
