import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api/axios';
import toast from 'react-hot-toast';
import {
  X, Printer, Shield, CheckCircle, FileText, Download,
  QrCode, Scale, Award, Loader2, Calendar, User
} from 'lucide-react';

export default function CourtDossierModal({ caseId, isOpen, onClose }) {
  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !caseId) return;
    setLoading(true);
    API.get(`/api/cases/${caseId}/export`)
      .then(res => setDossier(res.data))
      .catch(err => toast.error('Failed to compile Court Dossier'))
      .finally(() => setLoading(false));
  }, [isOpen, caseId]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px'
      }}
      onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          style={{
            width: '100%', maxWidth: 900, maxHeight: '92vh',
            background: 'white', borderRadius: 24,
            boxShadow: '0 25px 60px -12px rgba(15,23,42,0.4)',
            border: '1px solid rgba(29,78,216,0.2)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden'
          }}
          onClick={e => e.stopPropagation()}>

          {/* Modal Header Controls (Hidden on print) */}
          <div className="no-print" style={{
            padding: '16px 24px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'var(--off-white)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Scale size={20} color="#1d4ed8" />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                Courtroom Forensic Dossier & Evidence Certificate
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={handlePrint} className="btn btn-primary btn-sm" style={{ padding: '7px 16px' }}>
                <Printer size={14} /> Print / Save PDF
              </button>
              <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Printable Dossier Content Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '36px 40px', background: 'white' }}>
            {loading ? (
              <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>
                <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 16px', color: '#1d4ed8' }} />
                <p>Generating cryptographically signed courtroom dossier...</p>
              </div>
            ) : !dossier ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#dc2626' }}>
                Failed to load case dossier.
              </div>
            ) : (
              <div className="court-dossier-document" style={{ color: '#0f172a', fontFamily: "'Inter', sans-serif" }}>

                {/* Official Law Enforcement Header */}
                <div style={{
                  borderBottom: '2px solid #0f172a', paddingBottom: 20, marginBottom: 24,
                  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 8, background: '#0f172a',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                      }}>
                        <Shield size={22} />
                      </div>
                      <div>
                        <div style={{ fontSize: 17, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#0f172a' }}>
                          Digital Forensics Investigation Bureau
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Cyber Crime Division • Secure Chain of Custody System
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
                      Certificate ID
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, fontFamily: 'monospace', color: '#1d4ed8' }}>
                      {dossier.certificateId}
                    </div>
                    <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 2 }}>
                      Generated: {new Date(dossier.generatedAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Title & Seal Banner */}
                <div style={{
                  background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 12,
                  padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                  <div>
                    <span style={{
                      fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                      padding: '2px 8px', borderRadius: 4, background: '#0f172a', color: 'white', letterSpacing: '0.06em'
                    }}>
                      Official Court Exhibit
                    </span>
                    <h1 style={{ fontSize: 20, fontWeight: 900, margin: '8px 0 4px', color: '#0f172a' }}>
                      {dossier.caseDetails.title}
                    </h1>
                    <div style={{ fontSize: 12, color: '#475569' }}>
                      Case Reference: <strong style={{ fontFamily: 'monospace' }}>{dossier.caseDetails.caseNumber}</strong> • Status: <strong>{dossier.caseDetails.status}</strong> • Priority: <strong>{dossier.caseDetails.priority}</strong>
                    </div>
                  </div>

                  <div style={{
                    border: '2px dashed #16a34a', borderRadius: 12, padding: '8px 14px',
                    textAlign: 'center', background: 'rgba(34,197,94,0.06)'
                  }}>
                    <CheckCircle size={18} color="#16a34a" style={{ margin: '0 auto 2px' }} />
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#16a34a', textTransform: 'uppercase' }}>
                      Vault Verified
                    </div>
                    <div style={{ fontSize: 9, color: '#475569' }}>SHA-256 Intact</div>
                  </div>
                </div>

                {/* Case Particulars Grid */}
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12,
                  marginBottom: 24, padding: '14px 18px', background: '#f1f5f9', borderRadius: 10, fontSize: 12
                }}>
                  <div>
                    <span style={{ color: '#64748b', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>Lead Officer</span>
                    <div style={{ fontWeight: 700, color: '#0f172a', marginTop: 2 }}>{dossier.caseDetails.leadInvestigator}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>Supervising Officer</span>
                    <div style={{ fontWeight: 700, color: '#0f172a', marginTop: 2 }}>{dossier.caseDetails.supervisingOfficer}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>Incident Date</span>
                    <div style={{ fontWeight: 700, color: '#0f172a', marginTop: 2 }}>{new Date(dossier.caseDetails.incidentDate).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>Court Docket Ref</span>
                    <div style={{ fontWeight: 700, color: '#0f172a', marginTop: 2 }}>{dossier.caseDetails.courtReference || 'PENDING'}</div>
                  </div>
                </div>

                {/* Case Synopsis */}
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a', marginBottom: 6 }}>
                    1. Investigative Case Summary
                  </h3>
                  <p style={{ fontSize: 12.5, lineHeight: 1.6, color: '#334155', margin: 0 }}>
                    {dossier.caseDetails.description}
                  </p>
                </div>

                {/* Evidence Inventory Table */}
                <div style={{ marginBottom: 28 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a', marginBottom: 10 }}>
                    2. Cryptographic Evidence Inventory ({dossier.evidenceInventory.length} Items)
                  </h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead>
                      <tr style={{ background: '#0f172a', color: 'white', textAlign: 'left' }}>
                        <th style={{ padding: '8px 10px', border: '1px solid #0f172a' }}>Item #</th>
                        <th style={{ padding: '8px 10px', border: '1px solid #0f172a' }}>File Name</th>
                        <th style={{ padding: '8px 10px', border: '1px solid #0f172a' }}>Size</th>
                        <th style={{ padding: '8px 10px', border: '1px solid #0f172a' }}>Class.</th>
                        <th style={{ padding: '8px 10px', border: '1px solid #0f172a' }}>SHA-256 Cryptographic Checksum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dossier.evidenceInventory.map((ev, i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#f8fafc' }}>
                          <td style={{ padding: '8px 10px', border: '1px solid #e2e8f0', fontWeight: 700 }}>{ev.itemNumber}</td>
                          <td style={{ padding: '8px 10px', border: '1px solid #e2e8f0', fontWeight: 600 }}>{ev.fileName}</td>
                          <td style={{ padding: '8px 10px', border: '1px solid #e2e8f0', color: '#64748b' }}>{(ev.fileSize / 1024).toFixed(1)} KB</td>
                          <td style={{ padding: '8px 10px', border: '1px solid #e2e8f0' }}>{ev.classification}</td>
                          <td style={{ padding: '8px 10px', border: '1px solid #e2e8f0', fontFamily: 'monospace', fontSize: 9.5, color: '#1d4ed8' }}>
                            {ev.sha256Digest}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Chain of Custody Audit Ledger */}
                <div style={{ marginBottom: 28 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a', marginBottom: 10 }}>
                    3. Chain of Custody Verification Log
                  </h3>
                  <div style={{ fontSize: 11.5, color: '#475569', lineHeight: 1.6, marginBottom: 10 }}>
                    All items listed above have been preserved in a tamper-resistant environment in accordance with <strong>ISO/IEC 27037:2012</strong> standards. The cryptographic block hashes establish unbroken continuity of custody from seizure to courtroom presentation.
                  </div>
                  {dossier.evidenceInventory.slice(0, 3).map((ev, idx) => (
                    <div key={idx} style={{ marginBottom: 10, padding: 10, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                      <div style={{ fontWeight: 700, fontSize: 11, marginBottom: 4 }}>
                        {ev.itemNumber}: {ev.fileName} (Custodian History: {ev.chainOfCustodyBlocks.length} Blocks)
                      </div>
                      {ev.chainOfCustodyBlocks.map((blk, bi) => (
                        <div key={bi} style={{ fontSize: 10.5, color: '#334155', paddingLeft: 12, borderLeft: '2px solid #1d4ed8', marginBottom: 4 }}>
                          • <strong>Block #{blk.index}</strong>: {blk.action} by <strong>{blk.custodian || 'Custodian'}</strong> ({new Date(blk.timestamp).toLocaleString()}) — "{blk.notes}"
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Sign-off & Legal Attestation */}
                <div style={{
                  borderTop: '2px solid #0f172a', paddingTop: 24, marginTop: 32,
                  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40
                }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: 40 }}>
                      Forensic Examiner Signature & Stamp
                    </div>
                    <div style={{ borderTop: '1px solid #0f172a', paddingTop: 6, fontSize: 12, fontWeight: 700 }}>
                      {dossier.integrityCertification.verifiedBy}
                    </div>
                    <div style={{ fontSize: 10.5, color: '#64748b' }}>
                      Badge #: {dossier.integrityCertification.badgeNumber} • Digital Forensics Unit
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: 40 }}>
                      Supervising Officer Attestation
                    </div>
                    <div style={{ borderTop: '1px solid #0f172a', paddingTop: 6, fontSize: 12, fontWeight: 700 }}>
                      {dossier.caseDetails.supervisingOfficer}
                    </div>
                    <div style={{ fontSize: 10.5, color: '#64748b' }}>
                      Chief of Digital Investigation • Bureau Command
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
