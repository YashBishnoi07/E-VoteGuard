import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Vote, CheckCircle, Copy, Shield, Clock, Zap, Landmark, Award, User, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import VoterIDCard from '../components/VoterIDCard';
import ElectionParticles from '../components/ElectionParticles';

const CANDIDATES = [
  { id: 1, name: 'Arjun Sharma', party: 'Progressive Alliance', color: '#FF6B00', symbol: '🌟', ideology: 'Innovation & Growth' },
  { id: 2, name: 'Priya Menon', party: "People's Front", color: '#00A86B', symbol: '🌿', ideology: 'Sustainability First' },
  { id: 3, name: 'Ravi Kumar', party: 'Unity Party', color: '#D4AF37', symbol: '🔥', ideology: 'National Integrity' },
  { id: 4, name: 'Sneha Patel', party: 'Reform Coalition', color: '#3B82F6', symbol: '💎', ideology: 'Digital Literacy' },
];

function fireConfetti() {
  const count = 200;
  const defaults = { origin: { y: 0.7 }, zIndex: 9999 };
  function fire(particleRatio, opts) {
    confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio) });
  }
  fire(0.25, { spread: 26, startVelocity: 55, colors: ['#FF6B00', '#D4AF37', '#00A86B'] });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, colors: ['#00A86B', '#3B82F6'] });
}

export default function VotingPage() {
  const { user, isAuthenticated, updateUser } = useAuth();
  const [selected, setSelected] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [voteResult, setVoteResult] = useState(null);
  const [showIdCard, setShowIdCard] = useState(false);
  const [startTime] = useState(Date.now());

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;

  const handleVote = async () => {
    if (!selected) return;
    setLoading(true);
    const votingTimeSec = (Date.now() - startTime) / 1000;

    try {
      const res = await api.post('/vote/cast', {
        candidateId: selected,
        votingTimeSec: votingTimeSec
      });

      setVoteResult(res.data);
      updateUser({ ...user, hasVoted: true, voteReceiptHash: res.data.receiptHash });
      setConfirming(false);
      fireConfetti();
      toast.success('Vote Recorded in Blockchain Ledger');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Vote Command Rejected');
      setConfirming(false);
    } finally {
      setLoading(false);
    }
  };

  if (user?.hasVoted && !voteResult) {
    return (
      <div className="min-h-screen bg-ev-navy flex flex-col items-center justify-center p-6 pt-24">
        <ElectionParticles />
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="ev-card p-10 max-w-2xl w-full text-center relative z-10">
          <div className="w-20 h-20 rounded-full bg-ev-green/10 flex items-center justify-center border border-ev-green/30 mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-ev-green" />
          </div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter shimmer-saffron">Vote Confirmed</h2>
          <p className="text-ev-text-secondary text-sm font-medium mb-10 max-w-md mx-auto italic">"Every ballot is a building block of our democracy. Yours has been cryptographically secured."</p>
          
          <div className="space-y-6">
            <div className="ev-card p-6 bg-ev-navy-800 text-left border-l-4 border-ev-gold">
              <p className="text-[10px] font-black text-ev-gold uppercase tracking-[0.2em] mb-2">Immutable Receipt Hash</p>
              <p className="hash-text text-white font-mono break-all text-xs">{user.voteReceiptHash}</p>
            </div>
            
            <VoterIDCard voter={user} />
          </div>
        </motion.div>
      </div>
    );
  }

  if (voteResult) {
    return (
      <div className="min-h-screen bg-ev-navy flex items-center justify-center p-6 pt-24">
        <ElectionParticles />
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="ev-card seal-border p-10 max-w-2xl w-full text-center relative z-10">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-ev-green/20 flex items-center justify-center mb-6">
              <Award className="w-10 h-10 text-ev-green" />
            </div>
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Vote Finalized</h2>
            <p className="text-ev-text-secondary uppercase tracking-widest text-[10px] font-black mt-2">Status: Ledger Entry Verified ✓</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="ev-card bg-ev-navy-800 p-4 border-b-2 border-ev-saffron">
              <p className="text-[8px] font-black text-ev-text-muted uppercase tracking-[0.2em] mb-1">Fraud Score</p>
              <p className="text-2xl font-black text-white">{voteResult.fraudScore}</p>
            </div>
            <div className="ev-card bg-ev-navy-800 p-4 border-b-2 border-ev-green">
              <p className="text-[8px] font-black text-ev-text-muted uppercase tracking-[0.2em] mb-1">Risk Level</p>
              <p className="text-2xl font-black text-ev-green capitalize">{voteResult.riskLevel}</p>
            </div>
            <div className="ev-card bg-ev-navy-800 p-4 border-b-2 border-ev-gold">
              <p className="text-[8px] font-black text-ev-text-muted uppercase tracking-[0.2em] mb-1">Latency</p>
              <p className="text-2xl font-black text-white">{voteResult.processingTimeMs || 12}ms</p>
            </div>
          </div>

          <div className="ev-card p-6 mb-8 text-left border border-ev-green/20">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={16} className="text-ev-green" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">SHA-256 Block Proof</span>
            </div>
            <p className="hash-text text-ev-text-secondary text-[10px] font-mono leading-none">{voteResult.receiptHash}</p>
          </div>

          <VoterIDCard voter={user} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ev-navy p-6 pt-28 max-w-7xl mx-auto">
      <ElectionParticles />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 relative z-10">
        
        {/* Left Side: Instructions & Profile Preview */}
        <div className="space-y-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="ev-card p-8 border-l-4 border-ev-saffron">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-ev-saffron/10 border border-ev-saffron/30 rounded-full text-[10px] text-ev-saffron font-bold uppercase tracking-widest mb-6">
              <Clock size={12} />
              Session Time Active
            </div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-4 shimmer-saffron">Cast Ballot</h1>
            <p className="text-ev-text-secondary text-sm leading-relaxed mb-6">
              Electoral security protocols require all votes to be cast within initialized session parameters. Selection is cryptographically anonymous.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded bg-ev-navy-800 flex items-center justify-center text-ev-gold font-black italic">!</div>
                <p className="text-[10px] text-ev-text-muted font-bold uppercase">Actions recorded by Greedy Assessment Engine</p>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="ev-card p-8">
            <h3 className="text-[10px] font-black text-ev-text-muted uppercase tracking-[0.2em] mb-6">Voter Credentials</h3>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-full bg-ev-gold/10 border border-ev-gold/30 flex items-center justify-center text-ev-gold">
                <User size={28} />
              </div>
              <div>
                <h4 className="text-white font-bold text-lg leading-none mb-1">{user?.name}</h4>
                <p className="text-ev-text-muted font-mono text-[10px] uppercase tracking-widest">{user?.voterID}</p>
              </div>
            </div>
            <button onClick={() => setShowIdCard(!showIdCard)} className="ev-btn-outline w-full py-2 text-[10px]">
              {showIdCard ? 'Hide Identity' : 'Preview Digital Voter ID'}
            </button>
            <AnimatePresence>
              {showIdCard && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-8 transform scale-[0.6] origin-top -mb-16">
                  <VoterIDCard voter={user} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Right Side: Candidate Selection */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CANDIDATES.map((candidate, i) => (
              <motion.div
                key={candidate.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
                onClick={() => setSelected(candidate.id)}
                className={`ev-card p-8 cursor-pointer transition-all duration-300 relative overflow-hidden group ${selected === candidate.id ? 'seal-border border-ev-gold ring-4 ring-ev-gold/10' : 'hover:border-ev-surface-border'}`}
                style={{ 
                  background: selected === candidate.id ? `${candidate.color}10` : 'transparent',
                }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-tr from-transparent opacity-5 rounded-bl-full group-hover:opacity-10 transition-opacity" style={{ backgroundColor: candidate.color }} />
                
                <div className="flex items-center gap-5 relative z-10">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl transition-transform group-hover:scale-110"
                    style={{ background: `${candidate.color}15`, border: `1px solid ${candidate.color}30` }}>
                    {candidate.symbol}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1" style={{ color: candidate.color }}>{candidate.party}</p>
                    <h3 className="text-xl font-black text-white leading-tight uppercase tracking-tighter">{candidate.name}</h3>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-between items-end relative z-10">
                  <div className="text-[10px] text-ev-text-muted font-bold uppercase tracking-widest border-l border-ev-surface-border pl-3">
                    Ideology:<br/><span className="text-white">{candidate.ideology}</span>
                  </div>
                  {selected === candidate.id && (
                    <div className="px-3 py-1 bg-ev-gold text-ev-navy text-[8px] font-black uppercase rounded shadow-[0_0_10px_rgba(212,175,55,0.5)]">
                      Selection Active
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 flex justify-center h-20">
            <AnimatePresence>
              {selected && (
                <motion.button
                  key="cast-btn"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  onClick={() => setConfirming(true)}
                  className="ev-btn-primary px-16 py-6 text-lg flex items-center gap-4 bg-gradient-to-r from-ev-saffron to-ev-gold font-black uppercase tracking-tighter"
                >
                  <Vote size={24} />
                  Securely Cast Ballot
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirming && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-ev-navy/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="ev-card seal-border p-10 max-w-md w-full text-center relative overflow-hidden">
               <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-ev-saffron via-ev-gold to-ev-green" />
               <Landmark size={48} className="text-ev-gold mx-auto mb-6" />
               <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">Command Confirmation</h3>
               <p className="text-ev-text-secondary text-sm mb-6">You are about to cryptographically sign a ballot for {CANDIDATES.find(c => c.id === selected).name}. This action is irreversible.</p>
               
               <div className="flex gap-4">
                 <button onClick={() => setConfirming(false)} className="ev-btn-outline flex-1 py-3 text-xs">Abort Command</button>
                 <button onClick={handleVote} disabled={loading} className="ev-btn-primary flex-1 py-3 text-xs flex items-center justify-center gap-2">
                   {loading ? <div className="w-4 h-4 border-2 border-ev-navy/20 border-t-ev-navy rounded-full animate-spin" /> : <ChevronRight size={16}/>}
                   Confirm Ballot
                 </button>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
