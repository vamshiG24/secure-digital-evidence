import { createContext, useContext, useState, useEffect } from 'react';
import API, { SESSION_EXPIRED_EVENT } from '../api/axios';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const { data } = await API.get('/api/users/me');
        setUser(data);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchMe();

    // Any non-auth 401 means the session was revoked (logout elsewhere, suspension, password change)
    const onExpired = () => {
      setUser((current) => {
        if (current) toast.error('Your session has ended. Please sign in again.', { id: 'session-expired' });
        return null;
      });
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  const login = async (email, password) => {
    const { data } = await API.post('/api/users/login', { email, password });
    return data;
  };

  const verifyOTP = async (email, otp) => {
    const { data } = await API.post('/api/users/verify-login-otp', { email, otp });
    setUser(data);
    return data;
  };

  const register = async (userData) => {
    const { data } = await API.post('/api/users', userData);
    return data;
  };

  const logout = async () => {
    await API.post('/api/users/logout');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, verifyOTP, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
