import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Filter, Search, AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const SEVERITY_CONFIG = {
  INFO: { class: 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20', icon: Info },
  WARNING: { class: 'text-amber-400 bg-amber-500/10 border border-amber-500/20', icon: AlertTriangle },
  CRITICAL: { class: 'text-red-400 bg-red-500/10 border border-red-500/20', icon: ShieldAlert },
};

const ACTION_ICONS = {
  VOTER_REGISTERED: '📝', VOTER_LOGGED_IN: '🔐', VOTE_CAST: '🗳️',
  VOTE_VERIFIED: '✅', FRAUD_DETECTED: '🚨', VOTER_BLOCKED: '🔒',
  VOTER_UNBLOCKED: '🔓', ADMIN_LOGIN: '👑', FRAUD_CLEARED: '✔️',
  SYSTEM_SEED: '🌱', FAILED_LOGIN: '❌', SUSPICIOUS_ACCESS: '⚠️'
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [severity, setSeverity] = useState('');
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 25, ...(severity && { severity }) };
      const res = await api.get('/admin/audit', { params });
      setLogs(res.data.logs || []);
      setPagination(res.data.pagination || {});
    } catch (err) {
      // allow public view of audit log with limited info, or redirect to login
      toast.error('Please login as admin to view full audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [page, severity]);

  const filtered = search
    ? logs.filter(l => l.actor?.toLowerCase().includes(search.toLowerCase()) || l.description?.toLowerCase().includes(search.toLowerCase()))
    : logs;

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <FileText className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-black text-white">Audit Trail</h1>
          </div>
          <p className="text-white/50 text-sm">Transparent, immutable log of all system actions</p>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search by voter ID or action..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-9 text-sm"
            />
          </div>
          <select value={severity} onChange={e => { setSeverity(e.target.value); setPage(1); }}
            className="input-field text-sm w-auto"
            style={{ background: 'rgba(255,255,255,0.05)' }}>
            <option value="" className="bg-dark-800">All Severity</option>
            <option value="INFO" className="bg-dark-800">INFO</option>
            <option value="WARNING" className="bg-dark-800">WARNING</option>
            <option value="CRITICAL" className="bg-dark-800">CRITICAL</option>
          </select>
        </div>

        {/* Log list */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass-card p-4 h-20 shimmer" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((log, i) => {
              const sev = SEVERITY_CONFIG[log.severity] || SEVERITY_CONFIG.INFO;
              const SevIcon = sev.icon;
              return (
                <motion.div
                  key={log._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="glass-card p-4 hover:bg-white/10 transition-colors">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="text-xl flex-shrink-0 mt-0.5">
                        {ACTION_ICONS[log.action] || '📋'}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${sev.class}`}>
                            {log.severity}
                          </span>
                          <span className="text-xs font-mono text-white/60">{log.action?.replace(/_/g, ' ')}</span>
                        </div>
                        <p className="text-sm text-white">{log.description}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-white/30">
                          <span className="font-mono">Actor: {log.actor}</span>
                          {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-white/30 flex-shrink-0">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                </motion.div>
              );
            })}

            {filtered.length === 0 && (
              <div className="text-center py-16 text-white/30">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No audit logs found</p>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-xl text-sm font-medium text-white/70 hover:text-white disabled:opacity-30 transition-colors"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
              Prev
            </button>
            <span className="text-white/50 text-sm px-4">Page {page} of {pagination.pages}</span>
            <button
              onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              className="px-4 py-2 rounded-xl text-sm font-medium text-white/70 hover:text-white disabled:opacity-30 transition-colors"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
