const mongoose = require('mongoose');

const voterSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  voterID: { type: String, required: true, unique: true },
  aadhaarID: { type: String, required: true, unique: true },
  dob: { type: Date, required: true },
  state: { type: String, required: true },
  password: { type: String, required: true },
  hashedFingerprint: { type: String, required: true, unique: true },
  hardwareWebAuthnId: { type: String, default: null }, // Stores the PC/Hardware fingerprint credential ID
  photoBase64: { type: String, default: "" }, 
  faceDescriptor: { type: [Number], default: [] },
  guardianName: { type: String, default: "" },
  gender: { type: String, enum: ['Male', 'Female', 'Other', ''], default: '' },
  district: { type: String, default: "" },
  constituency: { type: String, default: "" },
  hasVoted: { type: Boolean, default: false },
  voteReceiptHash: { type: String, default: null },
  role: { type: String, enum: ['voter', 'admin'], default: 'voter' },
  isBlocked: { type: Boolean, default: false },
  fraudScore: { type: Number, default: 0 },
  riskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'LOW' },
  loginAttempts: { type: Number, default: 0 },
  lastLoginIP: { type: String, default: null },
  lastLoginAt: { type: Date, default: null },
  registeredIP: { type: String, default: null },
  deviceFingerprints: [{ type: String }],
  actionLog: [{
    action: String,
    timestamp: { type: Date, default: Date.now },
    metadata: mongoose.Schema.Types.Mixed
  }]
}, { timestamps: true });

// Compound index for binary search simulation
voterSchema.index({ voterID: 1, hashedFingerprint: 1 });

module.exports = mongoose.model('Voter', voterSchema);
