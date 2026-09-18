import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, FileText, Shield, Hash, HardDrive, User, CheckCircle, AlertTriangle, Play, Copy, ExternalLink, Eye, RefreshCw, AlertOctagon } from 'lucide-react';
import ForensicInspectorModal from '../components/ForensicInspectorModal';
import { useAuth } from '../context/AuthContext';

export default function EvidencePage() {
  const { user } = useAuth();
  const canAudit = user?.role === 'admin' || user?.role === 'analyst';
  const [searchParams] = useSearchParams();
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [classFilter, setClassFilter] = useState('All');
  const [verifying, setVerifying] = useState({});
  const [results, setResults] = useState({});
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  // Batch Audit State
  const [auditing, setAuditing] = useState(false);
  const [auditStats, setAuditStats] = useState({
    totalScanned: 0,
    intactCount: 0,
    tamperedCount: 0,
    integrityScore: 100
  });

  const fetchEvidence = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryFilter !== 'All') params.append('category', categoryFilter);
      if (classFilter !== 'All') params.append('classification', classFilter);

      const { data } = await API.get(`/api/evidence?${params.toString()}`);
      setEvidence(data);

      const intact = data.filter(d => results[d._id] !== false).length;
      setAuditStats({
        totalScanned: data.length,
        intactCount: intact,
        tamperedCount: data.length - intact,
        integrityScore: data.length ? Math.round((intact / data.length) * 100) : 100
      });
    } catch {
      toast.error('Failed to load evidence assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidence();
    if (searchParams.get('audit') === 'true' && canAudit) {
      setTimeout(() => handleBatchAudit(), 500);
    }
  }, [categoryFilter, classFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchEvidence();
  };

  const handleCopyHash = (hash, fileName, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    toast.success(`Copied SHA-256 for ${fileName}`);
  };

  const handleVerify = async (ev, e) => {
    if (e) e.stopPropagation();
    setVerifying(prev => ({ ...prev, [ev._id]: true }));
    try {
      const { data } = await API.get(`/api/evidence/${ev._id}/verify`);
      setResults(prev => ({ ...prev, [ev._id]: data.verified }));
      if (data.verified) {
        toast.success(`Verified intact: ${ev.fileName}`);
      } else {
        toast.error(`TAMPER DETECTED in: ${ev.fileName}!`);
      }
    } catch {
      toast.error('Verification failed');
    } finally {
      setVerifying(prev => ({ ...prev, [ev._id]: false }));
    }
  };

  const handleBatchAudit = async () => {
    setAuditing(true);
    try {
      const { data } = await API.post('/api/evidence/batch-verify');
      setAuditStats({
        totalScanned: data.totalScanned,
        intactCount: data.intactCount,
        tamperedCount: data.tamperedCount,
        integrityScore: data.integrityScore
      });

      const resultMap = {};
      data.results?.forEach(r => {
        resultMap[r.id] = r.verified;
      });
      setResults(resultMap);

      if (data.tamperedCount === 0) {
        toast.success(`Vault Audit Complete: 100% Intact (${data.totalScanned} files)`);
      } else {
        toast.error(`Vault Audit: ${data.tamperedCount} tampered assets detected!`);
      }
    } catch {
      toast.error('Batch verification error');
    } finally {
      setAuditing(false);
    }
  };

  const handleSimulateTamper = async (ev, e) => {
    if (e) e.stopPropagation();
    try {
      await API.put(`/api/evidence/${ev._id}/simulate-tamper`);
      toast.error(`Tampering simulated! Stored digest corrupted for: ${ev.fileName}`);
      setResults(prev => ({ ...prev, [ev._id]: false }));
      fetchEvidence();
    } catch {
      toast.error('Failed to simulate tampering');
    }
  };

  const openInspector = (ev) => {
    setSelectedEvidence(ev);
    setIsInspectorOpen(true);
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>

      {/* Enterprise Vault Health & Integrity Radar Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--text-primary) 100%)',
        borderRadius: 22, padding: '24px 28px', color: 'white', marginBottom: 24,
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 20,
        boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-strong)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: auditStats.tamperedCount === 0 ? 'var(--success-soft)' : 'color-mix(in srgb, var(--danger) 30%, transparent)',
            border: `1.5px solid ${auditStats.tamperedCount === 0 ? 'var(--success)' : 'var(--danger)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: auditStats.tamperedCount === 0 ? 'var(--success)' : 'var(--danger)'
          }}>
            {auditStats.tamperedCount === 0 ? <Shield size={30} /> : <AlertOctagon size={30} />}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ fontSize: 20, fontWeight: 900, fontFamily: "'Space Grotesk'", margin: 0 }}>
                Enterprise Evidence Vault Integrity Radar
              </h2>
              <span style={{
                fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 99,
                background: auditStats.tamperedCount === 0 ? 'var(--success)' : 'var(--danger)', color: 'white'
              }}>
                {auditStats.integrityScore}% INTACT
              </span>
            </div>
            <p style={{ color: 'var(--text-faint)', fontSize: 13, margin: '4px 0 0' }}>
              Real-time SHA-256 validation across all seized digital forensics artifacts & chain of custody blocks.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ textAlign: 'right', marginRight: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase', fontWeight: 700 }}>Total Vault Assets</div>
            <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Space Grotesk'" }}>
              {auditStats.totalScanned || evidence.length} Files
            </div>
          </div>
          <button
            onClick={handleBatchAudit}
            disabled={auditing || !canAudit}
            title={canAudit ? undefined : 'Only admins and analysts can run the vault audit'}
            className="btn btn-primary"
            style={{
              padding: '10px 20px', borderRadius: 12, fontWeight: 700, fontSize: 13.5,
              background: 'linear-gradient(135deg, var(--primary), var(--accent))', boxShadow: '0 4px 20px var(--accent-soft)'
            }}>
            {auditing ? <RefreshCw size={16} className="animate-spin" /> : <Shield size={16} />}
            {auditing ? 'Running Full Vault Audit...' : 'Run Enterprise Integrity Audit'}
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{
        background: 'var(--surface)', borderRadius: 18, border: '1px solid var(--border)',
        padding: '16px 20px', marginBottom: 22, display: 'flex', flexWrap: 'wrap',
        alignItems: 'center', justifyContent: 'space-between', gap: 14
      }}>
        {/* Search */}
        <form onSubmit={handleSearchSubmit} style={{ position: 'relative', flex: 1, minWidth: 280 }}>
          <Search size={16} color="var(--text-faint)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="input"
            placeholder="Search by file name, SHA-256 hash, or description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 40, height: 40, borderRadius: 12 }}
          />
        </form>

        {/* Categories */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--surface)', padding: 3, borderRadius: 10, border: '1px solid var(--border)' }}>
            {['All', 'Images', 'Documents', 'Media', 'Code/Logs'].map(cat => (
              <button key={cat}
                onClick={() => setCategoryFilter(cat)}
                style={{
                  border: 'none', padding: '6px 12px', borderRadius: 8, fontSize: 11.5, fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.15s',
                  background: categoryFilter === cat ? 'var(--primary)' : 'transparent',
                  color: categoryFilter === cat ? 'white' : 'var(--text-muted)'
                }}>
                {cat}
              </button>
            ))}
          </div>

          {/* Classification Filter */}
          <select
            value={classFilter}
            onChange={e => setClassFilter(e.target.value)}
            style={{
              padding: '6px 12px', height: 38, borderRadius: 10, fontSize: 12, fontWeight: 700,
              border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-secondary)'
            }}>
            <option value="All">All Classifications</option>
            <option value="Top Secret">Top Secret</option>
            <option value="Secret">Secret</option>
            <option value="Confidential">Confidential</option>
            <option value="Unclassified">Unclassified</option>
          </select>
        </div>
      </div>

      {/* Evidence Cards Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 220, borderRadius: 18 }} />)}
        </div>
      ) : evidence.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '70px 20px', background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)' }}>
          <FileText size={48} color="var(--text-faint)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>No evidence assets found</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No assets matched your search filters in the vault.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {evidence.map((ev, index) => {
            if (!ev || !ev._id) return null;
            const verified = results[ev._id];
            const fileIcon = ev.fileType?.includes('image') ? '🖼️' : ev.fileType?.includes('pdf') ? '📄' : ev.fileType?.includes('video') ? '🎬' : '📁';
            const formattedSize = ev.fileSize ? (ev.fileSize / 1024).toFixed(1) : '0';

            return (
              <motion.div key={ev._id || index}
                whileHover={{ y: -4, boxShadow: '0 12px 36px var(--primary-soft)' }}
                onClick={() => openInspector(ev)}
                style={{
                  background: 'var(--surface)', borderRadius: 18, border: `1px solid ${verified === true ? 'color-mix(in srgb, var(--success) 30%, transparent)' : verified === false ? 'color-mix(in srgb, var(--danger) 30%, transparent)' : 'var(--border)'}`,
                  overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow 0.2s, border-color 0.2s', position: 'relative'
                }}>

                {/* Status Indicator Bar */}
                <div style={{
                  height: 3,
                  background: verified === true ? 'linear-gradient(90deg,var(--success),var(--success))' :
                              verified === false ? 'linear-gradient(90deg,var(--danger),var(--danger))' :
                              'linear-gradient(90deg,var(--primary),var(--accent))'
                }} />

                <div style={{ padding: '18px 20px' }}>
                  {/* Case Link Banner */}
                  {ev.caseId && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Link to={`/cases/${ev.caseId._id || ev.caseId}`} onClick={e => e.stopPropagation()}
                        style={{ textDecoration: 'none', fontSize: 10.5, fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <ExternalLink size={10} /> Case: {ev.caseId.title || ev.caseTitle || 'Active Case'}
                      </Link>
                      <span style={{
                        fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase',
                        padding: '1px 6px', borderRadius: 4,
                        background: ev.classification === 'Top Secret' ? 'var(--danger-soft)' : 'var(--primary-soft)',
                        color: ev.classification === 'Top Secret' ? 'var(--danger)' : 'var(--primary)'
                      }}>
                        {ev.classification || 'Confidential'}
                      </span>
                    </div>
                  )}

                  {/* File Header */}
                  <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, background: 'var(--surface)',
                      border: '1px solid var(--border)', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 22, flexShrink: 0
                    }}>
                      {fileIcon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ev.fileName || 'Unnamed Asset'}
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <HardDrive size={10} />{formattedSize} KB
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <User size={10} />{ev.uploader?.name || 'Investigator'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* SHA-256 Digest Box */}
                  <div style={{
                    background: 'var(--surface)', borderRadius: 10, padding: '7px 10px',
                    marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                      <Hash size={11} color="var(--text-faint)" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: 9.5, fontFamily: 'monospace', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ev.fileHash}
                      </span>
                    </div>
                    <button onClick={(e) => handleCopyHash(ev.fileHash, ev.fileName, e)}
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}
                      title="Copy SHA-256 checksum">
                      <Copy size={11} />
                    </button>
                  </div>

                  {/* Tamper / Verification Status Banner */}
                  {verified !== undefined && (
                    <div style={{
                      padding: '6px 10px', borderRadius: 8, marginBottom: 12,
                      display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700,
                      background: verified ? 'var(--success-soft)' : 'var(--danger-soft)',
                      color: verified ? 'var(--success)' : 'var(--danger)'
                    }}>
                      {verified ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                      <span>{verified ? 'Cryptographically Sealed' : 'Tamper Detected!'}</span>
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={(e) => { e.stopPropagation(); openInspector(ev); }}
                      style={{ flex: 1, padding: '6px 10px', fontSize: 12 }}>
                      <Eye size={12} /> Inspect
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={(e) => handleVerify(ev, e)}
                      disabled={verifying[ev._id]}
                      style={{ flex: 1, padding: '6px 10px', fontSize: 12 }}>
                      {verifying[ev._id] ? <RefreshCw size={11} className="animate-spin" /> : <Shield size={12} />}
                      Verify
                    </button>
                    {user?.role === 'admin' && import.meta.env.DEV && (
                      <button
                        onClick={(e) => handleSimulateTamper(ev, e)}
                        style={{
                          padding: '6px 8px', borderRadius: 8, border: '1px solid color-mix(in srgb, var(--danger) 30%, transparent)',
                          background: 'var(--danger-soft)', color: 'var(--danger)', cursor: 'pointer'
                        }}
                        aria-label="Simulate tampering (demo)" title="Simulate tampering (demo, admin only)">
                        <Play size={11} />
                      </button>
                    )}
                  </div>

                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Forensic Deep Inspector Modal */}
      {selectedEvidence && (
        <ForensicInspectorModal
          evidence={selectedEvidence}
          isOpen={isInspectorOpen}
          onClose={() => setIsInspectorOpen(false)}
          onUpdated={() => fetchEvidence()}
        />
      )}

    </div>
  );
}
