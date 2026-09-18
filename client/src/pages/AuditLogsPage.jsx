import { useState, useEffect } from 'react';

import API from '../api/axios';
import toast from 'react-hot-toast';
import { ClipboardList, Search, Globe, Download, RefreshCw } from 'lucide-react';

const actionColorMap = {
  USER_LOGIN: { bg: 'var(--success-soft)', color: 'var(--success)', border: 'color-mix(in srgb, var(--success) 30%, transparent)' },
  USER_LOGOUT: { bg: 'var(--surface-3)', color: 'var(--text-muted)', border: 'var(--surface-3)' },
  USER_REGISTER: { bg: 'var(--primary-soft)', color: 'var(--primary)', border: 'var(--border-brand)' },
  MFA_CHALLENGE: { bg: 'var(--warning-soft)', color: 'var(--warning)', border: 'color-mix(in srgb, var(--warning) 30%, transparent)' },
  USER_UPDATE: { bg: 'var(--purple-soft)', color: 'var(--purple)', border: 'var(--purple-soft)' },
  'Create Case': { bg: 'var(--accent-soft)', color: 'var(--accent)', border: 'var(--accent-soft)' },
  'Update Case': { bg: 'var(--warning-soft)', color: 'var(--warning)', border: 'color-mix(in srgb, var(--warning) 30%, transparent)' },
  'Delete Case': { bg: 'var(--danger-soft)', color: 'var(--danger)', border: 'color-mix(in srgb, var(--danger) 30%, transparent)' },
  'Upload Evidence': { bg: 'var(--primary-soft)', color: 'var(--primary)', border: 'var(--primary-soft)' },
  'Verify Evidence Integrity': { bg: 'var(--success-soft)', color: 'var(--success)', border: 'var(--success-soft)' },
  'Simulate Evidence Tampering': { bg: 'var(--danger-soft)', color: 'var(--danger)', border: 'color-mix(in srgb, var(--danger) 30%, transparent)' },
  'Download Evidence': { bg: 'var(--accent-soft)', color: 'var(--accent)', border: 'var(--accent-soft)' },
  'Transfer Evidence Custody': { bg: 'var(--warning-soft)', color: '#b45309', border: 'color-mix(in srgb, var(--warning) 30%, transparent)' },
  'Batch Vault Integrity Audit': { bg: 'var(--success-soft)', color: 'var(--success)', border: 'color-mix(in srgb, var(--success) 30%, transparent)' }
};

const defaultColor = { bg: 'var(--surface-3)', color: 'var(--text-muted)', border: 'var(--surface-3)' };

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
        <div style={{ padding: '16px 20px', background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Total Audit Entries</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Space Grotesk'", marginTop: 4 }}>
            {stats.totalLogs || logs.length}
          </div>
          <div style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600, marginTop: 4 }}>
            Immutable Hash Log Active
          </div>
        </div>

        <div style={{ padding: '16px 20px', background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Tamper Incidents</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: stats.tamperAlerts > 0 ? 'var(--danger)' : 'var(--success)', fontFamily: "'Space Grotesk'", marginTop: 4 }}>
            {stats.tamperAlerts}
          </div>
          <div style={{ fontSize: 11, color: stats.tamperAlerts > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 600, marginTop: 4 }}>
            {stats.tamperAlerts > 0 ? '⚠️ Anomalies Detected' : '● Zero Tamper Anomalies'}
          </div>
        </div>

        <div style={{ padding: '16px 20px', background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Unique Remote IP Entities</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary)', fontFamily: "'Space Grotesk'", marginTop: 4 }}>
            {stats.uniqueIpsCount || 1}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginTop: 4 }}>
            Geographical Origin Tracked
          </div>
        </div>

        <div style={{ padding: '16px 20px', background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>24H Security Throughput</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Space Grotesk'", marginTop: 4 }}>
            {stats.recent24hCount || logs.length}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginTop: 4 }}>
            Compliance Standard ISO 27037
          </div>
        </div>
      </div>

      {/* Filter and Export Bar */}
      <div style={{
        background: 'var(--surface)', borderRadius: 18, border: '1px solid var(--border)',
        padding: '16px 20px', marginBottom: 20, display: 'flex', flexWrap: 'wrap',
        alignItems: 'center', justifyContent: 'space-between', gap: 14
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
          <Search size={16} color="var(--text-faint)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
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
              border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-secondary)'
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
      <div style={{ background: 'var(--surface)', borderRadius: 18, border: '1px solid var(--border)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--primary)' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading audit records...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <ClipboardList size={44} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
            <div style={{ fontWeight: 700 }}>No audit records match your query</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
                      background: index % 2 === 0 ? 'white' : 'var(--surface-2)'
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
                            background: 'linear-gradient(135deg,var(--primary),var(--accent))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontSize: 11, fontWeight: 700
                          }}>
                            {log.user.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{log.user.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{log.user.role}</div>
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontStyle: 'italic', color: 'var(--text-faint)' }}>System Daemon</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 20px', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Globe size={13} color="var(--text-faint)" />
                        {log.ipAddress || '127.0.0.1'}
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', maxWidth: 360, color: 'var(--text-secondary)', fontSize: 12.5 }}>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {log.details || '—'}
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: 11.5 }}>
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
