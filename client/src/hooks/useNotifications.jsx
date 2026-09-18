import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

const SOCKET_URL = import.meta.env.VITE_API_URL || undefined; // undefined → same origin (Vite/Nginx proxy)
const NotificationsContext = createContext(null);

/**
 * Real-time notifications shared app-wide: one socket joins the user's room,
 * with a 60s poll as fallback. Mounted once inside the authenticated layout.
 */
export function NotificationsProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await API.get('/api/notifications');
      setItems(data);
    } catch { /* keep last known state */ } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return undefined;
    refresh();
    const poll = setInterval(refresh, 60000);

    const socket = io(SOCKET_URL, { withCredentials: true, transports: ['websocket', 'polling'] });
    socket.on('connect', () => socket.emit('join_room', String(user._id || user.id)));
    socket.on('notification', (n) => {
      setItems(prev => (prev.some(p => p._id === n._id) ? prev : [n, ...prev]));
      toast(n.message, { id: n._id, icon: '🔔' });
    });

    return () => { clearInterval(poll); socket.disconnect(); };
  }, [user, refresh]);

  const markRead = useCallback(async (id) => {
    setItems(prev => prev.map(n => (n._id === id ? { ...n, isRead: true } : n)));
    try { await API.put(`/api/notifications/${id}/read`); } catch { refresh(); }
  }, [refresh]);

  const markAllRead = useCallback(async () => {
    setItems(prev => prev.map(n => ({ ...n, isRead: true })));
    try { await API.put('/api/notifications/read-all'); } catch { refresh(); }
  }, [refresh]);

  const value = useMemo(() => {
    const unread = items.filter(n => !n.isRead);
    return { items, unread, unreadCount: unread.length, loading, refresh, markRead, markAllRead };
  }, [items, loading, refresh, markRead, markAllRead]);

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export default function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}
