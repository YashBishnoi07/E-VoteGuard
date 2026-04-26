const mongoose = require('mongoose');

const fraudLogSchema = new mongoose.Schema({
  voterID: { type: String, required: true },
  voterName: { type: String, default: 'Unknown' },
  fraudType: {
    type: String,
    enum: ['DUPLICATE_VOTE', 'BOT_PATTERN', 'CLUSTER_FRAUD', 'BURST_VOTING', 'IMPERSONATION', 'SUSPICIOUS_BEHAVIOR'],
    required: true
  },
  score: { type: Number, required: true },
  riskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], required: true },
  reason: { type: String, required: true },
  ipAddress: { type: String, default: null },
  deviceFingerprint: { type: String, default: null },
  isResolved: { type: Boolean, default: false },
  resolvedAt: { type: Date, default: null },
  actionTaken: { type: String, default: null },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

fraudLogSchema.index({ voterID: 1 });
fraudLogSchema.index({ riskLevel: 1 });
fraudLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('FraudLog', fraudLogSchema);
