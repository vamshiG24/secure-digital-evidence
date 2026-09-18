import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const typeConfig = {
  info: { icon: Info, color: '#1d4ed8', bg: 'rgba(29,78,216,0.08)', border: 'rgba(29,78,216,0.15)' },
  warning: { icon: AlertTriangle, color: '#ca8a04', bg: 'rgba(234,179,8,0.08)', border: 'rgba(234,179,8,0.2)' },
  success: { icon: CheckCircle, color: '#16a34a', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)' },
  error: { icon: XCircle, color: '#dc2626', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifs();
  }, []);

  const fetchNotifs = async () => {
    try {
      const { data } = await API.get('/api/notifications');
      setNotifications(data);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id) => {
    try {
      await API.put(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch {}
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    await Promise.all(unread.map(n => API.put(`/api/notifications/${n._id}/read`).catch(() => {})));
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    toast.success('All notifications marked as read');
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const container = {
    hidden: {}, visible: { transition: { staggerChildren: 0.06 } }
  };
  const item = {
    hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk'", fontSize: 22, fontWeight: 800, color: '#0f172a' }}>Notifications</h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <motion.button className="btn btn-outline" onClick={markAllRead}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <CheckCheck size={15} /> Mark all read
          </motion.button>
        )}
      </div>

      <div className="page-body">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 14 }} />)}
          </div>
        ) : notifications.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            style={{ textAlign: 'center', padding: '100px 20px' }}>
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
              <Bell size={64} color="#e2e8f0" style={{ marginBottom: 20 }} />
            </motion.div>
            <h3 style={{ fontWeight: 700, fontSize: 18, color: '#475569', marginBottom: 6 }}>No notifications yet</h3>
            <p style={{ color: '#94a3b8', fontSize: 14 }}>You'll see case assignments and system alerts here</p>
          </motion.div>
        ) : (
          <motion.div variants={container} initial="hidden" animate="visible"
            style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 720 }}>
            {notifications.map((notif, i) => {
              const tc = typeConfig[notif.type] || typeConfig.info;
              const IconComp = tc.icon;
              return (
                <motion.div key={notif._id} variants={item}
                  whileHover={{ x: 4, boxShadow: '0 4px 20px rgba(29,78,216,0.1)' }}
                  style={{
                    background: notif.isRead ? 'white' : `${tc.bg}`,
                    border: `1px solid ${notif.isRead ? 'var(--border)' : tc.border}`,
                    borderRadius: 14, padding: '14px 18px',
                    display: 'flex', gap: 14, cursor: 'pointer',
                    opacity: notif.isRead ? 0.75 : 1,
                    transition: 'all 0.2s ease',
                    position: 'relative', overflow: 'hidden',
                  }}
                  onClick={() => {
                    markRead(notif._id);
                    if (notif.relatedLink) navigate(notif.relatedLink);
                  }}>
                  {!notif.isRead && (
                    <div style={{
                      position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
                      background: tc.color, borderRadius: '14px 0 0 14px',
                    }} />
                  )}
                  <div style={{
                    width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                    background: tc.bg, border: `1.5px solid ${tc.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <IconComp size={18} color={tc.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <p style={{ fontSize: 14, fontWeight: notif.isRead ? 500 : 700, color: '#0f172a', lineHeight: 1.4 }}>
                        {notif.message}
                      </p>
                      {!notif.isRead && (
                        <span style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: tc.color, flexShrink: 0, marginTop: 4,
                        }} />
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 5 }}>
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>
                        {new Date(notif.createdAt).toLocaleString()}
                      </span>
                      {notif.relatedLink && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: tc.color, fontWeight: 600 }}>
                          <ExternalLink size={11} /> View
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </>
  );
}
