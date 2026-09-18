import { useCallback, useEffect, useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { NotificationsProvider } from '../hooks/useNotifications.jsx';
import { pageTransition } from '../components/ui/motion';

const COLLAPSE_KEY = 'sde-sidebar-collapsed';
const readCollapsed = () => { try { return localStorage.getItem(COLLAPSE_KEY) === '1'; } catch { return false; } };

function Splash() {
  return (
    <div style={{ height: '100dvh', display: 'grid', placeItems: 'center', background: 'var(--bg)' }} role="status" aria-live="polite">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
        <motion.div
          style={{ width: 56, height: 56, borderRadius: 16, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, var(--brand-600), var(--cyan-500))', boxShadow: 'var(--shadow-glow)' }}
          animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Shield size={26} color="#fff" />
        </motion.div>
        <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.4, repeat: Infinity }} style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
          Establishing secure session…
        </motion.span>
      </div>
    </div>
  );
}

export default function AppLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapsed = useCallback(() => {
    setCollapsed(c => { try { localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1'); } catch { /* ignore */ } return !c; });
  }, []);

  // Close the drawer on navigation and move focus to main content for SR users
  useEffect(() => {
    setMobileOpen(false);
    document.getElementById('main-content')?.focus({ preventScroll: true });
  }, [location.pathname]);

  if (loading) return <Splash />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  return (
    <NotificationsProvider>
    <div className="app-shell" data-collapsed={collapsed}>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <Sidebar collapsed={collapsed} onToggleCollapsed={toggleCollapsed} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="app-main">
        <Navbar onOpenMobileNav={() => setMobileOpen(true)} />
        <main id="main-content" className="app-content" tabIndex={-1} style={{ outline: 'none' }}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={location.pathname} {...pageTransition} style={{ willChange: 'opacity, transform' }}>
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
    </NotificationsProvider>
  );
}
