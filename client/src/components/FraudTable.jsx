import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, ShieldOff, AlertTriangle, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const RISK_CONFIG = {
  HIGH: { label: 'HIGH', class: 'risk-high', bg: 'rgba(239,68,68,0.1)' },
  MEDIUM: { label: 'MEDIUM', class: 'risk-medium', bg: 'rgba(245,158,11,0.1)' },
  LOW: { label: 'LOW', class: 'risk-low', bg: 'rgba(16,185,129,0.1)' },
};

export default function FraudTable({ voters = [], onRefresh }) {
  const [expandedRow, setExpandedRow] = useState(null);
  const [blocking, setBlocking] = useState(null);

  const handleBlock = async (voterID, isBlocked) => {
    setBlocking(voterID);
    try {
      await api.post(`/fraud/block/${voterID}`, { reason: `${isBlocked ? 'Unblocked' : 'Blocked'} by admin` });
      toast.success(`Voter ${isBlocked ? 'unblocked' : 'blocked'} successfully`);
      onRefresh?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setBlocking(null);
    }
  };

  if (!voters.length) {
    return (
      <div className="text-center py-12 text-white/40">
        <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>No flagged voters detected</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            {['Voter ID', 'Name', 'State', 'Fraud Score', 'Risk', 'Voted', 'Status', 'Actions'].map(h => (
              <th key={h} className="text-left py-3 px-4 text-white/50 font-semibold text-xs uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {voters.map((voter, i) => {
            const risk = RISK_CONFIG[voter.riskLevel] || RISK_CONFIG.LOW;
            const isExpanded = expandedRow === voter.voterID;
            return (
              <>
                <motion.tr
                  key={voter.voterID}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => setExpandedRow(isExpanded ? null : voter.voterID)}
                  style={{ background: voter.isBlocked ? 'rgba(239,68,68,0.05)' : undefined }}>
                  <td className="py-3 px-4 font-mono text-xs text-primary-300">{voter.voterID}</td>
                  <td className="py-3 px-4 text-white font-medium">{voter.name}</td>
                  <td className="py-3 px-4 text-white/60">{voter.state}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${voter.fraudScore}%`, background: voter.fraudScore >= 60 ? '#ef4444' : voter.fraudScore >= 40 ? '#f59e0b' : '#10b981' }} />
                      </div>
                      <span className="font-mono font-bold text-white/80">{voter.fraudScore}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={risk.class}>{risk.label}</span>
                  </td>
                  <td className="py-3 px-4">
                    {voter.hasVoted
                      ? <span className="text-emerald-400 text-xs">✓ Voted</span>
                      : <span className="text-white/30 text-xs">Pending</span>}
                  </td>
                  <td className="py-3 px-4">
                    {voter.isBlocked
                      ? <span className="badge bg-red-500/20 text-red-400 border border-red-500/30">🔒 Blocked</span>
                      : <span className="badge bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">✓ Active</span>}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleBlock(voter.voterID, voter.isBlocked)}
                        disabled={blocking === voter.voterID}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${voter.isBlocked
                          ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                          : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}`}>
                        {voter.isBlocked ? <><ShieldOff className="w-3 h-3" />Unblock</> : <><Shield className="w-3 h-3" />Block</>}
                      </button>
                      <button onClick={() => setExpandedRow(isExpanded ? null : voter.voterID)}
                        className="text-white/40 hover:text-white transition-colors">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </motion.tr>
                {isExpanded && (
                  <tr key={`${voter.voterID}-expanded`}>
                    <td colSpan={8} className="px-4 py-3">
                      <div className="glass-card p-4 text-xs space-y-2">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-white/60">
                          <div><span className="text-white/40">Email:</span> <span className="text-white text-xs">{voter.email}</span></div>
                          <div><span className="text-white/40">Login Attempts:</span> <span className="text-amber-400 font-bold">{voter.loginAttempts}</span></div>
                          <div><span className="text-white/40">Registered IP:</span> <span className="font-mono text-primary-300">{voter.registeredIP || 'N/A'}</span></div>
                          <div><span className="text-white/40">Last Login:</span> <span className="text-white">{voter.lastLoginAt ? new Date(voter.lastLoginAt).toLocaleString() : 'Never'}</span></div>
                        </div>
                        {voter.voteReceiptHash && (
                          <div className="mt-2">
                            <span className="text-white/40">Receipt Hash: </span>
                            <span className="hash-text">{voter.voteReceiptHash}</span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
