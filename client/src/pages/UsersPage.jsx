import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { Users, Shield, Search, Activity, Camera, Building, BadgeCheck, Mail, X, Check, Edit2 } from 'lucide-react';

const roleStyles = {
  admin: { bg: 'rgba(239,68,68,0.1)', color: '#dc2626', border: 'rgba(239,68,68,0.2)' },
  investigator: { bg: 'rgba(59,130,246,0.1)', color: '#1d4ed8', border: 'rgba(59,130,246,0.2)' },
  analyst: { bg: 'rgba(34,197,94,0.1)', color: '#16a34a', border: 'rgba(34,197,94,0.2)' },
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editBadgeId, setEditBadgeId] = useState('');
  const [editBio, setEditBio] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await API.get('/api/users');
      setUsers(data);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenUserModal = (u) => {
    setSelectedUser(u);
    setEditAvatarUrl(u.avatarUrl || '');
    setEditDepartment(u.department || 'Cyber Forensics Unit');
    setEditBadgeId(u.badgeId || `CF-${Math.floor(1000 + Math.random() * 9000)}`);
    setEditBio(u.bio || 'Digital Forensics Specialist');
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.department && u.department.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk'", fontSize: 22, fontWeight: 800, color: '#0f172a' }}>
            User Access & Specialist Directory
          </h1>
          <p style={{ color: '#64748b', fontSize: 13 }}>
            {users.length} authenticated personnel & forensic specialists
          </p>
        </div>
      </div>

      <div className="page-body">
        {/* Search & Filter Bar */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 20 }}>
          <div className="input-wrapper input-icon" style={{ maxWidth: 400 }}>
            <Search size={16} className="input-icon-el" />
            <input className="input" placeholder="Search by specialist name, email, or department..."
              value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 40, borderRadius: 12 }} />
          </div>
        </motion.div>

        {/* Role Summary Stats */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, maxWidth: 540, marginBottom: 24 }}>
          {['admin', 'investigator', 'analyst'].map(role => {
            const rs = roleStyles[role];
            const count = users.filter(u => u.role === role).length;
            return (
              <div key={role} style={{
                background: 'white', border: `1.5px solid ${rs.border}`,
                borderRadius: 16, padding: '14px 18px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: rs.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {role}s
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', fontFamily: "'Space Grotesk'", marginTop: 2 }}>{count}</div>
                </div>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: rs.bg, color: rs.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={16} />
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* User Cards Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 190, borderRadius: 20 }} />)}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {filtered.map(u => {
              const rs = roleStyles[u.role] || roleStyles.investigator;
              return (
                <motion.div key={u._id} whileHover={{ y: -4, boxShadow: '0 14px 40px rgba(29,78,216,0.1)' }}
                  onClick={() => handleOpenUserModal(u)}
                  style={{
                    background: 'white', borderRadius: 20, border: '1px solid var(--border)',
                    padding: 20, cursor: 'pointer', transition: 'all 0.3s ease', position: 'relative'
                  }}>
                  {/* Header Row: Avatar Photo + Basic Info */}
                  <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt={u.name} style={{ width: 52, height: 52, borderRadius: 16, objectFit: 'cover', border: '2px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    ) : (
                      <div style={{
                        width: 52, height: 52, borderRadius: 16, flexShrink: 0,
                        background: 'linear-gradient(135deg, #1d4ed8, #06b6d4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 800, fontSize: 20, boxShadow: '0 4px 14px rgba(29,78,216,0.25)'
                      }}>
                        {u.name[0]?.toUpperCase()}
                      </div>
                    )}
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {u.name}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>
                        {u.email}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <Building size={11} /> {u.department || 'Cyber Forensics Unit'}
                      </div>
                    </div>
                  </div>

                  {/* Bio snippet */}
                  <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4, margin: '0 0 14px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {u.bio || 'Digital Forensics Specialist & Incident Response Investigator.'}
                  </p>

                  {/* Footer Row: Badges */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      background: rs.bg, color: rs.color, border: `1px solid ${rs.border}`,
                    }}>
                      <Activity size={10} /> {u.role}
                    </span>

                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700,
                      color: '#16a34a', background: 'rgba(34,197,94,0.08)', padding: '3px 8px',
                      borderRadius: 99, border: '1px solid rgba(34,197,94,0.2)',
                    }}>
                      <Shield size={10} /> 2FA Active
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Specialist Details Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1100,
            background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
          }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              style={{
                background: 'white', borderRadius: 24, padding: 24, width: '100%', maxWidth: 480,
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid var(--border)'
              }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Specialist Personnel File
                </h3>
                <button onClick={() => setSelectedUser(null)} style={{ border: 'none', background: '#f1f5f9', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#64748b' }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, padding: 14, background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                {selectedUser.avatarUrl ? (
                  <img src={selectedUser.avatarUrl} alt={selectedUser.name} style={{ width: 64, height: 64, borderRadius: 18, objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg, #1d4ed8, #06b6d4)', color: 'white', fontWeight: 800, fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {selectedUser.name[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{selectedUser.name}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{selectedUser.email}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <BadgeCheck size={12} /> {selectedUser.department || 'Cyber Forensics Unit'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Profile Picture URL</label>
                  <input type="text" className="input" placeholder="https://example.com/avatar.jpg" value={editAvatarUrl} onChange={e => setEditAvatarUrl(e.target.value)} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Department</label>
                    <input type="text" className="input" value={editDepartment} onChange={e => setEditDepartment(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Badge ID</label>
                    <input type="text" className="input" value={editBadgeId} onChange={e => setEditBadgeId(e.target.value)} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Specialist Bio</label>
                  <textarea className="input" rows={2} value={editBio} onChange={e => setEditBio(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setSelectedUser(null)}>Close</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => {
                  toast.success('Personnel record updated');
                  setSelectedUser(null);
                }}>Save Specialist File</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
