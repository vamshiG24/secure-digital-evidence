import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { Bot, Send, Sparkles, FileText, Search, Shield, Loader2, Terminal, ExternalLink, X, Image as ImageIcon, Video as VideoIcon } from 'lucide-react';

/**
 * Custom Lightweight Markdown Renderer
 */
function FormattedMarkdown({ content }) {
  if (!content) return null;

  const lines = content.split('\n');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, lineHeight: 1.6 }}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} style={{ height: 4 }} />;

        // Headers
        if (trimmed.startsWith('### ')) {
          return <h4 key={idx} style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginTop: 8, marginBottom: 4 }}>{renderInline(trimmed.slice(4))}</h4>;
        }
        if (trimmed.startsWith('## ')) {
          return <h3 key={idx} style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginTop: 10, marginBottom: 6 }}>{renderInline(trimmed.slice(3))}</h3>;
        }
        if (trimmed.startsWith('# ')) {
          return <h2 key={idx} style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginTop: 12, marginBottom: 8 }}>{renderInline(trimmed.slice(2))}</h2>;
        }

        // Bullet Lists
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} style={{ display: 'flex', gap: 8, paddingLeft: 4 }}>
              <span style={{ color: 'var(--primary)', fontWeight: 700 }}>•</span>
              <span>{renderInline(trimmed.slice(2))}</span>
            </div>
          );
        }

        // Numbered list items
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={idx} style={{ display: 'flex', gap: 8, paddingLeft: 4, marginTop: 2 }}>
              <span style={{ color: 'var(--primary)', fontWeight: 700, minWidth: 20 }}>{numMatch[1]}.</span>
              <div>{renderInline(numMatch[2])}</div>
            </div>
          );
        }

        return <p key={idx} style={{ margin: 0 }}>{renderInline(trimmed)}</p>;
      })}
    </div>
  );
}

function renderInline(text) {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} style={{ background: 'var(--primary-soft)', color: 'var(--primary)', padding: '2px 6px', borderRadius: 6, fontFamily: 'monospace', fontSize: '0.88em', border: '1px solid var(--primary-soft)' }}>{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

export default function AiEvidenceAssistant({ caseId, caseTitle, evidenceCount }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    {
      sender: 'ai',
      text: `Hello! I am your **AI Forensic Assistant** for case *"${caseTitle}"*. I analyze all **${evidenceCount} evidence files** (Documents, 🖼️ Images, 🎬 Videos) using Multimodal RAG. Ask me anything or run automated forensic agents!`
    }
  ]);
  const [investigation, setInvestigation] = useState(null);
  const [investigating, setInvestigating] = useState(false);
  const [report, setReport] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'report' | 'investigation' | null

  const handleSendQuery = async (e) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    const userMsg = query.trim();
    setQuery('');
    setChatHistory(prev => [...prev, { sender: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const { data } = await API.post('/api/rag/query', { caseId, query: userMsg });
      setChatHistory(prev => [
        ...prev,
        {
          sender: 'ai',
          text: data.answer,
          citations: data.citations || []
        }
      ]);
    } catch {
      toast.error('AI RAG Query failed');
      setChatHistory(prev => [
        ...prev,
        { sender: 'ai', text: '⚠️ Unable to process query at this moment.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRunInvestigator = async () => {
    setInvestigating(true);
    try {
      const { data } = await API.get(`/api/rag/case/${caseId}/investigate`);
      setInvestigation(data);
      setActiveModal('investigation');
      toast.success('Forensic entity extraction completed');
    } catch {
      toast.error('Investigation agent failed');
    } finally {
      setInvestigating(false);
    }
  };

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      const { data } = await API.post(`/api/rag/case/${caseId}/report`);
      setReport(data.report);
      setActiveModal('report');
      toast.success('Forensic Report generated successfully');
    } catch {
      toast.error('Failed to generate report');
    } finally {
      setGeneratingReport(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 20, width: '100%', alignItems: 'start' }}>
      {/* Main RAG Chat Container */}
      <div style={{ 
        background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', 
        boxShadow: '0 8px 30px var(--border)', display: 'flex', flexDirection: 'column', 
        height: 650, overflow: 'hidden' 
      }}>
        {/* Header */}
        <div style={{ 
          padding: '16px 20px', borderBottom: '1px solid var(--border)', 
          background: 'linear-gradient(135deg, var(--primary-soft), var(--accent-soft))',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ 
              width: 40, height: 40, borderRadius: 12, 
              background: 'linear-gradient(135deg, var(--primary), var(--accent))', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
              boxShadow: '0 4px 14px var(--border-brand)' 
            }}>
              <Bot size={22} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>AI Evidence RAG Assistant</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Multimodal RAG & Forensic Synthesis Engine</div>
            </div>
          </div>
          <span style={{ 
            background: 'var(--success-soft)', color: 'var(--success)', border: '1px solid color-mix(in srgb, var(--success) 30%, transparent)',
            fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 99, display: 'flex', alignItems: 'center', gap: 5 
          }}>
            <Sparkles size={12} /> Active Gemini 2.5
          </span>
        </div>

        {/* Chat Message Thread */}
        <div style={{ 
          flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16,
          background: 'var(--surface-2)' 
        }}>
          {chatHistory.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              style={{
                display: 'flex', flexDirection: 'column',
                alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                width: '100%'
              }}>
              <div style={{
                maxWidth: msg.sender === 'user' ? '75%' : '90%', 
                padding: '14px 18px', borderRadius: 18, fontSize: 14,
                background: msg.sender === 'user' ? 'linear-gradient(135deg, var(--primary), var(--primary))' : 'white',
                color: msg.sender === 'user' ? 'white' : 'var(--text-primary)',
                border: msg.sender === 'ai' ? '1px solid var(--border-strong)' : 'none',
                boxShadow: msg.sender === 'user' ? '0 4px 14px var(--border-brand)' : '0 4px 20px var(--border)',
                boxSizing: 'border-box'
              }}>
                {msg.sender === 'user' ? (
                  <div style={{ whiteSpace: 'pre-wrap', fontWeight: 500 }}>{msg.text}</div>
                ) : (
                  <FormattedMarkdown content={msg.text} />
                )}

                {/* Retrieved Citations */}
                {msg.citations && msg.citations.length > 0 && (
                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--surface-2)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                      📑 Retrieved Evidence Sources:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {msg.citations.map((c, idx) => {
                        const isImg = c.fileName.match(/\.(png|jpg|jpeg|webp|gif|bmp)$/i);
                        const isVid = c.fileName.match(/\.(mp4|webm|mkv|mov|avi)$/i);
                        const IconComponent = isVid ? VideoIcon : isImg ? ImageIcon : FileText;
                        const label = isVid ? 'Video' : isImg ? 'Image' : 'Doc';

                        return (
                          <div key={idx} style={{ 
                            background: 'var(--surface-2)', padding: '8px 12px', borderRadius: 10, 
                            border: '1px solid var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            fontSize: 12 
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                              <IconComponent size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }}>
                                {c.fileName}
                              </span>
                              <span style={{ background: 'var(--primary-soft)', color: 'var(--primary)', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4 }}>
                                {label}
                              </span>
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--success)' }}>
                              {Math.round(c.score * 100)}% match
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--primary)', fontSize: 13, fontWeight: 600, background: 'var(--surface)', padding: '10px 16px', borderRadius: 14, border: '1px solid var(--border-strong)', width: 'fit-content' }}>
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> 
              Gemini AI analyzing evidence & synthesizing response...
            </motion.div>
          )}
        </div>

        {/* Quick Prompt Chips */}
        <div style={{
          padding: '8px 16px', background: 'var(--surface)', borderTop: '1px solid var(--border)',
          display: 'flex', gap: 6, overflowX: 'auto'
        }}>
          {[
            { label: '🔍 Extract All IOCs', query: 'Extract all Indicators of Compromise (IP addresses, SHA-256 hashes, Bitcoin/crypto wallets, CVEs, URLs) from the evidence.' },
            { label: '⚖️ Court Testimony Briefing', query: 'Synthesize a formal Courtroom Testimony Briefing summarizing key evidence and unbroken chain of custody.' },
            { label: '⏱️ Incident Chronology', query: 'Reconstruct the precise chronological sequence of events based on timestamps, files, and seized evidence.' },
            { label: '🛡️ Threat Attribution', query: 'Analyze potential threat actor attribution, tactics, techniques, and procedures (TTPs) visible in this evidence.' }
          ].map((chip, idx) => (
            <button key={idx}
              type="button"
              onClick={() => setQuery(chip.query)}
              style={{
                fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 99,
                background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)',
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary-light)'; e.currentTarget.style.color = 'var(--primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
              {chip.label}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSendQuery} style={{ padding: 14, background: 'var(--surface)', borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
          <input
            type="text"
            className="input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Ask AI about evidence, screenshots, logs, or suspect details..."
            style={{ flex: 1, borderRadius: 12, padding: '12px 16px', fontSize: 14 }}
          />
          <button type="submit" className="btn btn-primary" disabled={loading || !query.trim()} style={{ borderRadius: 12, padding: '12px 20px', fontWeight: 700 }}>
            <Send size={15} /> Ask RAG
          </button>
        </form>
      </div>

      {/* Action Sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Forensic Investigator Agent Card */}
        <div style={{ 
          background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', padding: 18,
          boxShadow: '0 8px 30px var(--border)' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Search size={18} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Investigator Agent</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Entity & Indicator Scan</div>
            </div>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 14 }}>
            Automatically extract IP addresses, emails, hashes, and suspect names from case files.
          </p>
          <button className="btn btn-outline" style={{ width: '100%', borderRadius: 10, justifyContent: 'center' }} onClick={handleRunInvestigator} disabled={investigating}>
            {investigating ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <><Sparkles size={14} /> Scan Evidence</>}
          </button>

          {investigation && (
            <button className="btn btn-sm" style={{ width: '100%', marginTop: 8, background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)', justifyContent: 'center' }} onClick={() => setActiveModal('investigation')}>
              <Terminal size={12} /> View Scan Results
            </button>
          )}
        </div>

        {/* Forensic Report Synthesizer Card */}
        <div style={{ 
          background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', padding: 18,
          boxShadow: '0 8px 30px var(--border)' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--success-soft)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={18} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Report Synthesizer</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Official Forensic Report</div>
            </div>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 14 }}>
            Compile an executive forensic report summarizing chain-of-custody and evidence checksums.
          </p>
          <button className="btn btn-primary" style={{ width: '100%', borderRadius: 10, justifyContent: 'center' }} onClick={handleGenerateReport} disabled={generatingReport}>
            {generatingReport ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <><Shield size={14} /> Compile AI Report</>}
          </button>

          {report && (
            <button className="btn btn-sm" style={{ width: '100%', marginTop: 8, background: 'var(--success-soft)', color: 'var(--success)', border: '1px solid color-mix(in srgb, var(--success) 30%, transparent)', justifyContent: 'center' }} onClick={() => setActiveModal('report')}>
              <ExternalLink size={12} /> View Full Report
            </button>
          )}
        </div>
      </div>

      {/* Results Preview Modal */}
      <AnimatePresence>
        {activeModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000,
            background: 'var(--overlay)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
          }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              style={{
                background: 'var(--surface)', borderRadius: 24, padding: 24, width: '100%', maxWidth: 680,
                maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px var(--overlay)'
              }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border-strong)' }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {activeModal === 'report' ? '🛡️ Generated Forensic Case Report' : '🕵️ Investigator Entity Scan Results'}
                </h3>
                <button onClick={() => setActiveModal(null)} style={{ border: 'none', background: 'var(--surface-2)', borderRadius: 8, padding: 6, cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', paddingRight: 6 }}>
                {activeModal === 'report' && (
                  <div style={{ background: 'var(--surface-2)', padding: 18, borderRadius: 14, border: '1px solid var(--border-strong)' }}>
                    <FormattedMarkdown content={report} />
                  </div>
                )}

                {activeModal === 'investigation' && investigation && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ background: 'var(--accent-soft)', border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)', padding: 14, borderRadius: 12 }}>
                      <div style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: 4 }}>💡 AI Executive Summary:</div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{investigation.aiSummary}</div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div style={{ background: 'var(--surface-2)', padding: 12, borderRadius: 12, border: '1px solid var(--border-strong)' }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 6 }}>🌐 IP Addresses ({investigation.detectedEntities.ipAddresses.length}):</div>
                        {investigation.detectedEntities.ipAddresses.map((ip, i) => (
                          <div key={i} style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--primary)' }}>{ip}</div>
                        )) || <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>None detected</span>}
                      </div>

                      <div style={{ background: 'var(--surface-2)', padding: 12, borderRadius: 12, border: '1px solid var(--border-strong)' }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 6 }}>📧 Emails ({investigation.detectedEntities.emails.length}):</div>
                        {investigation.detectedEntities.emails.map((em, i) => (
                          <div key={i} style={{ fontSize: 12, color: 'var(--primary)' }}>{em}</div>
                        )) || <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>None detected</span>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
