import React, { useState, Fragment } from 'react';
import { motion } from 'framer-motion';
import { Shield, ShieldOff, AlertTriangle, Eye, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
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
  const [deleting, setDeleting] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const votersPerPage = 10;
  const totalPages = Math.ceil((voters?.length || 0) / votersPerPage);
  const paginatedVoters = voters.slice((currentPage - 1) * votersPerPage, currentPage * votersPerPage);

  const handleDelete = async (e, id, name) => {
    e.stopPropagation();
    if (!window.confirm(`Are you absolutely sure you want to permanently delete voter: ${name}?`)) return;
    setDeleting(id);
    try {
      await api.delete(`/admin/voters/${id}`);
      toast.success(`Voter ${name} deleted successfully`);
      onRefresh?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete voter');
    } finally {
      setDeleting(null);
    }
  };

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
    <div className="w-full p-2">
      <div className="flex justify-between items-center mb-4 px-2">
        <span className="text-xs font-bold text-white/50 tracking-widest uppercase">
          Showing {Math.min((currentPage - 1) * votersPerPage + 1, voters.length || 0)} - {Math.min(currentPage * votersPerPage, voters.length || 0)} of {voters.length || 0} Registered Assets
        </span>
      </div>
      
      <div className="overflow-x-auto rounded-xl border border-white/5 bg-black/20 mb-4 shadow-xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
            {['Voter ID', 'Name', 'State', 'Fraud Score', 'Risk', 'Voted', 'Status', 'Actions'].map(h => (
              <th key={h} className="text-left py-3 px-4 text-white/50 font-semibold text-xs uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedVoters.map((voter, i) => {
            const risk = RISK_CONFIG[voter.riskLevel] || RISK_CONFIG.LOW;
            const isExpanded = expandedRow === voter.voterID;
            return (
              <React.Fragment key={voter._id || voter.voterID}>
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
                      <button
                        onClick={(e) => handleDelete(e, voter._id, voter.name)}
                        disabled={deleting === voter._id}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all bg-red-900/40 text-red-400 hover:bg-red-500/30 ml-2`}
                        title="Delete Voter">
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setExpandedRow(isExpanded ? null : voter.voterID); }}
                        className="text-white/40 hover:text-white transition-colors ml-2">
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
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-6 border-t border-white/5">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white/50 hover:bg-white/5 disabled:opacity-30 transition-all">
            PREV
          </button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              // Simple pagination logic to avoid rendering too many buttons if there are 100+ pages
              if (
                pageNum === 1 || 
                pageNum === totalPages || 
                (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)
              ) {
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`min-w-[32px] h-8 rounded-lg text-xs font-bold transition-all ${
                      currentPage === pageNum 
                        ? 'bg-ev-gold text-ev-navy shadow-[0_0_15px_rgba(212,175,55,0.3)]' 
                        : 'text-white/60 hover:bg-white/10 hover:text-white'
                    }`}>
                    {pageNum}
                  </button>
                );
              } else if (
                idx === 1 && currentPage > 4 || 
                idx === totalPages - 2 && currentPage < totalPages - 3
              ) {
                return <span key={pageNum} className="text-white/30 px-1">...</span>;
              }
              return null;
            })}
          </div>

          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white/50 hover:bg-white/5 disabled:opacity-30 transition-all">
            NEXT
          </button>
        </div>
      )}
    </div>
  );
}
