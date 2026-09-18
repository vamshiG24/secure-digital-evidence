import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import API from '../api/axios';
import toast from 'react-hot-toast';
import AiEvidenceAssistant from '../components/AiEvidenceAssistant';
import { Sparkles, FolderOpen } from 'lucide-react';

export default function AiStudioPage() {
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [selectedCase, setSelectedCase] = useState(null);
  const [evidenceCount, setEvidenceCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const { data } = await API.get('/api/cases');
        setCases(data);
        if (data.length > 0) {
          setSelectedCaseId(data[0]._id);
          setSelectedCase(data[0]);
        }
      } catch {
        toast.error('Failed to load cases');
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, []);

  useEffect(() => {
    if (!selectedCaseId) return;
    const current = cases.find(c => c._id === selectedCaseId);
    setSelectedCase(current || null);

    API.get(`/api/evidence/${selectedCaseId}/list`)
      .then(res => setEvidenceCount(res.data.length))
      .catch(() => setEvidenceCount(0));
  }, [selectedCaseId, cases]);

  return (
    <>
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ 
              width: 42, height: 42, borderRadius: 12, 
              background: 'linear-gradient(135deg, var(--primary), var(--accent))', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
              boxShadow: '0 4px 16px var(--border-brand)' 
            }}>
              <Sparkles size={22} />
            </div>
            <div>
              <h1 style={{ fontFamily: "'Space Grotesk'", fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                AI Forensic Studio & Multimodal RAG
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
                Dedicated Generative AI Intelligence Suite for Evidence Analysis & Report Synthesis
              </p>
            </div>
          </div>
        </div>

        {/* Case Selector Dropdown */}
        {cases.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface)', padding: '8px 14px', borderRadius: 14, border: '1px solid var(--border)' }}>
            <FolderOpen size={16} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Active Case:</span>
            <select
              className="input"
              value={selectedCaseId}
              onChange={e => setSelectedCaseId(e.target.value)}
              style={{ width: 220, padding: '6px 12px', fontSize: 13, fontWeight: 600 }}
            >
              {cases.map(c => (
                <option key={c._id} value={c._id}>{c.title}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="page-body">
        {loading ? (
          <div className="skeleton" style={{ height: 600, borderRadius: 20 }} />
        ) : !selectedCase ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-faint)', background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)' }}>
            <FolderOpen size={56} style={{ opacity: 0.3, marginBottom: 16 }} />
            <p style={{ fontSize: 17, fontWeight: 600 }}>No cases available</p>
            <p style={{ fontSize: 13 }}>Create a case to start using the AI Forensic Studio.</p>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <AiEvidenceAssistant 
              caseId={selectedCase._id} 
              caseTitle={selectedCase.title} 
              evidenceCount={evidenceCount} 
            />
          </motion.div>
        )}
      </div>
    </>
  );
}
