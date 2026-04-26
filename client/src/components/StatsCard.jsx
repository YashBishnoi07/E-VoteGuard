import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatsCard({ label, value, icon: Icon, trend, trendLabel, color = '#6366f1', loading = false }) {
  if (loading) {
    return (
      <div className="stat-card">
        <div className="shimmer h-4 w-24 rounded mb-3" />
        <div className="shimmer h-8 w-16 rounded mb-2" />
        <div className="shimmer h-3 w-20 rounded" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="stat-card group cursor-default"
      style={{
        '--card-color': color,
        borderColor: `${color}30`,
      }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">{label}</p>
          <motion.p
            className="text-3xl font-bold text-white"
            key={value}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}>
            {value}
          </motion.p>
          {trendLabel && (
            <div className="flex items-center gap-1 mt-2">
              {trend >= 0
                ? <TrendingUp className="w-3 h-3 text-emerald-400" />
                : <TrendingDown className="w-3 h-3 text-red-400" />}
              <span className={`text-xs font-medium ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{trendLabel}</span>
            </div>
          )}
        </div>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110"
          style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
      <div className="mt-4 h-0.5 rounded-full opacity-30 group-hover:opacity-60 transition-opacity"
        style={{ background: `linear-gradient(to right, ${color}, transparent)` }} />
    </motion.div>
  );
}
