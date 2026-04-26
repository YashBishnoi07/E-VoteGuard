const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  voterHash: { type: String, required: true }, // Removed unique: true temporarily to fix sync issues
  voterID: { type: String, required: true },
  candidateId: { type: Number, required: true },
  candidateName: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  ipAddress: { type: String, required: true },
  deviceFingerprint: { type: String, required: true },
  receiptHash: { type: String, required: true, unique: true },
  prevHash: { type: String, default: "0000000000000000000000000000000000000000000000000000000000000000" },
  blockIndex: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: true },
  processingTimeMs: { type: Number, default: 0 },
  voterState: { type: String, default: "" },
  castByName: { type: String, default: "" }
}, { timestamps: true });

voteSchema.index({ candidateId: 1 });
voteSchema.index({ blockIndex: -1 }); // Fast lookup for the chain tip

module.exports = mongoose.model('Vote', voteSchema);
