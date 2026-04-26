import { useState, useEffect, useCallback } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Vote, AlertTriangle, Shield, Activity, RefreshCw,
  GitBranch, Hash, Brain, BarChart3,
  Map as MapIcon, Database, Cpu, MessageSquare, Globe, Landmark,
  Camera, ChevronRight
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, 
  RadarChart, Radar, PolarGrid, PolarAngleAxis 
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import api from '../api/axios';
import StatsCard from '../components/StatsCard'; 
import VoteChart from '../components/VoteChart';
import FraudTable from '../components/FraudTable';
import AnomalyGraph from '../components/AnomalyGraph';
import FraudAlert from '../components/FraudAlert';
import IndiaMap from '../components/IndiaMap';
import VoteLedger from '../components/VoteLedger';
import toast from 'react-hot-toast';
import { useScrollReveal } from '../hooks/useScrollReveal';

const FRAUD_COLORS = {
  DUPLICATE_VOTE: '#C0392B',
  BOT_PATTERN: '#FF6B00',
  CLUSTER_FRAUD: '#D4AF37',
  BURST_VOTING: '#00A86B',
  SUSPICIOUS_BEHAVIOR: '#3B82F6',
  IMPERSONATION: '#8B5CF6',
};

const ALGORITHM_DATA = [
  { subject: 'Hashing', A: 98, fullMark: 100 },
  { subject: 'Pattern', A: 85, fullMark: 100 },
  { subject: 'Graph', A: 94, fullMark: 100 },
  { subject: 'Greedy', A: 80, fullMark: 100 },
  { subject: 'DP', A: 92, fullMark: 100 },
];

const Zap = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.71 12 2l1.6 4.8 6.4 1.2-4.15 4.15L17.15 22 12 17.5 6.85 22l1.3-7.29z"/></svg>
);

const ALGORITHM_CARDS = [
  { name: 'SHA-256 Hashing', icon: Hash, purpose: 'O(1) Duplicate Identity Detection', time: 'O(1) avg', space: 'O(n)', color: 'ev-saffron' },
  { name: 'Merge Sort Analysis', icon: BarChart3, purpose: 'O(n log n) Burst Pattern Detection', time: 'O(n log n)', space: 'O(n)', color: 'ev-green' },
  { name: 'BFS Graph Traversal', icon: GitBranch, purpose: 'O(V + E) Fraud Ring Clustering', time: 'O(V + E)', space: 'O(V + E)', color: 'ev-gold' },
  { name: 'Greedy Risk Scoring', icon: Zap, purpose: 'O(k) Behavioral Signal Scoring', time: 'O(k) fixed', space: 'O(1)', color: 'ev-red' },
  { name: 'DP Behavioral Scan', icon: Brain, purpose: 'O(n²) Longest Suspicious Sequence', time: 'O(n²)', space: 'O(n)', color: 'ev-navy' },
];

export default function AdminDashboard() {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const { socket, connected, fraudAlerts } = useSocket();
  const [stats, setStats] = useState(null);
  const [voteResults, setVoteResults] = useState(null);
  const [flaggedVoters, setFlaggedVoters] = useState([]);
  const [clusters, setClusters] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [localAlerts, setLocalAlerts] = useState([]);

  useScrollReveal(".reveal-dash");

  const fetchAll = useCallback(async () => {
    try {
      const [statsRes, voteRes, flaggedRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/vote/results'),
        api.get('/fraud/flagged'),
      ]);

      setStats(statsRes.data);
      setVoteResults(voteRes.data);
      setFlaggedVoters(flaggedRes.data.flaggedVoters || []);
    } catch (err) {
      toast.error('Sync Error: Failed to fetch live electoral metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchClusters = async () => {
    try {
      const res = await api.get('/fraud/clusters');
      setClusters(res.data);
    } catch (err) {
      toast.error('Graph analysis failed: Cluster dataset offline');
    }
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  useEffect(() => {
    if (fraudAlerts.length > 0) {
      setLocalAlerts(fraudAlerts);
    }
  }, [fraudAlerts]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/vote" replace />;

  const fraudDistributionData = stats?.fraudDistribution?.map(d => ({
    name: d._id?.replace(/_/g, ' ') || 'Unknown',
    value: d.count,
    color: FRAUD_COLORS[d._id] || '#FF6B00'
  })) || [];

  const tabs = [
    { id: 'overview', label: 'Electoral Overview', icon: Globe },
    { id: 'spatial', label: 'Regional Analysis', icon: MapIcon },
    { id: 'ledger', label: 'Vote Ledger', icon: Database },
    { id: 'flagged', label: 'Flagged Assets', icon: AlertTriangle },
    { id: 'clusters', label: 'Graph Clusters', icon: GitBranch },
    { id: 'algorithms', label: 'Algorithm Logic', icon: Cpu }
  ];

  return (
    <div className="min-h-screen bg-ev-navy pt-24 pb-12 px-6">
      <FraudAlert
        alerts={localAlerts}
        onDismiss={(id) => setLocalAlerts(prev => prev.filter(a => a.id !== id))}
      />

      <div className="max-w-7xl mx-auto">
        {/* DASHBOARD HEADER */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-6 reveal-dash">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-ev-saffron/10 border border-ev-saffron/30 flex items-center justify-center text-ev-saffron">
                <Shield size={28} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Command Center</h1>
                <p className="text-ev-text-secondary text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  <Landmark size={14} className="text-ev-gold" />
                  National Election Monitoring Node · <span className="text-white">{user?.name}</span>
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             {/* New Feature Trigger */}
            <Link to="/admin/id-scanner" className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-ev-gold text-ev-navy font-black text-[10px] uppercase tracking-widest hover:bg-ev-gold-400 transition-all shadow-lg shadow-ev-gold/10">
               <Camera size={16} /> Biometric ID Scanner <ChevronRight size={14} />
            </Link>
            
            <div className={`px-4 py-2 rounded-xl flex items-center gap-3 border ${connected ? 'bg-ev-green/10 border-ev-green/30 text-ev-green' : 'bg-ev-red/10 border-ev-red/30 text-ev-red'}`}>
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-ev-green animate-pulse' : 'bg-ev-red pulse'}`} />
              <span className="text-xs font-black uppercase tracking-wider">{connected ? 'Node Online' : 'Node Disconnected'}</span>
            </div>
            <button onClick={fetchAll} className="ev-btn-outline p-2.5 rounded-xl border-ev-surface-border hover:bg-white/5">
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* PRIMARY STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 reveal-dash">
          <StatsCard loading={loading} label="Active Voters" value={stats?.totalVoters ?? '-'} icon={Users} color="#FF6B00" />
          <StatsCard loading={loading} label="Vote Count" value={stats?.totalVotes ?? '-'} icon={Vote} color="#00A86B" />
          <StatsCard loading={loading} label="Fraud Hotspots" value={stats?.fraudAttempts ?? '-'} icon={AlertTriangle} color="#C0392B" />
          <StatsCard loading={loading} label="Democracy Index" value={stats ? `${stats.systemIntegrity}%` : '-'} icon={Shield} color="#D4AF37" />
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex gap-2 mb-10 overflow-x-auto pb-4 scrollbar-hide border-b border-ev-surface-border">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); if (tab.id === 'clusters' && !clusters) fetchClusters(); }}
              className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-bold text-xs uppercase tracking-widest transition-all duration-300 relative ${activeTab === tab.id ? 'text-ev-gold' : 'text-ev-text-muted hover:text-ev-text-secondary'}`}
            >
              <tab.icon size={16} />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-ev-gold shadow-[0_0_10px_rgba(212,175,55,0.5)]" />
              )}
            </button>
          ))}
        </div>

        {/* TAB CONTENT */}
        <div className="min-h-[500px]">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="ev-card p-8">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-lg font-bold text-white">Live Candidate Performance</h3>
                        <p className="text-ev-text-secondary text-xs">Real-time socket data synchronization</p>
                      </div>
                      <BarChart3 className="text-ev-green" />
                    </div>
                    <VoteChart data={voteResults?.candidates || []} />
                  </div>
                  <div className="ev-card p-8">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-lg font-bold text-white">Integrity Chronology</h3>
                        <p className="text-ev-text-secondary text-xs">24-hour activity pattern analysis</p>
                      </div>
                      <Activity className="text-ev-saffron" />
                    </div>
                    <AnomalyGraph data={stats?.activityTimeline || {}} />
                  </div>

                  <div className="ev-card p-8">
                    <h3 className="text-lg font-bold text-white mb-6">Detection Breakdown</h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie 
                            data={fraudDistributionData} 
                            cx="50%" cy="50%" 
                            innerRadius={60} 
                            outerRadius={100} 
                            paddingAngle={5} 
                            dataKey="value"
                            stroke="rgba(0,0,0,0)"
                          >
                            {fraudDistributionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1A2535', border: '1px solid #243044', borderRadius: '12px' }}
                            itemStyle={{ color: '#F0F4F8', fontWeight: 'bold' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4 text-center">
                       {fraudDistributionData.map(d => (
                        <div key={d.name} className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                          <span className="text-[10px] text-ev-text-secondary font-bold uppercase truncate">{d.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="ev-card p-8">
                    <h3 className="text-lg font-bold text-white mb-6">Algorithm Effectiveness</h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={ALGORITHM_DATA}>
                          <PolarGrid stroke="#243044" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 'bold' }} />
                          <Radar name="Accuracy" dataKey="A" stroke="#FF6B00" fill="#FF6B00" fillOpacity={0.4} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'spatial' && (
              <motion.div key="spatial" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <IndiaMap />
              </motion.div>
            )}

            {activeTab === 'ledger' && (
              <motion.div key="ledger" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-[600px]">
                <VoteLedger socket={socket} />
              </motion.div>
            )}

            {activeTab === 'flagged' && (
              <motion.div key="flagged" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="ev-card p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black text-white">Blocked & Flagged Assets</h3>
                  <div className="flex gap-2">
                    <div className="px-3 py-1 bg-ev-red/10 border border-ev-red/30 rounded text-[10px] text-ev-red font-black uppercase">HIGH RISK: {flaggedVoters.filter(v => v.riskLevel === 'HIGH').length}</div>
                    <div className="px-3 py-1 bg-ev-saffron/10 border border-ev-saffron/30 rounded text-[10px] text-ev-saffron font-black uppercase">MEDIUM RISK: {flaggedVoters.filter(v => v.riskLevel === 'MEDIUM').length}</div>
                  </div>
                </div>
                <FraudTable voters={flaggedVoters} onRefresh={fetchAll} />
              </motion.div>
            )}

            {activeTab === 'clusters' && (
              <motion.div key="clusters" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                {clusters ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 ev-card p-8 bg-ev-navy-800">
                      <h3 className="text-xl font-bold text-white mb-6">Fraud Ring Topological View</h3>
                      <div className="h-[400px] flex items-center justify-center border border-ev-surface-border rounded-xl bg-ev-navy/50 relative overflow-hidden">
                        <div className="absolute inset-0 grid grid-cols-10 grid-rows-10 opacity-10">
                          {Array.from({ length: 100 }).map((_, i) => <div key={i} className="border border-ev-gold/20" />)}
                        </div>
                        <GitBranch size={120} className="text-ev-gold/10 animate-pulse" />
                        <div className="absolute bottom-4 left-4 text-[10px] text-ev-gold font-bold uppercase tracking-widest">BFS FRONTIER VISUALIZATION READY</div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="ev-card p-6 border-l-4 border-ev-red">
                        <h4 className="text-ev-red font-bold text-xs mb-1 uppercase tracking-widest">Active Fraud Rings</h4>
                        <p className="text-3xl font-black text-white">{clusters.fraudRings?.length || 0}</p>
                      </div>
                      <div className="ev-card p-6 border-l-4 border-ev-gold">
                        <h4 className="text-ev-gold font-bold text-xs mb-1 uppercase tracking-widest">Compromised Nodes</h4>
                        <p className="text-3xl font-black text-white">{clusters.totalFraudNodes || 0}</p>
                      </div>
                      <div className="ev-card p-8 flex flex-col justify-center text-center">
                        <p className="text-[10px] text-ev-text-muted italic mb-4 font-mono">"Shared IP/Device infrastructure detected via BFS O(V+E) graph traversal."</p>
                        <button onClick={fetchClusters} className="ev-btn-primary py-3 text-[10px] font-black uppercase tracking-widest">Re-run Analysis</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="ev-card p-20 text-center flex flex-col items-center">
                    <GitBranch size={80} className="text-ev-surface-border mb-6" />
                    <h3 className="text-2xl font-bold text-white mb-3">Graph Matrix Empty</h3>
                    <p className="text-ev-text-secondary mb-8 max-w-md text-sm">Initialize graph traversal engine to identify voter clusters sharing infrastructure.</p>
                    <button onClick={fetchClusters} className="ev-btn-primary px-12 py-4 font-black uppercase tracking-widest">Run BFS Cluster Detection</button>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'algorithms' && (
              <motion.div key="algorithms" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ALGORITHM_CARDS.map((algo, i) => {
                  const Icon = algo.icon;
                  return (
                    <div key={i} className="ev-card p-8 group hover:border-ev-gold/50 transition-all duration-500">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-white/5 border border-white/10 text-ev-gold`}>
                        <Icon size={28} />
                      </div>
                      <h4 className="text-xl font-bold text-white mb-2">{algo.name}</h4>
                      <p className="text-ev-text-secondary text-xs leading-relaxed mb-6 h-10">{algo.purpose}</p>
                      <div className="space-y-3 pt-4 border-t border-white/5">
                        <div className="flex justify-between text-[10px] font-black tracking-widest uppercase">
                          <span className="text-ev-text-muted">TIME</span>
                          <span className="text-ev-gold">{algo.time}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-black tracking-widest uppercase">
                          <span className="text-ev-text-muted">SPACE</span>
                          <span className="text-ev-green">{algo.space}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Floating Chat Assistant Trigger */}
      <motion.button 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-ev-saffron text-white shadow-[0_0_30px_rgba(255,107,0,0.4)] flex items-center justify-center z-50 overflow-hidden"
      >
        <MessageSquare size={28} />
      </motion.button>
    </div>
  );
}
