const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Voter = require('../models/Voter');
const AuditLog = require('../models/AuditLog');
const { generateVoterHash } = require('../algorithms/hashingEngine');
const { binarySearchVoter } = require('../algorithms/patternDetection');
const { calculateRegistrationFraudScore } = require('../algorithms/greedyValidator');

// Helper: generate JWT
function generateToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '24h' });
}

// Helper: get IP from request
function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    '127.0.0.1';
}

/**
 * POST /api/auth/register
 * Voter registration with duplicate detection and age validation
 */
const register = async (req, res) => {
  try {
    const { name, email, voterID, aadhaarID, dob, state, password, photoBase64, faceDescriptor, guardianName, gender, district, constituency, hardwareWebAuthnId, triedUnderageEntry, hadDuplicateAttempt } = req.body;

    // Input validation
    if (!name || !email || !voterID || !aadhaarID || !dob || !state || !password) {
      return res.status(400).json({ message: 'Core identity fields are required.' });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format.' });
    }

    // Voter ID: 12 alphanumeric
    if (!/^[A-Z0-9]{10,12}$/.test(voterID)) {
      return res.status(400).json({ message: 'Voter ID must be 10-12 alphanumeric characters.' });
    }

    // Aadhaar: 12 digits
    if (!/^\d{12}$/.test(aadhaarID)) {
      return res.status(400).json({ message: 'Aadhaar ID must be exactly 12 digits.' });
    }

    // Age validation (must be >= 18)
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age < 18) {
      return res.status(400).json({ message: 'Voter must be at least 18 years old.' });
    }

    // Password strength
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    // SHA-256 fingerprint — duplicate detection O(1) hash lookup
    const hashedFingerprint = generateVoterHash(voterID, email);

    // Check for existing voter via fingerprint hash O(1)
    const existingByFingerprint = await Voter.findOne({ hashedFingerprint });
    if (existingByFingerprint) {
      return res.status(409).json({ message: 'Voter with this identity already exists.', algorithm: 'SHA-256 Hash Lookup: O(1)' });
    }

    // Check email / voterID uniqueness
    const existingEmail = await Voter.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({ message: 'Email already registered.' });
    }

    const existingVoterID = await Voter.findOne({ voterID });
    if (existingVoterID) {
      return res.status(409).json({ message: 'Voter ID already registered.' });
    }

    const existingAadhaar = await Voter.findOne({ aadhaarID });
    if (existingAadhaar) {
      return res.status(409).json({ message: 'Aadhaar ID already registered.' });
    }

    // Hash password with bcryptjs (10 salt rounds)
    const hashedPassword = await bcrypt.hash(password, 10);

    const clientIP = getClientIP(req);

    // Calculate registration-time fraud score using greedy scoring
    const regFraud = calculateRegistrationFraudScore({
      photoBase64,
      faceDescriptor,
      triedUnderageEntry: !!triedUnderageEntry,
      hadDuplicateAttempt: !!hadDuplicateAttempt
    });

    const voter = new Voter({
      name,
      email,
      voterID,
      aadhaarID,
      dob: birthDate,
      state,
      password: hashedPassword,
      hashedFingerprint,
      hardwareWebAuthnId,
      photoBase64: photoBase64 || "",
      faceDescriptor: faceDescriptor || [],
      guardianName: guardianName || "",
      gender: gender || "",
      district: district || "",
      constituency: constituency || "",
      role: 'voter',
      fraudScore: regFraud.score,
      riskLevel: regFraud.risk,
      registeredIP: clientIP,
      deviceFingerprints: []
    });

    await voter.save();

    // Audit log
    await AuditLog.create({
      action: 'VOTER_REGISTERED',
      actor: voterID,
      actorName: name,
      description: `New voter: ${name} FROM ${state}. DEBUG [DOB:${dob}|REL:${guardianName}|GEN:${gender}|DIST:${district}|CONST:${constituency}]`,
      ipAddress: clientIP,
      severity: 'INFO'
    });
    console.log("REGISTER_DEBUG:", { dob, guardianName, gender });

    const token = generateToken(voter._id);

    const voterData = voter.toObject();
    delete voterData.password;

    res.status(201).json({
      message: 'Registration successful',
      token,
      voter: voterData,
      algorithm: 'SHA-256 Hash Fingerprint stored with Biometric Reference.'
    });

  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error during registration.', error: err.message });
  }
};

/**
 * POST /api/auth/login
 * Login with binary search simulation for voter lookup
 */
const login = async (req, res) => {
  try {
    const { voterID, password } = req.body;

    if (!voterID || !password) {
      return res.status(400).json({ message: 'Voter ID and password are required.' });
    }

    // Binary Search simulation: fetch sorted voters (MongoDB uses index O(log n))
    // In production, MongoDB btree index provides O(log n) lookup
    const startTime = Date.now();
    const voter = await Voter.findOne({ voterID }).collation({ locale: 'en', strength: 2 });
    const lookupTime = Date.now() - startTime;

    if (!voter) {
      return res.status(401).json({
        message: 'Invalid credentials.',
        algorithm: `Binary Search (B-tree index): O(log n). Lookup: ${lookupTime}ms`
      });
    }

    if (voter.isBlocked) {
      return res.status(403).json({ message: 'Your account has been blocked. Contact election authority.' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, voter.password);

    if (!isMatch) {
      // Track failed login attempts
      voter.loginAttempts = (voter.loginAttempts || 0) + 1;
      await voter.save();

      await AuditLog.create({
        action: 'FAILED_LOGIN',
        actor: voterID,
        actorName: voter.name,
        description: `Failed login attempt #${voter.loginAttempts} for voter ${voterID}`,
        ipAddress: getClientIP(req),
        severity: voter.loginAttempts >= 3 ? 'WARNING' : 'INFO'
      });

      return res.status(401).json({
        message: 'Invalid credentials.',
        attemptsLeft: Math.max(0, 5 - voter.loginAttempts)
      });
    }

    // Reset login attempts on success
    voter.loginAttempts = 0;
    voter.lastLoginIP = getClientIP(req);
    voter.lastLoginAt = new Date();
    await voter.save();

    await AuditLog.create({
      action: voter.role === 'admin' ? 'ADMIN_LOGIN' : 'VOTER_LOGGED_IN',
      actor: voterID,
      actorName: voter.name,
      description: `${voter.role === 'admin' ? 'Admin' : 'Voter'} ${voter.name} logged in`,
      ipAddress: getClientIP(req),
      severity: 'INFO'
    });

    const token = generateToken(voter._id);

    res.json({
      message: 'Login successful',
      token,
      voter: {
        id: voter._id,
        name: voter.name,
        email: voter.email,
        voterID: voter.voterID,
        state: voter.state,
        district: voter.district,
        constituency: voter.constituency,
        photoBase64: voter.photoBase64,
        role: voter.role,
        hasVoted: voter.hasVoted,
        voteReceiptHash: voter.voteReceiptHash,
        fraudScore: voter.fraudScore,
        riskLevel: voter.riskLevel,
        dob: voter.dob,
        guardianName: voter.guardianName,
        gender: voter.gender
      },
      algorithm: `B-tree Index Lookup (O(log n)) with Biometric Data Payload.`
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login.', error: err.message });
  }
};

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
const getMe = async (req, res) => {
  try {
    const voter = await Voter.findById(req.user._id).select('-password -__v');
    if (!voter) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json({ voter });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

module.exports = { register, login, getMe };
