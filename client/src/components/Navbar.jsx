import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Menu, X, Vote, LayoutDashboard, LogOut, 
  User, FileText, Activity, Landmark 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  const navItems = isAuthenticated
    ? isAdmin
      ? [
          { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/audit', label: 'Audit Log', icon: FileText },
        ]
      : [
          { to: '/vote', label: 'Cast Vote', icon: Vote },
          { to: '/audit', label: 'Audit Log', icon: FileText },
        ]
    : [
        { to: '/login', label: 'Login', icon: User },
        { to: '/register', label: 'Register', icon: Shield },
      ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between glass border border-ev-surface-border p-4 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-tr from-ev-saffron to-ev-gold shadow-[0_0_15px_rgba(255,107,0,0.3)]">
              <Shield className="w-5 h-5 text-ev-navy" />
            </div>
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-[0_0_20px_rgba(212,175,55,0.7)]" />
          </div>
          <div>
            <span className="font-black text-xl text-white uppercase tracking-tighter shimmer-saffron">VoteGuard</span>
            <div className="text-[8px] text-ev-gold font-black uppercase tracking-[0.3em] leading-none">Security Command Node</div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to}
              className="flex items-center gap-2 text-ev-text-muted hover:text-white transition-all duration-300 text-[10px] font-black uppercase tracking-widest group">
              <Icon size={14} className="group-hover:text-ev-gold group-hover:scale-110 transition-all" />
              {label}
            </Link>
          ))}

          {isAuthenticated && (
            <div className="flex items-center gap-4 pl-6 border-l border-ev-surface-border">
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-ev-gold/5 border border-ev-gold/20 shadow-[0_0_15px_rgba(212,175,55,0.05)]">
                <div className="w-2 h-2 rounded-full bg-ev-green animate-pulse" />
                <span className="text-[10px] text-ev-gold font-black uppercase tracking-widest">{user?.name?.split(' ')[0]}</span>
                {isAdmin && <span className="bg-ev-gold text-ev-navy px-1.5 py-0.5 rounded text-[8px] font-black ml-1">ADMIN</span>}
              </div>
              <button onClick={handleLogout}
                className="text-ev-text-muted hover:text-ev-red transition-colors">
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-white" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-6 right-6 mt-4 p-6 glass border border-ev-surface-border rounded-2xl md:hidden overflow-hidden"
          >
            <div className="flex flex-col gap-6">
              {navItems.map(({ to, label, icon: Icon }) => (
                <Link key={to} to={to} onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-4 text-white font-bold uppercase text-xs tracking-widest">
                  <Icon size={18} className="text-ev-saffron" />
                  {label}
                </Link>
              ))}
              {isAuthenticated && (
                <button onClick={handleLogout} className="flex items-center gap-4 text-ev-red font-bold uppercase text-xs tracking-widest">
                  <LogOut size={18} />
                  System Logout
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
