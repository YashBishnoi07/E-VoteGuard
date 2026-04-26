import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Typed from "typed.js";
import { 
  Shield, Lock, Zap, BarChart3, GitBranch, Hash, 
  Brain, ChevronRight, Vote, CheckCircle, Activity, 
  Award, Landmark, ShieldCheck, AlertTriangle
} from 'lucide-react';
import ElectionParticles from '../components/ElectionParticles';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { AnimatedStat } from '../components/AnimatedStat';

const features = [
  {
    icon: Hash,
    title: 'SHA-256 Hash Detection',
    description: 'Cryptographic fingerprinting ensures O(1) duplicate vote detection. Every voter gets a unique hash identity stored immutably.',
    complexity: 'O(1) lookup',
    color: 'ev-saffron'
  },
  {
    icon: Zap,
    title: 'Merge Sort Pattern Analysis',
    description: 'Votes sorted in O(n log n) with sliding window analysis detecting burst voting patterns and bot activity in real-time.',
    complexity: 'O(n log n)',
    color: 'ev-green'
  },
  {
    icon: GitBranch,
    title: 'Graph Cluster Detection',
    description: 'BFS/DFS traversal builds voter graphs from shared IPs and devices. Connected components reveal fraud rings instantly.',
    complexity: 'O(V + E)',
    color: 'ev-gold'
  },
  {
    icon: Activity,
    title: 'Greedy Fraud Scoring',
    description: 'Real-time greedy algorithm accumulates weighted behavioral signals. Score ≥ 60 triggers automatic account blocking.',
    complexity: 'O(k) constant',
    color: 'ev-red'
  },
  {
    icon: Brain,
    title: 'DP Anomaly Scoring',
    description: 'Dynamic programming computes Longest Suspicious Sequence (LSS) from voter action logs to identify high-risk patterns.',
    complexity: 'O(n²)',
    color: 'ev-saffron'
  },
  {
    icon: Lock,
    title: 'JWT + bcrypt Auth',
    description: 'Industry-standard authentication with 24h JWT tokens, bcrypt password hashing, and real-time rate limiting.',
    complexity: 'O(log n) lookup',
    color: 'ev-green'
  },
];

const steps = [
  { icon: <Award />, title: 'Register', desc: 'Securely register with Voter ID and SHA-256 fingerprinting.' },
  { icon: <Lock />, title: 'Authenticate', desc: 'O(log n) Binary Search verification during login phase.' },
  { icon: <Vote />, title: 'Cast Vote', desc: 'Real-time greedy fraud analysis ensures vote integrity.' },
  { icon: <ShieldCheck />, title: 'Get Receipt', desc: 'Receive blockchain-style SHA-256 cryptographic receipt.' },
  { icon: <Landmark />, title: 'Audit', desc: 'Transparent immutable logs for full electoral transparency.' },
];

export default function LandingPage() {
  const typedTarget = useRef(null);
  useScrollReveal(".reveal");

  useEffect(() => {
    const typed = new Typed(typedTarget.current, {
      strings: [
        "Securing Democracy.",
        "Detecting Fraud. In Real-Time.",
        "One Vote. One Voice. Zero Fraud.",
        "Algorithm-Driven Election Security."
      ],
      typeSpeed: 55,
      backSpeed: 30,
      backDelay: 2000,
      loop: true,
      cursorChar: "|"
    });
    return () => typed.destroy();
  }, []);

  return (
    <div className="min-h-screen bg-ev-navy overflow-hidden">
      <ElectionParticles />

      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center justify-center pt-24 pb-12">
        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          {/* Status Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold mb-8 uppercase tracking-widest bg-ev-saffron/10 border border-ev-saffron/30 text-ev-saffron shadow-[0_0_15px_rgba(255,107,0,0.1)]">
            <div className="w-2 h-2 rounded-full bg-ev-saffron animate-pulse" />
            Electoral Commission Security Standard
          </motion.div>

          {/* Typewritten Headline */}
          <div className="mb-6 h-[120px] md:h-[160px] flex items-center justify-center">
            <h1 className="text-5xl md:text-7xl font-black text-white leading-tight">
              <span ref={typedTarget} className="text-ev-saffron" />
            </h1>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-lg md:text-xl text-ev-text-secondary max-w-3xl mx-auto mb-10 leading-relaxed">
            Protecting the integrity of every ballot using <span className="text-ev-gold font-bold">SHA-256 hashing</span>, 
            <span className="text-ev-green font-bold"> Graph Clustering (BFS)</span>, and 
            <span className="text-ev-saffron font-bold"> Dynamic Programming</span> to ensure an unhackable democratic process.
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-5 justify-center">
            <Link to="/register" className="ev-btn-primary flex items-center gap-2 justify-center px-10">
              <Vote className="w-5 h-5" />
              Register to Vote
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link to="/login" className="ev-btn-outline flex items-center gap-2 justify-center px-10">
              <Shield className="w-5 h-5" />
              Admin Portal
            </Link>
          </motion.div>
        </div>

        {/* Floating Icons Background */}
        <div className="absolute inset-0 pointer-events-none opacity-20 hidden lg:block">
          <motion.div animate={{ y: [-20, 20], rotate: [0, 10] }} transition={{ duration: 5, repeat: Infinity, repeatType: 'reverse' }} className="absolute top-[20%] left-[10%]"><Shield size={80} className="text-ev-gold" /></motion.div>
          <motion.div animate={{ y: [20, -20], rotate: [0, -10] }} transition={{ duration: 6, repeat: Infinity, repeatType: 'reverse' }} className="absolute top-[30%] right-[15%]"><CheckCircle size={60} className="text-ev-green" /></motion.div>
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 7, repeat: Infinity }} className="absolute bottom-[20%] left-[20%]"><Lock size={50} className="text-ev-saffron" /></motion.div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="py-20 px-6 relative bg-white/[0.02]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatedStat value={99.9} label="System Integrity" icon={Shield} color="ev-gold" />
          <AnimatedStat value={15240} label="Total Secure Votes" icon={Vote} color="ev-green" />
          <AnimatedStat value={5} label="Algorithms Monitoring" icon={Zap} color="ev-saffron" />
          <AnimatedStat value={84} label="Fraud Rings Blocked" icon={AlertTriangle} color="ev-red" />
        </div>
      </section>

      {/* PROCESS FLOW */}
      <section className="py-24 px-6 reveal">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-sm font-bold text-ev-gold uppercase tracking-[0.3em] mb-4">Integrity Pipeline</h2>
            <h3 className="text-4xl font-black text-white">How We Secure Your Vote</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative">
            <div className="hidden md:block absolute top-10 left-0 right-0 h-0.5 bg-ev-surface-border z-0" />
            {steps.map((step, i) => (
              <div key={i} className="relative z-10 text-center flex flex-col items-center group">
                <div className="w-20 h-20 rounded-2xl ev-card seal-border flex items-center justify-center text-ev-gold mb-6 group-hover:scale-110 transition-transform duration-300">
                  {step.icon}
                </div>
                <h4 className="text-lg font-bold text-white mb-2">{step.title}</h4>
                <p className="text-ev-text-secondary text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DAA ALGORITHMS SHOWCASE */}
      <section className="py-24 px-6 bg-ev-navy-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 reveal">
            <h2 className="text-sm font-bold text-ev-green uppercase tracking-[0.3em] mb-4">DAA Implementation</h2>
            <h3 className="text-4xl font-black text-white">Cryptographic Fraud Detection</h3>
            <p className="text-ev-text-secondary mt-4 max-w-2xl mx-auto">Five enterprise-grade algorithms working in parallel to detect, score, and block malicious electoral activity.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={i} className="reveal ev-card p-8 group hover:border-ev-gold/40 transition-all duration-300 cursor-default">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-${feature.color}/10 border border-${feature.color}/30 text-white`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-3">{feature.title}</h4>
                  <p className="text-ev-text-secondary text-sm leading-relaxed mb-6">{feature.description}</p>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter bg-ev-navy-700 border border-ev-surface-border text-ev-gold`}>
                    Complexity: {feature.complexity}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 px-6 reveal">
        <div className="max-w-4xl mx-auto">
          <div className="ev-card seal-border p-12 text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-ev-saffron/5 rounded-full blur-[80px] -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-ev-green/5 rounded-full blur-[80px] -ml-32 -mb-32" />
            
            <ShieldCheck size={48} className="text-ev-gold mx-auto mb-6" />
            <h2 className="text-4xl font-black text-white mb-4">Begin Your Democratic Contribution</h2>
            <p className="text-ev-text-secondary mb-10 max-w-xl mx-auto italic">"A fair election is the foundation of every prosperous society. Our algorithms ensure your voice is heard, accurately."</p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="ev-btn-primary px-12">Register Now</Link>
              <Link to="/login" className="ev-btn-outline px-12">Member Login</Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 border-t border-ev-surface-border text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3 text-ev-gold font-bold text-lg">
            <Landmark size={24} />
            VoteGuard Integrity Platform
          </div>
          <p className="text-ev-text-muted text-xs uppercase tracking-widest">
            © 2026 National Electoral Digital Safety Command · Powered by DAA Algorithms
          </p>
        </div>
      </footer>
    </div>
  );
}
