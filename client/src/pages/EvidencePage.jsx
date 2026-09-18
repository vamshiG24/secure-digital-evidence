import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Search, FileText, Shield, Download, Hash, HardDrive, 
  User, Clock, CheckCircle, AlertTriangle, Play, Copy, ExternalLink,
  Layers, Eye, RefreshCw, Zap, Check, AlertOctagon, Filter
} from 'lucide-react';
import ForensicInspectorModal from '../components/ForensicInspectorModal';

export default function EvidencePage() {
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
    } catch (err) {
      toast.error('Failed to load evidence assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidence();
    if (searchParams.get('audit') === 'true') {
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
    } catch (err) {
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
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: 22, padding: '24px 28px', color: 'white', marginBottom: 24,
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 20,
        boxShadow: '0 20px 40px rgba(15,23,42,0.18)', border: '1px solid #334155'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: auditStats.tamperedCount === 0 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.2)',
            border: `1.5px solid ${auditStats.tamperedCount === 0 ? '#22c55e' : '#ef4444'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: auditStats.tamperedCount === 0 ? '#22c55e' : '#ef4444'
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
                background: auditStats.tamperedCount === 0 ? '#16a34a' : '#dc2626', color: 'white'
              }}>
                {auditStats.integrityScore}% INTACT
              </span>
            </div>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>
              Real-time SHA-256 validation across all seized digital forensics artifacts & chain of custody blocks.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ textAlign: 'right', marginRight: 10 }}>
            <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Total Vault Assets</div>
            <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Space Grotesk'" }}>
              {auditStats.totalScanned || evidence.length} Files
            </div>
          </div>
          <button
            onClick={handleBatchAudit}
            disabled={auditing}
            className="btn btn-primary"
            style={{
              padding: '10px 20px', borderRadius: 12, fontWeight: 700, fontSize: 13.5,
              background: 'linear-gradient(135deg, #1d4ed8, #06b6d4)', boxShadow: '0 4px 20px rgba(6,182,212,0.3)'
            }}>
            {auditing ? <RefreshCw size={16} className="animate-spin" /> : <Shield size={16} />}
            {auditing ? 'Running Full Vault Audit...' : 'Run Enterprise Integrity Audit'}
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{
        background: 'white', borderRadius: 18, border: '1px solid var(--border)',
        padding: '16px 20px', marginBottom: 22, display: 'flex', flexWrap: 'wrap',
        alignItems: 'center', justifyContent: 'space-between', gap: 14
      }}>
        {/* Search */}
        <form onSubmit={handleSearchSubmit} style={{ position: 'relative', flex: 1, minWidth: 280 }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
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
                  background: categoryFilter === cat ? '#1d4ed8' : 'transparent',
                  color: categoryFilter === cat ? 'white' : '#64748b'
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
              border: '1px solid var(--border)', background: 'white', color: '#334155'
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
        <div style={{ textAlign: 'center', padding: '70px 20px', background: 'white', borderRadius: 20, border: '1px solid var(--border)' }}>
          <FileText size={48} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>No evidence assets found</h3>
          <p style={{ fontSize: 13, color: '#64748b' }}>No assets matched your search filters in the vault.</p>
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
                whileHover={{ y: -4, boxShadow: '0 12px 36px rgba(29,78,216,0.12)' }}
                onClick={() => openInspector(ev)}
                style={{
                  background: 'white', borderRadius: 18, border: `1px solid ${verified === true ? 'rgba(34,197,94,0.3)' : verified === false ? 'rgba(239,68,68,0.4)' : 'var(--border)'}`,
                  overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow 0.2s, border-color 0.2s', position: 'relative'
                }}>

                {/* Status Indicator Bar */}
                <div style={{
                  height: 3,
                  background: verified === true ? 'linear-gradient(90deg,#16a34a,#22c55e)' :
                              verified === false ? 'linear-gradient(90deg,#dc2626,#ef4444)' :
                              'linear-gradient(90deg,#1d4ed8,#06b6d4)'
                }} />

                <div style={{ padding: '18px 20px' }}>
                  {/* Case Link Banner */}
                  {ev.caseId && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Link to={`/cases/${ev.caseId._id || ev.caseId}`} onClick={e => e.stopPropagation()}
                        style={{ textDecoration: 'none', fontSize: 10.5, fontWeight: 700, color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <ExternalLink size={10} /> Case: {ev.caseId.title || ev.caseTitle || 'Active Case'}
                      </Link>
                      <span style={{
                        fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase',
                        padding: '1px 6px', borderRadius: 4,
                        background: ev.classification === 'Top Secret' ? '#fef2f2' : '#eff6ff',
                        color: ev.classification === 'Top Secret' ? '#dc2626' : '#1d4ed8'
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
                      <div style={{ fontWeight: 700, fontSize: 13.5, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ev.fileName || 'Unnamed Asset'}
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <HardDrive size={10} />{formattedSize} KB
                        </span>
                        <span style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 3 }}>
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
                      <Hash size={11} color="#94a3b8" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: 9.5, fontFamily: 'monospace', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ev.fileHash}
                      </span>
                    </div>
                    <button onClick={(e) => handleCopyHash(ev.fileHash, ev.fileName, e)}
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b', padding: 2 }}
                      title="Copy SHA-256 checksum">
                      <Copy size={11} />
                    </button>
                  </div>

                  {/* Tamper / Verification Status Banner */}
                  {verified !== undefined && (
                    <div style={{
                      padding: '6px 10px', borderRadius: 8, marginBottom: 12,
                      display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700,
                      background: verified ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                      color: verified ? '#16a34a' : '#dc2626'
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
                    <button
                      onClick={(e) => handleSimulateTamper(ev, e)}
                      style={{
                        padding: '6px 8px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.25)',
                        background: 'rgba(239,68,68,0.05)', color: '#dc2626', cursor: 'pointer'
                      }}
                      title="Simulate Tampering (Demonstration)">
                      <Play size={11} />
                    </button>
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
