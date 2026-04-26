const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'VOTER_REGISTERED', 'VOTER_LOGGED_IN', 'VOTE_CAST', 'VOTE_VERIFIED',
      'FRAUD_DETECTED', 'VOTER_BLOCKED', 'VOTER_UNBLOCKED', 'ADMIN_LOGIN',
      'FRAUD_CLEARED', 'SYSTEM_SEED', 'FAILED_LOGIN', 'SUSPICIOUS_ACCESS'
    ]
  },
  actor: { type: String, required: true }, // voterID or 'SYSTEM' or 'ADMIN'
  actorName: { type: String, default: 'Unknown' },
  target: { type: String, default: null }, // affected entity
  description: { type: String, required: true },
  ipAddress: { type: String, default: null },
  deviceFingerprint: { type: String, default: null },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  severity: { type: String, enum: ['INFO', 'WARNING', 'CRITICAL'], default: 'INFO' }
}, { timestamps: true });

auditLogSchema.index({ actor: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
