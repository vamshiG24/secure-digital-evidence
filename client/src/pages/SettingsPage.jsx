import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { User, Mail, Lock, ShieldCheck, Save, Loader2, Key, Server, Cpu } from 'lucide-react';

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = { name, email };
      if (password) payload.password = password;

      const { data } = await API.put('/api/users/profile', payload);
      setUser(data);
      toast.success('Account profile updated successfully');
      setPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ 
            width: 42, height: 42, borderRadius: 12, 
            background: 'linear-gradient(135deg, #1d4ed8, #06b6d4)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
            boxShadow: '0 4px 16px rgba(29,78,216,0.3)' 
          }}>
            <Key size={22} />
          </div>
          <div>
            <h1 style={{ fontFamily: "'Space Grotesk'", fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Account & Security Settings
            </h1>
            <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
              Manage profile information, security credentials, and platform preferences
            </p>
          </div>
        </div>
      </div>

      <div className="page-body" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        {/* Settings Form */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: 'white', borderRadius: 20, border: '1px solid var(--border)', padding: 24, boxShadow: '0 8px 30px rgba(15,23,42,0.04)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginTop: 0, marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
            Profile & Authentication Credentials
          </h3>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: 14, top: 14, color: '#94a3b8' }} />
                <input
                  type="text"
                  className="input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={{ paddingLeft: 42, borderRadius: 12 }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 14, top: 14, color: '#94a3b8' }} />
                <input
                  type="email"
                  className="input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{ paddingLeft: 42, borderRadius: 12 }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>New Password (leave blank to keep current)</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: 14, color: '#94a3b8' }} />
                <input
                  type="password"
                  className="input"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ paddingLeft: 42, borderRadius: 12 }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ borderRadius: 12, padding: '12px 24px' }}>
                {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <><Save size={16} /> Save Settings</>}
              </button>
            </div>
          </form>
        </motion.div>

        {/* Security & System Info Side Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'white', borderRadius: 20, border: '1px solid var(--border)', padding: 20, boxShadow: '0 8px 30px rgba(15,23,42,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <ShieldCheck size={22} style={{ color: '#16a34a' }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>2FA Security Status</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Globally Enforced</div>
              </div>
            </div>
            <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, margin: 0 }}>
              Multi-Factor Authentication (OTP email verification) is active on your account to safeguard sensitive evidence operations.
            </p>
          </div>

          <div style={{ background: 'white', borderRadius: 20, border: '1px solid var(--border)', padding: 20, boxShadow: '0 8px 30px rgba(15,23,42,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Cpu size={22} style={{ color: '#1d4ed8' }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Gemini AI RAG Status</div>
                <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>Active (Gemini 2.5)</div>
              </div>
            </div>
            <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, margin: 0 }}>
              Multimodal Vision AI & Retrieval-Augmented Generation enabled in backend environment configuration (`server/.env`).
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
