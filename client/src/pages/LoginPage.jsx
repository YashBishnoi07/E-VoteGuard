import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, CreditCard, Lock, Eye, EyeOff, LogIn, Activity, Landmark } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import ElectionParticles from '../components/ElectionParticles';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ voterID: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginResult, setLoginResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await login(form.voterID, form.password);
      setLoginResult(result);
      toast.success(`Access Granted: Welcome back ${result.voter.name.split(' ')[0]}`);
      setTimeout(() => {
        navigate(result.voter.role === 'admin' ? '/admin' : '/vote');
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.message || 'Access Denied: Record mismatch.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ev-navy flex items-center justify-center p-6 pt-24 overflow-hidden relative">
      <ElectionParticles />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="ev-card p-10 w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-ev-gold/10 border border-ev-gold/30 rounded-full text-[10px] text-ev-gold font-bold uppercase tracking-widest mb-6">
            <Landmark size={12} />
            Verified Electoral Node
          </div>
          <h1 className="text-4xl font-black text-white leading-none mb-2 shimmer-saffron uppercase tracking-tighter">Secure Entry</h1>
          <p className="text-ev-text-secondary text-xs font-bold tracking-[0.2em] uppercase">Electoral Database Authentication</p>
        </div>

        {loginResult && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-3 bg-ev-green/10 border border-ev-green/30 rounded-xl"
          >
            <div className="flex items-center gap-2 text-ev-green text-[10px] font-black uppercase tracking-widest">
              <Activity size={14} />
              <span>{loginResult.algorithm}</span>
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-ev-text-muted uppercase tracking-[0.2em] mb-2">Voter Identity ID</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-ev-saffron text-ev-text-muted transition-colors">
                  <CreditCard size={18} />
                </div>
                <input
                  id="login-voterID"
                  type="text"
                  value={form.voterID}
                  onChange={e => setForm(p => ({ ...p, voterID: e.target.value }))}
                  placeholder="Voter ID"
                  required
                  className="w-full bg-ev-navy-800 border border-ev-surface-border rounded-xl py-4 pl-12 pr-4 text-sm text-white focus:border-ev-gold focus:ring-1 focus:ring-ev-gold/20 outline-none transition-all placeholder:text-ev-text-muted/50 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-ev-text-muted uppercase tracking-[0.2em] mb-2">Access Key (Password)</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-ev-saffron text-ev-text-muted transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••"
                  required
                  className="w-full bg-ev-navy-800 border border-ev-surface-border rounded-xl py-4 pl-12 pr-12 text-sm text-white focus:border-ev-gold focus:ring-1 focus:ring-ev-gold/20 outline-none transition-all"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-ev-text-muted hover:text-white transition-colors">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 bg-ev-gold/5 border border-ev-gold/20 rounded-xl">
            <h4 className="text-[10px] font-black text-ev-gold uppercase tracking-[0.2em] mb-1.5 flex items-center gap-2">
              <Shield size={12} /> Verification Logic
            </h4>
            <p className="text-[9px] text-ev-text-muted leading-relaxed font-medium">
              System performing <span className="text-ev-gold">Binary Search Verification [O(log n)]</span> across distributed voter nodes. Identity 2FA fingerprints active.
            </p>
          </div>

          <button
            id="login-submit"
            type="submit"
            disabled={loading}
            className="ev-btn-primary w-full py-4 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <><LogIn size={20} />Validate & Enter System</>
            )}
          </button>

          <p className="text-center text-ev-text-muted text-[10px] font-black uppercase tracking-widest">
            New Voter Node?{' '}
            <Link to="/register" className="text-ev-saffron hover:text-ev-gold transition-colors ml-1 underline underline-offset-8 decoration-ev-saffron/30">
              Create Secure Identity
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
