import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { User, Mail, Shield, Lock, Camera, Save, Loader2, Building, BadgeCheck, FolderOpen, Key } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function UserProfilePage() {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  // Form State
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [department, setDepartment] = useState(user?.department || 'Cyber Forensics Unit');
  const [badgeId, setBadgeId] = useState(user?.badgeId || 'CF-8492');
  const [bio, setBio] = useState(user?.bio || 'Digital Forensics Specialist & Incident Response Analyst.');
  const [password, setPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [saving, setSaving] = useState(false);

  // Stats & Cases
  const [userCases, setUserCases] = useState([]);
  const [loadingCases, setLoadingCases] = useState(true);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setAvatarUrl(user.avatarUrl || '');
      setDepartment(user.department || 'Cyber Forensics Unit');
      setBadgeId(user.badgeId || 'CF-8492');
      setBio(user.bio || 'Digital Forensics Specialist & Incident Response Analyst.');
    }
  }, [user]);

  useEffect(() => {
    API.get('/api/cases')
      .then(res => {
        const assigned = res.data.filter(c => 
          c.assignedTo?._id === user?._id || c.assignedTo === user?._id || c.createdBy?._id === user?._id
        );
        setUserCases(assigned);
      })
      .catch(() => {})
      .finally(() => setLoadingCases(false));
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = { name, avatarUrl, department, badgeId, bio };
      if (password) {
        if (password.length < 8) { toast.error('New password must be at least 8 characters'); setSaving(false); return; }
        payload.password = password;
        payload.currentPassword = currentPassword;
      }

      const { data } = await API.put('/api/users/profile', payload);
      setUser(data);
      toast.success('User Profile updated successfully!');
      setPassword('');
      setCurrentPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const roleColors = {
    admin: { bg: 'var(--danger-soft)', color: 'var(--danger)', border: 'color-mix(in srgb, var(--danger) 30%, transparent)' },
    investigator: { bg: 'var(--primary-soft)', color: 'var(--primary)', border: 'var(--border-brand)' },
    analyst: { bg: 'var(--success-soft)', color: 'var(--success)', border: 'color-mix(in srgb, var(--success) 30%, transparent)' },
  };
  const roleStyle = roleColors[user?.role] || roleColors.investigator;

  return (
    <>
      {/* Hero Profile Header Card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'var(--surface)', borderRadius: 24, border: '1px solid var(--border)',
          padding: 28, boxShadow: '0 8px 30px var(--border)', marginBottom: 24,
          position: 'relative', overflow: 'hidden'
        }}>
        {/* Top Accent Gradient Bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, background: 'linear-gradient(90deg, var(--primary), var(--accent), var(--primary-light))' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, marginTop: 4 }}>
          {/* Avatar Photo & Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ position: 'relative' }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt={name} style={{ width: 84, height: 84, borderRadius: 24, objectFit: 'cover', border: '3px solid white', boxShadow: '0 8px 24px var(--border-brand)' }} />
              ) : (
                <div style={{
                  width: 84, height: 84, borderRadius: 24,
                  background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                  color: 'white', fontWeight: 800, fontSize: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 8px 24px var(--border-brand)'
                }}>
                  {name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h1 style={{ fontFamily: "'Space Grotesk'", fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {name}
                </h1>
                <span style={{
                  padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  background: roleStyle.bg, color: roleStyle.color, border: `1px solid ${roleStyle.border}`
                }}>
                  {user?.role}
                </span>
              </div>

              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Mail size={14} /> {email}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--primary)', fontWeight: 600 }}><Building size={14} /> {department}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-primary)', fontWeight: 700 }}><BadgeCheck size={14} color="var(--success)" /> ID: {badgeId}</span>
              </div>
            </div>
          </div>

          {/* Quick Stats Badges */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border-strong)', padding: '12px 18px', borderRadius: 16, textAlign: 'center', minWidth: 110 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)', fontFamily: "'Space Grotesk'" }}>{userCases.length}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 2 }}>Assigned Cases</div>
            </div>

            <div style={{ background: 'var(--success-soft)', border: '1px solid color-mix(in srgb, var(--success) 30%, transparent)', padding: '12px 18px', borderRadius: 16, textAlign: 'center', minWidth: 130 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <Shield size={14} /> 2FA Active
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', marginTop: 4 }}>MFA OTP Protection</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: 10, marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
          <button
            onClick={() => setActiveTab('profile')}
            style={{
              padding: '8px 18px', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none',
              background: activeTab === 'profile' ? 'linear-gradient(135deg, var(--primary), var(--primary))' : 'var(--surface-2)',
              color: activeTab === 'profile' ? 'white' : 'var(--text-secondary)'
            }}>
            <User size={14} style={{ display: 'inline', marginRight: 6 }} /> Profile Details
          </button>
          <button
            onClick={() => setActiveTab('security')}
            style={{
              padding: '8px 18px', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none',
              background: activeTab === 'security' ? 'linear-gradient(135deg, var(--primary), var(--primary))' : 'var(--surface-2)',
              color: activeTab === 'security' ? 'white' : 'var(--text-secondary)'
            }}>
            <Lock size={14} style={{ display: 'inline', marginRight: 6 }} /> Security & 2FA
          </button>
          <button
            onClick={() => setActiveTab('cases')}
            style={{
              padding: '8px 18px', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none',
              background: activeTab === 'cases' ? 'linear-gradient(135deg, var(--primary), var(--primary))' : 'var(--surface-2)',
              color: activeTab === 'cases' ? 'white' : 'var(--text-secondary)'
            }}>
            <FolderOpen size={14} style={{ display: 'inline', marginRight: 6 }} /> My Cases ({userCases.length})
          </button>
        </div>
      </motion.div>

      {/* Main Tab Contents */}
      <div className="page-body" style={{ padding: 0 }}>
        {activeTab === 'profile' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', padding: 24, boxShadow: '0 8px 30px var(--border)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 20px 0' }}>Edit Specialist Profile</h3>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Full Name</label>
                  <input type="text" className="input" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Email Address</label>
                  <input type="email" className="input" value={email} readOnly aria-readonly="true" title="Email cannot be changed" style={{ opacity: 0.7, cursor: "not-allowed" }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Profile Picture URL (Photo Avatar)</label>
                <div style={{ position: 'relative' }}>
                  <Camera size={16} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--text-faint)' }} />
                  <input type="text" className="input" placeholder="https://example.com/photo.jpg" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} style={{ paddingLeft: 42 }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Department / Unit</label>
                  <input type="text" className="input" value={department} onChange={e => setDepartment(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Badge / Personnel ID</label>
                  <input type="text" className="input" value={badgeId} onChange={e => setBadgeId(e.target.value)} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Specialist Bio</label>
                <textarea className="input" rows={3} value={bio} onChange={e => setBio(e.target.value)} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                <button type="submit" className="btn btn-primary" disabled={saving} style={{ borderRadius: 12, padding: '12px 24px' }}>
                  {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <><Save size={16} /> Save Profile Changes</>}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {activeTab === 'security' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', padding: 24, boxShadow: '0 8px 30px var(--border)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 20px 0' }}>Security & Credentials</h3>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 500 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label" htmlFor="cur-pass">Current password</label>
                <input id="cur-pass" type="password" className="input" autoComplete="current-password" placeholder="Required to change your password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required={!!password} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label" htmlFor="new-pass">New password</label>
                <input id="new-pass" type="password" className="input" autoComplete="new-password" placeholder="At least 8 characters" minLength={8} value={password} onChange={e => setPassword(e.target.value)} />
                <div className="helper">Your email address cannot be changed here; contact an administrator.</div>
              </div>

              <div style={{ background: 'var(--success-soft)', border: '1px solid color-mix(in srgb, var(--success) 30%, transparent)', padding: 16, borderRadius: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                <Shield size={24} style={{ color: 'var(--success)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--success)' }}>Global 2FA Multi-Factor Active</div>
                  <div style={{ fontSize: 12, color: 'var(--success)' }}>All logins require mandatory 6-digit OTP email verification for security compliance.</div>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={saving} style={{ borderRadius: 12, width: 'fit-content' }}>
                {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <><Key size={16} /> Update Security Password</>}
              </button>
            </form>
          </motion.div>
        )}

        {activeTab === 'cases' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {loadingCases ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 140, borderRadius: 16 }} />)}
              </div>
            ) : userCases.length === 0 ? (
              <div style={{ background: 'var(--surface)', padding: 40, borderRadius: 20, textAlign: 'center', border: '1px solid var(--border)', color: 'var(--text-faint)' }}>
                <FolderOpen size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                <p style={{ fontSize: 15, fontWeight: 600 }}>No cases assigned to your account</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                {userCases.map(c => (
                  <Link key={c._id} to={`/cases/${c._id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 18, boxShadow: '0 4px 16px var(--border)' }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{c.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.description}</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary)' }}>{c.status}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{new Date(c.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </>
  );
}
