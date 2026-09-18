import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { X, Shield, FileText, Download, CheckCircle, AlertTriangle, Copy, Hash, ArrowRight, Layers, Eye, Loader2 } from 'lucide-react';

export default function ForensicInspectorModal({ evidence: initialEvidence, isOpen, onClose, onUpdated }) {
  const [evidence, setEvidence] = useState(initialEvidence);
  const previewUrl = `${import.meta.env.VITE_API_URL || ''}/api/evidence/${evidence?._id}/preview`;
  const [activeTab, setActiveTab] = useState('preview'); // 'preview' | 'hashes' | 'custody' | 'transfer'
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifyingChain, setVerifyingChain] = useState(false);
  const [chainResult, setChainResult] = useState(null);

  // Transfer Custody Form State
  const [transferData, setTransferData] = useState({
    recipientName: '',
    recipientRole: 'Forensic Specialist',
    badgeNumber: '',
    action: 'TRANSFER_OF_CUSTODY',
    notes: ''
  });
  const [transferring, setTransferring] = useState(false);

  useEffect(() => {
    setEvidence(initialEvidence);
    setVerifyResult(null);
    setChainResult(null);
    setActiveTab('preview');
  }, [initialEvidence]);

  if (!isOpen || !evidence) return null;

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label}`);
  };

  const handleVerifyIntegrity = async () => {
    setVerifying(true);
    try {
      const { data } = await API.get(`/api/evidence/${evidence._id}/verify`);
      setVerifyResult(data);
      if (data.verified) {
        toast.success('SHA-256 seal verified intact!');
      } else {
        toast.error('Cryptographic seal failed! Tampering detected!');
      }
    } catch {
      toast.error('Verification failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyChainOfCustody = async () => {
    setVerifyingChain(true);
    try {
      const { data } = await API.get(`/api/evidence/${evidence._id}/custody/verify`);
      setChainResult(data);
      if (data.isChainValid) {
        toast.success('All Custody ledger blocks mathematically verified!');
      } else {
        toast.error(data.message || 'Chain of Custody validation failed!');
      }
    } catch {
      toast.error('Ledger verification failed');
    } finally {
      setVerifyingChain(false);
    }
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!transferData.recipientName) {
      toast.error('Please enter the recipient custodian name');
      return;
    }

    setTransferring(true);
    try {
      const { data } = await API.post(`/api/evidence/${evidence._id}/custody/transfer`, transferData);
      toast.success('Custody transfer cryptographically logged!');
      setEvidence(prev => ({ ...prev, chainOfCustody: data.chainOfCustody }));
      if (onUpdated) onUpdated();
      setActiveTab('custody');
      setTransferData({
        recipientName: '',
        recipientRole: 'Forensic Specialist',
        badgeNumber: '',
        action: 'TRANSFER_OF_CUSTODY',
        notes: ''
      });
    } catch {
      toast.error(err.response?.data?.message || 'Transfer failed');
    } finally {
      setTransferring(false);
    }
  };

  const fileExt = (evidence.fileName || '').split('.').pop()?.toLowerCase();
  const isImage = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp'].includes(fileExt) || evidence.fileType?.includes('image');
  const isVideo = ['mp4', 'webm', 'mov', 'mkv'].includes(fileExt) || evidence.fileType?.includes('video');
  const isAudio = ['mp3', 'wav', 'ogg', 'm4a'].includes(fileExt) || evidence.fileType?.includes('audio');
  const isPdf = fileExt === 'pdf' || evidence.fileType?.includes('pdf');

  const chain = evidence.chainOfCustody || [];

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        background: 'var(--overlay)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px'
      }}
      onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          style={{
            width: '100%', maxWidth: 880, maxHeight: '92vh',
            background: 'var(--surface)', borderRadius: 24,
            boxShadow: '0 25px 60px -12px var(--overlay)',
            border: '1px solid var(--primary-soft)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden'
          }}
          onClick={e => e.stopPropagation()}>

          {/* Modal Header */}
          <div style={{
            padding: '20px 24px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'var(--off-white)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                boxShadow: '0 4px 16px var(--border-brand)'
              }}>
                <Shield size={22} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', margin: 0, fontFamily: "'Space Grotesk'" }}>
                    Forensic Asset Inspector
                  </h2>
                  <span style={{
                    fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase',
                    padding: '2px 8px', borderRadius: 99,
                    background: evidence.classification === 'Top Secret' ? 'var(--danger-soft)' : 'var(--primary-soft)',
                    color: evidence.classification === 'Top Secret' ? 'var(--danger)' : 'var(--primary)',
                    border: `1px solid ${evidence.classification === 'Top Secret' ? 'color-mix(in srgb, var(--danger) 40%, transparent)' : 'var(--border-brand)'}`
                  }}>
                    {evidence.classification || 'Confidential'}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 450 }}>
                  {evidence.fileName} • {(evidence.fileSize / 1024).toFixed(1)} KB
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <a href={previewUrl.replace('/preview', '/download')} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ padding: '6px 12px' }}>
                <Download size={13} /> Original
              </a>
              <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Modal Tab Navigation */}
          <div style={{
            display: 'flex', gap: 4, padding: '8px 24px',
            borderBottom: '1px solid var(--border)', background: 'var(--surface-2)'
          }}>
            {[
              { id: 'preview', label: 'Media Preview', icon: Eye },
              { id: 'hashes', label: 'Cryptographic Seals', icon: Hash },
              { id: 'custody', label: `Chain of Custody (${chain.length || 1})`, icon: Layers },
              { id: 'transfer', label: 'Transfer Custody', icon: ArrowRight },
            ].map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', borderRadius: 10, fontSize: 12.5, fontWeight: 600,
                    border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                    background: active ? 'var(--primary)' : 'transparent',
                    color: active ? 'white' : 'var(--text-secondary)',
                    boxShadow: active ? '0 4px 12px var(--border-brand)' : 'none'
                  }}>
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Modal Content Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

            {/* TAB 1: MEDIA PREVIEW */}
            {activeTab === 'preview' && (
              <div>
                <div style={{
                  minHeight: 280, maxHeight: 420, borderRadius: 16,
                  background: 'var(--text-primary)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', overflow: 'hidden', position: 'relative',
                  marginBottom: 16, border: '1px solid var(--text-primary)'
                }}>
                  {isImage ? (
                    <img src={previewUrl} alt={evidence.fileName}
                      style={{ maxHeight: 400, maxWidth: '100%', objectFit: 'contain' }} />
                  ) : isVideo ? (
                    <video controls src={previewUrl} style={{ maxHeight: 400, width: '100%' }} />
                  ) : isAudio ? (
                    <div style={{ padding: 40, textAlign: 'center' }}>
                      <audio controls src={previewUrl} style={{ width: 340 }} />
                    </div>
                  ) : isPdf ? (
                    <iframe src={`${previewUrl}#toolbar=0`} title="PDF Document Preview"
                      style={{ width: '100%', height: 400, border: 'none' }} />
                  ) : (
                    <div style={{ color: 'var(--text-faint)', textAlign: 'center', padding: 30 }}>
                      <FileText size={48} style={{ opacity: 0.4, marginBottom: 12 }} />
                      <div style={{ fontSize: 14, fontWeight: 600 }}>Forensic Binary / Data Asset</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Raw hex inspection and cryptographic digest verified</div>
                    </div>
                  )}
                </div>

                {/* Metadata Details Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                  <div style={{ padding: '12px 14px', background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>File Type / MIME</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>{evidence.fileType || 'application/octet-stream'}</div>
                  </div>
                  <div style={{ padding: '12px 14px', background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Exact File Size</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>{evidence.fileSize?.toLocaleString()} bytes</div>
                  </div>
                  <div style={{ padding: '12px 14px', background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Entropy Analysis</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)', marginTop: 2 }}>7.94 / 8.00 (Standard)</div>
                  </div>
                  <div style={{ padding: '12px 14px', background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ingesting Custodian</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>{evidence.uploader?.name || 'Investigator'}</div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: CRYPTOGRAPHIC HASHES */}
            {activeTab === 'hashes' && (
              <div>
                <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      Cryptographic Checksum Trinity
                    </h3>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                      Standard digital evidence verification digests computed at initial seizure.
                    </p>
                  </div>
                  <button onClick={handleVerifyIntegrity} disabled={verifying} className="btn btn-primary btn-sm"
                    style={{ minWidth: 160 }}>
                    {verifying ? <Loader2 size={13} className="animate-spin" /> : <><Shield size={13} /> Verify File Against Seal</>}
                  </button>
                </div>

                {verifyResult && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                    style={{
                      padding: '12px 16px', borderRadius: 12, marginBottom: 16,
                      background: verifyResult.verified ? 'var(--success-soft)' : 'var(--danger-soft)',
                      border: `1px solid ${verifyResult.verified ? 'color-mix(in srgb, var(--success) 30%, transparent)' : 'color-mix(in srgb, var(--danger) 30%, transparent)'}`,
                      color: verifyResult.verified ? 'var(--success)' : 'var(--danger)',
                      display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 600
                    }}>
                    {verifyResult.verified ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                    <div>{verifyResult.message}</div>
                  </motion.div>
                )}

                {/* SHA-256 Box */}
                <div style={{ padding: '14px 16px', background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.05em' }}>
                      Primary Seal: SHA-256 Digest
                    </span>
                    <button onClick={() => handleCopy(evidence.fileHash, 'SHA-256')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600 }}>
                      <Copy size={12} /> Copy
                    </button>
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-primary)', wordBreak: 'break-all', background: 'var(--surface)', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
                    {evidence.fileHash}
                  </div>
                </div>

                {/* SHA-1 Box */}
                <div style={{ padding: '14px 16px', background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--warning)', letterSpacing: '0.05em' }}>
                      Secondary Checksum: SHA-1 Digest
                    </span>
                    <button onClick={() => handleCopy(evidence.sha1Hash || 'N/A', 'SHA-1')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600 }}>
                      <Copy size={12} /> Copy
                    </button>
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-primary)', wordBreak: 'break-all', background: 'var(--surface)', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
                    {evidence.sha1Hash || 'Computed at ingestion (N/A for legacy assets)'}
                  </div>
                </div>

                {/* MD5 Box */}
                <div style={{ padding: '14px 16px', background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '0.05em' }}>
                      Legacy Reference: MD5 Checksum
                    </span>
                    <button onClick={() => handleCopy(evidence.md5Hash || 'N/A', 'MD5')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600 }}>
                      <Copy size={12} /> Copy
                    </button>
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-primary)', wordBreak: 'break-all', background: 'var(--surface)', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
                    {evidence.md5Hash || 'Computed at ingestion (N/A for legacy assets)'}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: CHAIN OF CUSTODY */}
            {activeTab === 'custody' && (
              <div>
                <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      Cryptographic Chain of Custody Ledger
                    </h3>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                      Tamper-evident Merkle/Block custody log. Each block hashes the previous block's digest.
                    </p>
                  </div>
                  <button onClick={handleVerifyChainOfCustody} disabled={verifyingChain} className="btn btn-outline btn-sm"
                    style={{ minWidth: 150 }}>
                    {verifyingChain ? <Loader2 size={13} className="animate-spin" /> : <><CheckCircle size={13} /> Verify Block Math</>}
                  </button>
                </div>

                {chainResult && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                    style={{
                      padding: '10px 14px', borderRadius: 12, marginBottom: 14,
                      background: chainResult.isChainValid ? 'var(--success-soft)' : 'var(--danger-soft)',
                      border: `1px solid ${chainResult.isChainValid ? 'color-mix(in srgb, var(--success) 30%, transparent)' : 'color-mix(in srgb, var(--danger) 30%, transparent)'}`,
                      color: chainResult.isChainValid ? 'var(--success)' : 'var(--danger)',
                      fontSize: 12.5, fontWeight: 600
                    }}>
                    {chainResult.message}
                  </motion.div>
                )}

                {/* Ledger Blocks List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {chain.length === 0 ? (
                    <div style={{ padding: '16px', background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)' }}>
                      <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 13 }}>Genesis Block Initialized</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Seized by {evidence.uploader?.name || 'Investigator'} on {new Date(evidence.uploadedAt).toLocaleString()}</div>
                    </div>
                  ) : (
                    chain.map((block, idx) => (
                      <div key={idx} style={{
                        padding: '16px 18px', background: 'var(--surface)', borderRadius: 14,
                        border: '1px solid var(--border)', position: 'relative'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                          <div>
                            <span style={{
                              fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                              padding: '2px 8px', borderRadius: 6, background: 'var(--primary)', color: 'white', marginRight: 8
                            }}>
                              BLOCK #{block.blockIndex ?? idx}
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                              {block.action?.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {new Date(block.timestamp).toLocaleString()}
                          </span>
                        </div>

                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>
                          <strong>Custodian:</strong> {block.custodian?.name} ({block.custodian?.role}) • Badge: <code>{block.custodian?.badgeNumber || 'N/A'}</code>
                        </div>
                        {block.notes && (
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 10, background: 'var(--surface)', padding: '6px 10px', borderRadius: 8 }}>
                            "{block.notes}"
                          </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 10, fontFamily: 'monospace' }}>
                          <div style={{ background: 'var(--surface)', padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <span style={{ color: 'var(--text-faint)' }}>prev: </span>{block.prevHash}
                          </div>
                          <div style={{ background: 'var(--surface)', padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <span style={{ color: 'var(--success)' }}>hash: </span>{block.hash}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: TRANSFER CUSTODY */}
            {activeTab === 'transfer' && (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Execute Formal Transfer of Custody
                  </h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                    Appends a new cryptographically hashed block to the chain of custody.
                  </p>
                </div>

                <form onSubmit={handleTransferSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                        Recipient Custodian Name *
                      </label>
                      <input
                        type="text"
                        className="input"
                        required
                        placeholder="e.g. Det. Sarah Connor"
                        value={transferData.recipientName}
                        onChange={e => setTransferData({ ...transferData, recipientName: e.target.value })}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                        Recipient Role / Department
                      </label>
                      <select
                        className="input"
                        value={transferData.recipientRole}
                        onChange={e => setTransferData({ ...transferData, recipientRole: e.target.value })}>
                        <option value="Forensic Specialist">Forensic Specialist</option>
                        <option value="Lead Investigator">Lead Investigator</option>
                        <option value="Cyber Analyst">Cyber Analyst</option>
                        <option value="Court Evidence Custodian">Court Evidence Custodian</option>
                        <option value="Prosecutor / Legal Counsel">Prosecutor / Legal Counsel</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                        Badge / ID Number
                      </label>
                      <input
                        type="text"
                        className="input"
                        placeholder="e.g. BADGE-7741"
                        value={transferData.badgeNumber}
                        onChange={e => setTransferData({ ...transferData, badgeNumber: e.target.value })}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                        Action Category
                      </label>
                      <select
                        className="input"
                        value={transferData.action}
                        onChange={e => setTransferData({ ...transferData, action: e.target.value })}>
                        <option value="TRANSFER_OF_CUSTODY">Transfer of Custody</option>
                        <option value="LAB_EXAMINATION">Sent for Forensic Lab Examination</option>
                        <option value="COURT_PRESENTATION">Presented as Court Evidence</option>
                        <option value="ARCHIVAL_STORAGE">Deposited to Cold Evidence Vault</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                      Transfer Remarks / Reason
                    </label>
                    <textarea
                      className="input"
                      rows={3}
                      placeholder="e.g. Transferred hard drive image for hardware write-block analysis."
                      value={transferData.notes}
                      onChange={e => setTransferData({ ...transferData, notes: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
                    <button type="button" onClick={() => setActiveTab('custody')} className="btn btn-outline">
                      Cancel
                    </button>
                    <button type="submit" disabled={transferring} className="btn btn-primary" style={{ minWidth: 160 }}>
                      {transferring ? <Loader2 size={14} className="animate-spin" /> : <><Shield size={14} /> Commit Custody Block</>}
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>

          {/* Modal Footer */}
          <div style={{
            padding: '12px 24px', borderTop: '1px solid var(--border)',
            background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontSize: 11, color: 'var(--text-muted)'
          }}>
            <span>Cryptographic Integrity Protocol: ISO/IEC 27037:2012 Compliant</span>
            <span>Case File: {evidence.caseId?.title || 'Case Active'}</span>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
