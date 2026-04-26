import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, X, Shield, Zap } from 'lucide-react';

const RISK_STYLES = {
  HIGH: { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)', icon: 'text-red-400', badge: 'bg-red-500' },
  MEDIUM: { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)', icon: 'text-amber-400', badge: 'bg-amber-500' },
  LOW: { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.4)', icon: 'text-emerald-400', badge: 'bg-emerald-500' },
};

const FRAUD_TYPE_LABELS = {
  DUPLICATE_VOTE: '🔁 Duplicate Vote',
  BOT_PATTERN: '🤖 Bot Pattern',
  CLUSTER_FRAUD: '🔗 Cluster Fraud',
  BURST_VOTING: '⚡ Burst Voting',
  IMPERSONATION: '👤 Impersonation',
  SUSPICIOUS_BEHAVIOR: '⚠️ Suspicious Behavior',
};

export default function FraudAlert({ alerts, onDismiss }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full">
      <AnimatePresence>
        {alerts.slice(0, 4).map((alert) => {
          const style = RISK_STYLES[alert.riskLevel] || RISK_STYLES.MEDIUM;
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              className="relative rounded-2xl p-4 shadow-2xl"
              style={{
                background: style.bg,
                border: `1px solid ${style.border}`,
                backdropFilter: 'blur(20px)'
              }}>
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 ${style.icon}`}>
                  <AlertTriangle className="w-5 h-5 fraud-alert-badge" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold text-white px-2 py-0.5 rounded-full ${style.badge}`}>
                      {alert.riskLevel}
                    </span>
                    <span className="text-xs text-white/60 font-mono">{FRAUD_TYPE_LABELS[alert.fraudType] || alert.fraudType}</span>
                  </div>
                  <p className="text-sm text-white font-medium truncate">
                    Voter: {alert.voterID}
                  </p>
                  {alert.reason && (
                    <p className="text-xs text-white/60 mt-1 line-clamp-2">{alert.reason}</p>
                  )}
                  {alert.score !== undefined && (
                    <div className="flex items-center gap-1 mt-2">
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span className="text-xs text-amber-400 font-mono">Fraud Score: {alert.score}/100</span>
                    </div>
                  )}
                  <p className="text-xs text-white/30 mt-1">
                    {new Date(alert.timestamp || Date.now()).toLocaleTimeString()}
                  </p>
                </div>
                {onDismiss && (
                  <button onClick={() => onDismiss(alert.id)}
                    className="text-white/40 hover:text-white transition-colors flex-shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
