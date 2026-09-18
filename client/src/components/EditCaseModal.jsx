import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { FolderOpen, Save, Trash2, X, Loader2 } from 'lucide-react';

export default function EditCaseModal({ isOpen, onClose, caseItem, onCaseUpdated, onCaseDeleted, isAdmin }) {
  const [title, setTitle] = useState(caseItem?.title || '');
  const [description, setDescription] = useState(caseItem?.description || '');
  const [priority, setPriority] = useState(caseItem?.priority || 'medium');
  const [status, setStatus] = useState(caseItem?.status || 'open');
  const [assignedTo, setAssignedTo] = useState(caseItem?.assignedTo?._id || '');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (caseItem) {
      setTitle(caseItem.title || '');
      setDescription(caseItem.description || '');
      setPriority(caseItem.priority || 'medium');
      setStatus(caseItem.status || 'open');
      setAssignedTo(caseItem.assignedTo?._id || caseItem.assignedTo || '');
    }
  }, [caseItem]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await API.get('/api/users');
        setUsers(data);
      } catch {}
    };
    if (isOpen) fetchUsers();
  }, [isOpen]);

  if (!isOpen || !caseItem) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = { title, description, priority, status };
      if (assignedTo) payload.assignedTo = assignedTo;

      const { data } = await API.put(`/api/cases/${caseItem._id}`, payload);
      toast.success('Case updated successfully');
      if (onCaseUpdated) onCaseUpdated(data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update case');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete case "${caseItem.title}"? This action cannot be undone.`)) return;
    setDeleting(true);

    try {
      await API.delete(`/api/cases/${caseItem._id}`);
      toast.success('Case deleted successfully');
      if (onCaseDeleted) onCaseDeleted(caseItem._id);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete case');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1100,
        background: 'var(--overlay)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
      }}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          style={{
            background: 'var(--surface)', borderRadius: 24, padding: 24, width: '100%', maxWidth: 520,
            boxShadow: '0 25px 50px -12px var(--overlay)', border: '1px solid var(--border)'
          }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <FolderOpen size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Edit Case Details</h3>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Update status, priority, or assigned investigator</span>
              </div>
            </div>
            <button type="button" onClick={onClose} style={{ border: 'none', background: 'var(--surface-2)', borderRadius: 8, padding: 6, cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Case Title</label>
              <input
                type="text"
                className="input"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Description</label>
              <textarea
                className="input"
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Priority Level</label>
                <select className="input" value={priority} onChange={e => setPriority(e.target.value)}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Case Status</label>
                <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Closed">Closed</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Assign Investigator</label>
              <select className="input" value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
                <option value="">Unassigned</option>
                {users.filter(u => u.role === 'investigator' || u.role === 'admin').map(u => (
                  <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              {isAdmin && (
                <button type="button" className="btn" onClick={handleDelete} disabled={deleting}
                  style={{ background: 'var(--danger-soft)', color: 'var(--danger)', border: '1px solid color-mix(in srgb, var(--danger) 30%, transparent)' }}>
                  {deleting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={16} />}
                </button>
              )}
              <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <><Save size={15} /> Save Changes</>}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
