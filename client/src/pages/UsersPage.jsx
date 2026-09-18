import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Search, Users, ShieldCheck, UserCog, Trash2, Mail, Building2, BadgeCheck, Ban, AlertTriangle } from 'lucide-react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { SpotlightCard, Reveal, Badge, Avatar, Skeleton, EmptyState, Modal, ShimmerButton, spring } from '../components/ui';

const ROLE_TONE = { admin: 'danger', investigator: 'info', analyst: 'success' };
const STATUS_TONE = { active: 'success', suspended: 'warning', inactive: 'neutral' };
const ROLES = ['admin', 'investigator', 'analyst'];
const STATUSES = ['active', 'suspended', 'inactive'];

export default function UsersPage() {
  const { user: me } = useAuth();
  const isAdmin = me?.role === 'admin';
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

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
  useEffect(() => { fetchUsers(); }, []);

  const open = (u) => {
    setSelected(u);
    setForm({ role: u.role, status: u.status || 'active', name: u.name, department: u.department || '', badgeId: u.badgeId || '', bio: u.bio || '' });
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await API.put(`/api/users/${selected._id}`, form);
      setUsers(prev => prev.map(u => (u._id === data._id ? data : u)));
      toast.success(`Updated ${data.name}`);
      setSelected(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    const target = confirmDelete;
    try {
      await API.delete(`/api/users/${target._id}`);
      setUsers(prev => prev.filter(u => u._id !== target._id));
      toast.success(`Removed ${target.name}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setConfirmDelete(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter(u =>
      (roleFilter === 'All' || u.role === roleFilter) &&
      (!q || u.name.toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q) || (u.department || '').toLowerCase().includes(q))
    );
  }, [users, search, roleFilter]);

  const counts = useMemo(() => ROLES.reduce((acc, r) => ({ ...acc, [r]: users.filter(u => u.role === r).length }), {}), [users]);

  return (
    <Reveal each={0.05}>
      <Reveal.Item className="page-header">
        <div>
          <h1>User directory</h1>
          <p>{users.length} personnel · {counts.admin || 0} admins · {counts.investigator || 0} investigators · {counts.analyst || 0} analysts</p>
        </div>
        {isAdmin && <Badge variant="info"><ShieldCheck size={12} /> Admin controls enabled</Badge>}
      </Reveal.Item>

      <Reveal.Item style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
        <div className="input-wrapper input-icon" style={{ flex: '1 1 280px', maxWidth: 420 }}>
          <Search size={16} className="input-icon-el" aria-hidden="true" />
          <input className="input" placeholder="Search by name, email or department…" value={search} onChange={e => setSearch(e.target.value)} aria-label="Search users" />
        </div>
        <div role="tablist" aria-label="Filter by role" style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          {['All', ...ROLES].map(r => (
            <button key={r} role="tab" aria-selected={roleFilter === r} onClick={() => setRoleFilter(r)} className="btn btn-sm"
              style={{ position: 'relative', background: 'transparent', color: roleFilter === r ? 'var(--text-primary)' : 'var(--text-muted)', textTransform: 'capitalize', minHeight: 32 }}>
              {roleFilter === r && <motion.span layoutId="role-pill" transition={spring} style={{ position: 'absolute', inset: 0, borderRadius: 8, background: 'var(--surface)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }} />}
              <span style={{ position: 'relative' }}>{r}</span>
            </button>
          ))}
        </div>
      </Reveal.Item>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>{[0, 1, 2, 3, 4, 5].map(i => <Skeleton key={i} h={170} r={16} />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No matching personnel" description="Try a different search or role filter." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {filtered.map(u => (
            <Reveal.Item key={u._id}>
              <SpotlightCard className="card-hover" style={{ padding: 18, height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <Avatar name={u.name} src={u.avatarUrl} size={48} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}{u._id === me?._id && <span style={{ color: 'var(--text-faint)', fontWeight: 500 }}> (you)</span>}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                      <Badge variant={ROLE_TONE[u.role]}>{u.role}</Badge>
                      {u.status && <Badge variant={STATUS_TONE[u.status]}>{u.status}</Badge>}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gap: 6, fontSize: 13, color: 'var(--text-muted)' }}>
                  {u.email && <span style={{ display: 'flex', gap: 8, alignItems: 'center', minWidth: 0 }}><Mail size={14} aria-hidden="true" /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</span></span>}
                  <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Building2 size={14} aria-hidden="true" />{u.department || 'Cyber Forensics Unit'}</span>
                  {u.badgeId && <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}><BadgeCheck size={14} aria-hidden="true" /><span className="mono">{u.badgeId}</span></span>}
                </div>
                {isAdmin && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                    <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => open(u)}><UserCog size={14} /> Manage</button>
                    {u._id !== me?._id && (
                      <button className="btn btn-soft-danger btn-sm btn-icon" onClick={() => setConfirmDelete(u)} aria-label={`Delete ${u.name}`}><Trash2 size={14} /></button>
                    )}
                  </div>
                )}
              </SpotlightCard>
            </Reveal.Item>
          ))}
        </div>
      )}

      {/* Manage modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? `Manage ${selected.name}` : ''} icon={UserCog}
        footer={<>
          <button className="btn btn-ghost" onClick={() => setSelected(null)}>Cancel</button>
          <ShimmerButton size="md" form="manage-user-form" type="submit" loading={saving}>Save changes</ShimmerButton>
        </>}>
        {selected && (
          <form id="manage-user-form" onSubmit={save}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group">
                <label className="label" htmlFor="mu-role">Role</label>
                <select id="mu-role" className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} disabled={selected._id === me?._id}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                {selected._id === me?._id && <div className="helper">You cannot change your own role.</div>}
              </div>
              <div className="form-group">
                <label className="label" htmlFor="mu-status">Account status</label>
                <select id="mu-status" className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} disabled={selected._id === me?._id}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            {form.status === 'suspended' && (
              <div className="alert alert-warning" style={{ marginBottom: 14 }}><Ban size={16} style={{ color: 'var(--warning)', flexShrink: 0 }} /><span>Suspended users are signed out immediately and cannot log in until reactivated.</span></div>
            )}
            <div className="form-group">
              <label className="label" htmlFor="mu-name">Full name</label>
              <input id="mu-name" className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group">
                <label className="label" htmlFor="mu-dept">Department</label>
                <input id="mu-dept" className="input" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="label" htmlFor="mu-badge">Badge ID</label>
                <input id="mu-badge" className="input mono" value={form.badgeId} onChange={e => setForm({ ...form, badgeId: e.target.value })} />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="label" htmlFor="mu-bio">Bio</label>
              <textarea id="mu-bio" className="input" rows={2} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} />
            </div>
          </form>
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete user" icon={AlertTriangle} width={440}
        footer={<>
          <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={remove}><Trash2 size={15} /> Delete permanently</button>
        </>}>
        {confirmDelete && (
          <p style={{ fontSize: 14.5 }}>
            This removes <strong style={{ color: 'var(--text-primary)' }}>{confirmDelete.name}</strong> ({confirmDelete.email}) from the platform. Their audit-log entries are retained. This cannot be undone.
          </p>
        )}
      </Modal>

      <span className="sr-only" aria-live="polite">{saving ? 'Saving' : ''}</span>
    </Reveal>
  );
}
