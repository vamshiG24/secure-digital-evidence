import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { 
  ClipboardList, Search, Filter, Shield, User, Globe, 
  Monitor, Clock, Download, AlertOctagon, Activity, RefreshCw 
} from 'lucide-react';

const actionColorMap = {
  USER_LOGIN: { bg: 'rgba(34,197,94,0.1)', color: '#16a34a', border: 'rgba(34,197,94,0.2)' },
  USER_LOGOUT: { bg: 'rgba(100,116,139,0.08)', color: '#64748b', border: 'rgba(100,116,139,0.15)' },
  USER_REGISTER: { bg: 'rgba(59,130,246,0.1)', color: '#1d4ed8', border: 'rgba(59,130,246,0.2)' },
  MFA_CHALLENGE: { bg: 'rgba(234,179,8,0.1)', color: '#ca8a04', border: 'rgba(234,179,8,0.2)' },
  USER_UPDATE: { bg: 'rgba(124,58,237,0.1)', color: '#7c3aed', border: 'rgba(124,58,237,0.2)' },
  'Create Case': { bg: 'rgba(6,182,212,0.1)', color: '#0891b2', border: 'rgba(6,182,212,0.2)' },
  'Update Case': { bg: 'rgba(249,115,22,0.1)', color: '#ea580c', border: 'rgba(249,115,22,0.2)' },
  'Delete Case': { bg: 'rgba(239,68,68,0.1)', color: '#dc2626', border: 'rgba(239,68,68,0.2)' },
  'Upload Evidence': { bg: 'rgba(59,130,246,0.08)', color: '#1d4ed8', border: 'rgba(59,130,246,0.15)' },
  'Verify Evidence Integrity': { bg: 'rgba(34,197,94,0.08)', color: '#16a34a', border: 'rgba(34,197,94,0.15)' },
  'Simulate Evidence Tampering': { bg: 'rgba(239,68,68,0.1)', color: '#dc2626', border: 'rgba(239,68,68,0.2)' },
  'Download Evidence': { bg: 'rgba(6,182,212,0.08)', color: '#0891b2', border: 'rgba(6,182,212,0.15)' },
  'Transfer Evidence Custody': { bg: 'rgba(234,179,8,0.1)', color: '#b45309', border: 'rgba(234,179,8,0.25)' },
  'Batch Vault Integrity Audit': { bg: 'rgba(16,185,129,0.1)', color: '#059669', border: 'rgba(16,185,129,0.25)' }
};

const defaultColor = { bg: 'rgba(100,116,139,0.08)', color: '#64748b', border: 'rgba(100,116,139,0.15)' };

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('All');
  const [stats, setStats] = useState({ totalLogs: 0, tamperAlerts: 0, uniqueIpsCount: 0, recent24hCount: 0 });

  const fetchLogsAndStats = async () => {
    setLoading(true);
    try {
      const [logsRes, statsRes] = await Promise.all([
        API.get('/api/logs'),
        API.get('/api/logs/stats').catch(() => ({ data: null }))
      ]);
      setLogs(logsRes.data);
      if (statsRes.data) {
        setStats(statsRes.data);
      }
    } catch {
      toast.error('Failed to load compliance audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogsAndStats();
  }, []);

  const handleExport = (format) => {
    window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/logs/export?format=${format}`, '_blank');
  };

  const filteredLogs = logs.filter(l => {
    const matchSearch =
      (l.action && l.action.toLowerCase().includes(search.toLowerCase())) ||
      (l.details && l.details.toLowerCase().includes(search.toLowerCase())) ||
      (l.ipAddress && l.ipAddress.toLowerCase().includes(search.toLowerCase())) ||
      (l.user?.name && l.user.name.toLowerCase().includes(search.toLowerCase()));

    const matchAction = actionFilter === 'All' || l.action === actionFilter;

    return matchSearch && matchAction;
  });

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>

      {/* Telemetry Stats Bar */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14,
        marginBottom: 20
      }}>
        <div style={{ padding: '16px 20px', background: 'white', borderRadius: 16, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>Total Audit Entries</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', fontFamily: "'Space Grotesk'", marginTop: 4 }}>
            {stats.totalLogs || logs.length}
          </div>
          <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600, marginTop: 4 }}>
            Immutable Hash Log Active
          </div>
        </div>

        <div style={{ padding: '16px 20px', background: 'white', borderRadius: 16, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>Tamper Incidents</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: stats.tamperAlerts > 0 ? '#dc2626' : '#16a34a', fontFamily: "'Space Grotesk'", marginTop: 4 }}>
            {stats.tamperAlerts}
          </div>
          <div style={{ fontSize: 11, color: stats.tamperAlerts > 0 ? '#dc2626' : '#16a34a', fontWeight: 600, marginTop: 4 }}>
            {stats.tamperAlerts > 0 ? '⚠️ Anomalies Detected' : '● Zero Tamper Anomalies'}
          </div>
        </div>

        <div style={{ padding: '16px 20px', background: 'white', borderRadius: 16, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>Unique Remote IP Entities</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#1d4ed8', fontFamily: "'Space Grotesk'", marginTop: 4 }}>
            {stats.uniqueIpsCount || 1}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginTop: 4 }}>
            Geographical Origin Tracked
          </div>
        </div>

        <div style={{ padding: '16px 20px', background: 'white', borderRadius: 16, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>24H Security Throughput</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', fontFamily: "'Space Grotesk'", marginTop: 4 }}>
            {stats.recent24hCount || logs.length}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginTop: 4 }}>
            Compliance Standard ISO 27037
          </div>
        </div>
      </div>

      {/* Filter and Export Bar */}
      <div style={{
        background: 'white', borderRadius: 18, border: '1px solid var(--border)',
        padding: '16px 20px', marginBottom: 20, display: 'flex', flexWrap: 'wrap',
        alignItems: 'center', justifyContent: 'space-between', gap: 14
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="input"
            placeholder="Search audit trail by user, IP address, action, or remarks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 40, height: 40, borderRadius: 12 }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            style={{
              padding: '6px 14px', height: 40, borderRadius: 12, fontSize: 12.5, fontWeight: 700,
              border: '1px solid var(--border)', background: 'white', color: '#334155'
            }}>
            <option value="All">All Audit Operations</option>
            <option value="USER_LOGIN">User Logins</option>
            <option value="Upload Evidence">Evidence Ingestion</option>
            <option value="Verify Evidence Integrity">Integrity Verification</option>
            <option value="Simulate Evidence Tampering">Tamper Simulations</option>
            <option value="Create Case">Case Creation</option>
          </select>

          <button onClick={() => handleExport('csv')} className="btn btn-outline" style={{ height: 40, padding: '0 14px', fontWeight: 700 }}>
            <Download size={14} /> Export CSV
          </button>
          <button onClick={() => handleExport('json')} className="btn btn-outline" style={{ height: 40, padding: '0 14px', fontWeight: 700 }}>
            <Download size={14} /> Export JSON
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div style={{ background: 'white', borderRadius: 18, border: '1px solid var(--border)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px', color: '#1d4ed8' }} />
            <p style={{ color: '#64748b', fontSize: 13 }}>Loading audit records...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
            <ClipboardList size={44} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
            <div style={{ fontWeight: 700 }}>No audit records match your query</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)', color: '#475569', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '14px 20px' }}>Action Category</th>
                <th style={{ padding: '14px 20px' }}>Authenticated Entity</th>
                <th style={{ padding: '14px 20px' }}>IP / Network</th>
                <th style={{ padding: '14px 20px' }}>Details & Payload</th>
                <th style={{ padding: '14px 20px' }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, index) => {
                const ac = actionColorMap[log.action] || defaultColor;
                return (
                  <tr key={log._id || index}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      background: index % 2 === 0 ? 'white' : '#fafbfc'
                    }}>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center',
                        padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.04em',
                        background: ac.bg, color: ac.color, border: `1px solid ${ac.border}`
                      }}>
                        {log.action?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      {log.user ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: 8,
                            background: 'linear-gradient(135deg,#1d4ed8,#06b6d4)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontSize: 11, fontWeight: 700
                          }}>
                            {log.user.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 13 }}>{log.user.name}</div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>{log.user.role}</div>
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>System Daemon</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 20px', fontFamily: 'monospace', fontSize: 12, color: '#475569' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Globe size={13} color="#94a3b8" />
                        {log.ipAddress || '127.0.0.1'}
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', maxWidth: 360, color: '#334155', fontSize: 12.5 }}>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {log.details || '—'}
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', color: '#64748b', fontSize: 11.5 }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
