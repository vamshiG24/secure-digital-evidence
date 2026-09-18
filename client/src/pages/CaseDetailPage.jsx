import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import toast from 'react-hot-toast';
import io from 'socket.io-client';
import { ArrowLeft, Upload, Shield, AlertTriangle, Send, Loader2, User, Clock, Hash, HardDrive, Eye, MessageSquare, Play, Sparkles, Scale, Layers, X, Download } from 'lucide-react';
import AiEvidenceAssistant from '../components/AiEvidenceAssistant';
import EditCaseModal from '../components/EditCaseModal';
import ForensicInspectorModal from '../components/ForensicInspectorModal';
import CourtDossierModal from '../components/CourtDossierModal';

const API_URL = import.meta.env.VITE_API_URL || '';

function EvidenceCard({ ev, onVerify, onSimulate, onDownload, onInspect, index, canSimulate }) {
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(null);

  const handleVerify = async (e) => {
    e.stopPropagation();
    setVerifying(true);
    try {
      const result = await onVerify(ev._id);
      setVerified(result.verified);
    } finally {
      setVerifying(false);
    }
  };

  const fileIcon = ev.fileType?.includes('image') ? '🖼️' :
    ev.fileType?.includes('pdf') ? '📄' :
    ev.fileType?.includes('video') ? '🎬' : '📁';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      whileHover={{ y: -3, boxShadow: '0 12px 36px var(--primary-soft)' }}
      onClick={() => onInspect(ev)}
      style={{
        background: 'var(--surface)', borderRadius: 18, border: '1px solid var(--border)',
        padding: '16px', overflow: 'hidden', position: 'relative', cursor: 'pointer',
        transition: 'box-shadow 0.25s, border-color 0.25s',
        borderColor: verified === true ? 'color-mix(in srgb, var(--success) 30%, transparent)' :
          verified === false ? 'color-mix(in srgb, var(--danger) 30%, transparent)' : undefined,
      }}>
      {verified !== null && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: verified ? 'linear-gradient(90deg,var(--success),var(--success))' : 'linear-gradient(90deg,var(--danger),var(--danger))',
        }} />
      )}

      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: 'var(--surface)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22,
        }}>
          {fileIcon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 3 }}>
            {ev.fileName}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <HardDrive size={10} />{(ev.fileSize / 1024).toFixed(1)} KB
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <User size={10} />{ev.uploader?.name || 'Investigator'}
            </span>
          </div>
        </div>
      </div>

      {/* SHA-256 Monospace Hash Box */}
      <div style={{
        background: 'var(--surface)', borderRadius: 8, padding: '7px 9px',
        marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <Hash size={10} color="var(--text-muted)" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 9.5, fontFamily: 'monospace', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {ev.fileHash}
        </span>
      </div>

      {/* Custody Chain Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, fontSize: 11 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--primary)', fontWeight: 600 }}>
          <Layers size={11} /> {ev.chainOfCustody?.length || 1} Custody Blocks
        </span>
        <span style={{
          fontSize: 9.5, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
          background: ev.classification === 'Top Secret' ? 'var(--danger-soft)' : 'var(--primary-soft)',
          color: ev.classification === 'Top Secret' ? 'var(--danger)' : 'var(--primary)'
        }}>
          {ev.classification || 'Confidential'}
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          className="btn btn-outline btn-sm"
          onClick={(e) => { e.stopPropagation(); onInspect(ev); }}
          style={{ flex: 1, padding: '6px', fontSize: 11.5 }}>
          <Eye size={12} /> Inspect
        </button>
        <button
          className="btn btn-primary btn-sm"
          onClick={handleVerify}
          disabled={verifying}
          style={{ flex: 1, padding: '6px', fontSize: 11.5 }}>
          {verifying ? <Loader2 size={12} className="animate-spin" /> : <><Shield size={12} /> Verify</>}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDownload(ev._id); }}
          className="btn btn-outline btn-sm btn-icon"
          style={{ width: 32, minWidth: 32, height: 30, minHeight: 30 }}
          aria-label={`Download ${ev.fileName}`} title="Download original">
          <Download size={12} />
        </button>
        {canSimulate && (
          <button
            onClick={(e) => { e.stopPropagation(); onSimulate(ev._id); }}
            style={{
              padding: '6px 8px', border: '1px solid color-mix(in srgb, var(--danger) 30%, transparent)', borderRadius: 8,
              background: 'var(--danger-soft)', color: 'var(--danger)', cursor: 'pointer'
            }}
            aria-label="Simulate tampering (demo)" title="Simulate tampering (demo, admin only)">
            <Play size={10} />
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function CaseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [caseItem, setCaseItem] = useState(null);
  const [evidence, setEvidence] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('evidence'); // 'evidence' | 'timeline' | 'ai' | 'chat'
  
  // Modals
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editCaseOpen, setEditCaseOpen] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isDossierOpen, setIsDossierOpen] = useState(false);

  // Chat State
  const [msgText, setMsgText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchCaseData = async () => {
    try {
      const [caseRes, evRes, msgRes] = await Promise.all([
        API.get(`/api/cases/${id}`),
        API.get(`/api/evidence/${id}/list`),
        API.get(`/api/cases/${id}/messages`)
      ]);
      setCaseItem(caseRes.data);
      setEvidence(evRes.data);
      setMessages(msgRes.data);
    } catch {
      toast.error('Failed to load case data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeline = async () => {
    try {
      const { data } = await API.get(`/api/cases/${id}/timeline`);
      setTimeline(data.timeline || []);
    } catch {
      console.error('Failed to load timeline');
    }
  };

  useEffect(() => {
    fetchCaseData();
    fetchTimeline();

    const socket = io(API_URL || undefined, { withCredentials: true, transports: ['websocket', 'polling'] });
    socket.on('connect_error', (err) => { if (err.message === 'unauthorized') socket.disconnect(); });
    socket.emit('join_case_room', id);
    socket.on('new_message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => socket.disconnect();
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleVerify = async (evidenceId) => {
    try {
      const { data } = await API.get(`/api/evidence/${evidenceId}/verify`);
      toast[data.verified ? 'success' : 'error'](data.message);
      return data;
    } catch {
      toast.error('Verification failed');
      return { verified: false };
    }
  };

  const handleSimulate = async (evidenceId) => {
    try {
      await API.put(`/api/evidence/${evidenceId}/simulate-tamper`);
      toast.error('Tampering simulated! Stored hash corrupted.');
      fetchCaseData();
    } catch {
      toast.error('Simulation failed');
    }
  };

  const handleDownload = (evidenceId) => {
    window.open(`${API_URL}/api/evidence/${evidenceId}/download`, '_blank', 'noopener');
  };

  const handleInspect = (ev) => {
    setSelectedEvidence(ev);
    setIsInspectorOpen(true);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!msgText.trim() || sendingMsg) return;
    setSendingMsg(true);
    try {
      await API.post(`/api/cases/${id}/messages`, { message: msgText });
      setMsgText('');
    } catch {
      toast.error('Failed to send message');
    } finally {
      setSendingMsg(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20 }}>
        <div className="skeleton" style={{ height: 140, borderRadius: 20, marginBottom: 20 }} />
        <div className="skeleton" style={{ height: 400, borderRadius: 20 }} />
      </div>
    );
  }

  if (!caseItem) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <AlertTriangle size={48} color="var(--danger)" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Case not found</h2>
        <button onClick={() => navigate('/cases')} className="btn btn-primary" style={{ marginTop: 16 }}>
          Return to Cases
        </button>
      </div>
    );
  }

  const statusColors = { Open: 'var(--success)', 'In Progress': 'var(--primary)', Closed: 'var(--text-muted)', Suspended: 'var(--warning)' };
  const priorityColors = { Critical: 'var(--danger)', High: 'var(--warning)', Medium: 'var(--warning)', Low: 'var(--success)' };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>

      {/* Header Bar */}
      <div style={{
        background: 'var(--surface)', borderRadius: 22, border: '1px solid var(--border)',
        padding: '22px 28px', marginBottom: 20, boxShadow: '0 2px 10px var(--border)'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <button className="btn btn-ghost btn-icon" onClick={() => navigate('/cases')} style={{ marginTop: 2 }}>
              <ArrowLeft size={18} />
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                <span style={{
                  fontSize: 11, fontFamily: 'monospace', fontWeight: 800, color: 'var(--primary)',
                  padding: '3px 8px', borderRadius: 6, background: 'var(--primary-soft)', border: '1px solid var(--border-brand)'
                }}>
                  {caseItem.caseNumber || 'CASE-ACTIVE'}
                </span>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                  background: `${statusColors[caseItem.status]}15`, color: statusColors[caseItem.status]
                }}>
                  ● {caseItem.status}
                </span>
                <span style={{
                  fontSize: 11, fontWeight: 800, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 6,
                  background: `${priorityColors[caseItem.priority]}15`, color: priorityColors[caseItem.priority]
                }}>
                  {caseItem.priority}
                </span>
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', fontFamily: "'Space Grotesk'", margin: '0 0 6px' }}>
                {caseItem.title}
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0, maxWidth: 800 }}>
                {caseItem.description}
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => setIsDossierOpen(true)} className="btn btn-outline" style={{ padding: '8px 16px', fontWeight: 700 }}>
              <Scale size={15} color="var(--primary)" /> Court Dossier
            </button>

            {(user?.role === 'admin' || user?.role === 'investigator') && (
              <>
                <button onClick={() => setEditCaseOpen(true)} className="btn btn-outline" style={{ padding: '8px 16px' }}>
                  Edit Case
                </button>
                <button onClick={() => setUploadOpen(true)} className="btn btn-primary" style={{ padding: '8px 16px' }}>
                  <Upload size={15} /> Upload Evidence
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{
        display: 'flex', gap: 6, padding: '4px', background: 'var(--surface)',
        borderRadius: 14, border: '1px solid var(--border)', marginBottom: 20,
        overflowX: 'auto'
      }}>
        {[
          { id: 'evidence', label: `Evidence Vault (${evidence.length})`, icon: Shield },
          { id: 'timeline', label: `Forensic Chronology (${timeline.length})`, icon: Clock },
          { id: 'ai', label: 'AI Forensic Studio', icon: Sparkles },
          { id: 'chat', label: `Investigator Comms (${messages.length})`, icon: MessageSquare }
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                background: active ? 'var(--primary)' : 'transparent',
                color: active ? 'white' : 'var(--text-secondary)',
                boxShadow: active ? '0 4px 14px var(--border-brand)' : 'none'
              }}>
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: EVIDENCE VAULT */}
      {activeTab === 'evidence' && (
        <div>
          {evidence.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)' }}>
              <Shield size={44} color="var(--text-faint)" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>No evidence files in this case</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Upload digital forensics files to establish SHA-256 cryptographic chain of custody.</p>
              <button onClick={() => setUploadOpen(true)} className="btn btn-primary">
                <Upload size={15} /> Ingest First Evidence File
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {evidence.map((ev, index) => (
                <EvidenceCard
                  key={ev._id || index}
                  ev={ev}
                  index={index}
                  onVerify={handleVerify}
                  onSimulate={handleSimulate}
                  canSimulate={user?.role === 'admin' && import.meta.env.DEV}
                  onDownload={handleDownload}
                  onInspect={handleInspect}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FORENSIC CHRONOLOGY TIMELINE */}
      {activeTab === 'timeline' && (
        <div style={{ background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', padding: '28px 32px' }}>
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', margin: 0, fontFamily: "'Space Grotesk'" }}>
              Forensic Incident & Custody Chronology
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Automated event reconstruction compiling evidence seizures, cryptographic hashing, and custodian handoffs.
            </p>
          </div>

          <div style={{ position: 'relative', paddingLeft: 24, borderLeft: '2px solid var(--border-strong)', marginLeft: 10 }}>
            {timeline.map((evt, idx) => (
              <div key={evt.id || idx} style={{ marginBottom: 24, position: 'relative' }}>
                {/* Node point */}
                <span style={{
                  position: 'absolute', left: -31, top: 2, width: 12, height: 12,
                  borderRadius: '50%', background: evt.badgeColor || 'var(--primary)',
                  border: '3px solid white', boxShadow: '0 0 0 2px var(--border-strong)'
                }} />

                <div style={{
                  background: 'var(--surface)', padding: '14px 18px', borderRadius: 14,
                  border: '1px solid var(--border)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)' }}>
                      {evt.title}
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {new Date(evt.date).toLocaleString()}
                    </span>
                  </div>

                  <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: '0 0 6px', lineHeight: 1.5 }}>
                    {evt.description}
                  </p>

                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                    Actor: <strong>{evt.actor}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: AI FORENSIC ASSISTANT */}
      {activeTab === 'ai' && (
        <AiEvidenceAssistant
          caseId={caseItem._id}
          caseTitle={caseItem.title}
          evidenceCount={evidence.length}
        />
      )}

      {/* TAB 4: INVESTIGATOR COMMS & CHAT */}
      {activeTab === 'chat' && (
        <div style={{
          background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', height: 600, overflow: 'hidden'
        }}>
          <div style={{
            padding: '16px 20px', borderBottom: '1px solid var(--border)',
            background: 'var(--off-white)', display: 'flex', alignItems: 'center', gap: 10
          }}>
            <MessageSquare size={18} color="var(--primary)" />
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
              Investigator Secure Channel (Socket.io Encrypted)
            </span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-faint)', fontSize: 13 }}>
                No messages logged yet. Post investigative notes or observations.
              </div>
            ) : (
              messages.map((m, i) => {
                const isMe = m.sender?._id === user?._id;
                return (
                  <div key={m._id || i} style={{
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '75%'
                  }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2, textAlign: isMe ? 'right' : 'left' }}>
                      {m.sender?.name} ({m.sender?.role}) • {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{
                      padding: '10px 14px', borderRadius: 14, fontSize: 13, lineHeight: 1.5,
                      background: isMe ? 'var(--primary)' : 'var(--surface)',
                      color: isMe ? 'white' : 'var(--text-primary)',
                      border: isMe ? 'none' : '1px solid var(--border)'
                    }}>
                      {m.message}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} style={{
            padding: '12px 16px', borderTop: '1px solid var(--border)',
            display: 'flex', gap: 10, background: 'var(--surface)'
          }}>
            <input
              type="text"
              className="input"
              placeholder="Type case note or observation..."
              value={msgText}
              onChange={e => setMsgText(e.target.value)}
              style={{ flex: 1, borderRadius: 10 }}
            />
            <button type="submit" disabled={sendingMsg} className="btn btn-primary" style={{ padding: '0 20px' }}>
              <Send size={15} /> Send
            </button>
          </form>
        </div>
      )}

      {/* Upload Evidence Modal */}
      {uploadOpen && (
        <UploadEvidenceModal
          caseId={caseItem._id}
          open={uploadOpen}
          onClose={() => setUploadOpen(false)}
          onUploaded={() => { setUploadOpen(false); fetchCaseData(); fetchTimeline(); }}
        />
      )}

      {/* Edit Case Modal */}
      {editCaseOpen && (
        <EditCaseModal
          caseItem={caseItem}
          open={editCaseOpen}
          onClose={() => setEditCaseOpen(false)}
          onUpdated={(updated) => { setCaseItem(updated); setEditCaseOpen(false); fetchTimeline(); }}
        />
      )}

      {/* Forensic Deep Inspector Modal */}
      {selectedEvidence && (
        <ForensicInspectorModal
          evidence={selectedEvidence}
          isOpen={isInspectorOpen}
          onClose={() => setIsInspectorOpen(false)}
          onUpdated={() => { fetchCaseData(); fetchTimeline(); }}
        />
      )}

      {/* Courtroom Dossier Modal */}
      <CourtDossierModal
        caseId={caseItem._id}
        isOpen={isDossierOpen}
        onClose={() => setIsDossierOpen(false)}
      />

    </div>
  );
}

function UploadEvidenceModal({ caseId, open, onClose, onUploaded }) {
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState('');
  const [classification, setClassification] = useState('Confidential');
  const [tags, setTags] = useState('Digital Forensics, Primary Seizure');
  const [uploading, setUploading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select an evidence file');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('caseId', caseId);
      formData.append('description', description);
      formData.append('classification', classification);
      formData.append('tags', tags);

      await API.post('/api/evidence', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Evidence ingested & SHA-256 seal verified!');
      onUploaded();
    } catch {
      toast.error(err.response?.data?.message || 'Evidence upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'var(--overlay)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
    }}
    onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          width: '100%', maxWidth: 520, background: 'var(--surface)',
          borderRadius: 22, border: '1px solid var(--border)',
          boxShadow: '0 25px 60px -12px var(--overlay)', overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}>

        <div style={{
          padding: '18px 24px', borderBottom: '1px solid var(--border)',
          background: 'var(--off-white)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Shield size={20} color="var(--primary)" />
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0, fontFamily: "'Space Grotesk'" }}>
              Ingest & Cryptographically Seal Evidence
            </h3>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Select File (Documents, Images, Media, Binaries, PCAPs) *
            </label>
            <input
              type="file"
              required
              onChange={e => setFile(e.target.files[0])}
              style={{
                width: '100%', padding: '12px', border: '1px dashed var(--primary-light)',
                borderRadius: 12, background: 'var(--surface)', fontSize: 13
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Evidence Description & Seizure Notes
            </label>
            <textarea
              className="input"
              rows={2}
              placeholder="e.g. Memory dump extracted from suspect laptop at seizure location."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Security Classification
              </label>
              <select
                className="input"
                value={classification}
                onChange={e => setClassification(e.target.value)}>
                <option value="Top Secret">Top Secret</option>
                <option value="Secret">Secret</option>
                <option value="Confidential">Confidential</option>
                <option value="Unclassified">Unclassified</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Tags
              </label>
              <input
                type="text"
                className="input"
                value={tags}
                onChange={e => setTags(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
            <button type="submit" disabled={uploading} className="btn btn-primary" style={{ minWidth: 160 }}>
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <><Shield size={14} /> Calculate & Seal</>}
            </button>
          </div>
        </form>

      </motion.div>
    </div>
  );
}
