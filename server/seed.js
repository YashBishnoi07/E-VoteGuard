require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker');
const crypto = require('crypto');

const Voter = require('./models/Voter');
const Vote = require('./models/Vote');
const FraudLog = require('./models/FraudLog');
const AuditLog = require('./models/AuditLog');

const CANDIDATES = [
  { id: 1, name: 'Arjun Sharma', party: 'Progressive Alliance' },
  { id: 2, name: 'Priya Menon', party: "People's Front" },
  { id: 3, name: 'Ravi Kumar', party: 'Unity Party' },
  { id: 4, name: 'Sneha Patel', party: 'Reform Coalition' }
];

const INDIAN_STATES = [
  'Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Gujarat',
  'Rajasthan', 'Uttar Pradesh', 'West Bengal', 'Kerala', 'Punjab',
  'Haryana', 'Madhya Pradesh', 'Bihar', 'Odisha', 'Telangana'
];

const INDIAN_FIRST_NAMES = [
  'Arjun', 'Priya', 'Ravi', 'Sneha', 'Amit', 'Kavya', 'Rohit', 'Anjali',
  'Vikram', 'Deepa', 'Suresh', 'Meera', 'Kiran', 'Pooja', 'Arun', 'Sunita',
  'Rajesh', 'Nisha', 'Sanjay', 'Rekha', 'Manish', 'Swati', 'Nikhil', 'Pritha',
  'Gaurav', 'Shweta', 'Rahul', 'Divya', 'Sachin', 'Lakshmi', 'Vivek', 'Asha',
  'Kunal', 'Bhavna', 'Mohit', 'Geeta', 'Sumit', 'Radha', 'Tarun', 'Usha'
];

const INDIAN_LAST_NAMES = [
  'Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Mehta', 'Joshi', 'Nair',
  'Menon', 'Reddy', 'Rao', 'Iyer', 'Verma', 'Malhotra', 'Kapoor', 'Dubey',
  'Mishra', 'Tiwari', 'Shah', 'Desai', 'Pillai', 'Bose', 'Mukherjee', 'Chatterjee',
  'Das', 'Roy', 'Ghosh', 'Sinha', 'Pandey', 'Yadav', 'Chowdhury', 'Saxena'
];

function generateVoterHash(voterID, email) {
  const salt = process.env.SALT || 'evoting_salt_phrase_2024';
  return crypto.createHash('sha256').update(voterID + email + salt).digest('hex');
}

function generateVoteReceipt(voterHash, candidateId, timestamp) {
  const nonce = crypto.randomBytes(16).toString('hex');
  return crypto.createHash('sha256').update(voterHash + String(candidateId) + String(timestamp) + nonce).digest('hex');
}

function randomFromArray(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateVoterID() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return Array.from({ length: 3 }, () => letters[Math.floor(Math.random() * letters.length)]).join('') +
    Array.from({ length: 7 }, () => Math.floor(Math.random() * 10)).join('');
}

function generateAadhaar() {
  return Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('');
}

function randomDOB(minAge = 18, maxAge = 75) {
  const today = new Date();
  const year = today.getFullYear() - Math.floor(Math.random() * (maxAge - minAge) + minAge);
  const month = Math.floor(Math.random() * 12);
  const day = Math.floor(Math.random() * 28) + 1;
  return new Date(year, month, day);
}

async function seed() {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/evoting';
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Voter.deleteMany({});
    await Vote.deleteMany({});
    await FraudLog.deleteMany({});
    await AuditLog.deleteMany({});
    console.log('🗑️  Cleared existing data');

    const hashedAdminPass = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123456', 10);

    // Create Admin
    const adminVoterID = 'ADMIN0000001';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@evoting.gov.in';
    const adminFingerprint = generateVoterHash(adminVoterID, adminEmail);

    const admin = new Voter({
      name: 'Election Commission Admin',
      email: adminEmail,
      voterID: adminVoterID,
      aadhaarID: '000000000001',
      dob: new Date('1980-01-01'),
      state: 'Delhi',
      password: hashedAdminPass,
      hashedFingerprint: adminFingerprint,
      role: 'admin',
      registeredIP: '127.0.0.1'
    });
    await admin.save();
    console.log(`👤 Admin created: ${adminEmail} / ${process.env.ADMIN_PASSWORD || 'Admin@123456'}`);

    const createdVoters = [];
    const usedVoterIDs = new Set([adminVoterID]);
    const usedEmails = new Set([adminEmail]);
    const usedAadhaars = new Set(['000000000001']);

    // ============================================
    // 80 normal voters — each votes exactly once
    // ============================================
    console.log('\n📋 Creating 80 normal voters...');
    const normalIPs = Array.from({ length: 40 }, (_, i) => `192.168.1.${i + 10}`);

    for (let i = 0; i < 80; i++) {
      let voterID, email, aadhaarID;
      do { voterID = generateVoterID(); } while (usedVoterIDs.has(voterID));
      do {
        const fn = randomFromArray(INDIAN_FIRST_NAMES);
        const ln = randomFromArray(INDIAN_LAST_NAMES);
        email = `${fn.toLowerCase()}.${ln.toLowerCase()}${Math.floor(Math.random() * 999)}@gmail.com`;
      } while (usedEmails.has(email));
      do { aadhaarID = generateAadhaar(); } while (usedAadhaars.has(aadhaarID));

      usedVoterIDs.add(voterID);
      usedEmails.add(email);
      usedAadhaars.add(aadhaarID);

      const name = `${randomFromArray(INDIAN_FIRST_NAMES)} ${randomFromArray(INDIAN_LAST_NAMES)}`;
      const state = randomFromArray(INDIAN_STATES);
      const password = await bcrypt.hash('Password@123', 10);
      const hashedFingerprint = generateVoterHash(voterID, email);
      const ip = randomFromArray(normalIPs);
      const deviceFP = crypto.createHash('sha256').update(ip + voterID).digest('hex').substring(0, 32);

      const voter = new Voter({
        name, email, voterID, aadhaarID,
        dob: randomDOB(18, 70),
        state, password, hashedFingerprint,
        role: 'voter',
        registeredIP: ip,
        deviceFingerprints: [deviceFP],
        fraudScore: Math.floor(Math.random() * 20),
        riskLevel: 'LOW'
      });

      await voter.save();
      createdVoters.push({ voter, ip, deviceFP });
    }
    console.log('✅ 80 normal voters created');

    // Cast votes for normal voters
    const candidateWeights = [35, 28, 22, 15]; // vote distribution weights
    let voteTime = new Date(Date.now() - 8 * 60 * 60 * 1000); // Start 8 hours ago

    for (const { voter, ip, deviceFP } of createdVoters) {
      const rnd = Math.random() * 100;
      let candidateId = 1;
      let cumulative = 0;
      for (let c = 0; c < CANDIDATES.length; c++) {
        cumulative += candidateWeights[c];
        if (rnd <= cumulative) { candidateId = CANDIDATES[c].id; break; }
      }

      const candidate = CANDIDATES.find(c => c.id === candidateId);
      voteTime = new Date(voteTime.getTime() + Math.floor(Math.random() * 5 * 60 * 1000));

      const receiptHash = generateVoteReceipt(voter.hashedFingerprint, candidateId, voteTime.getTime());

      await Vote.create({
        voterHash: voter.hashedFingerprint,
        voterID: voter.voterID,
        candidateId,
        candidateName: candidate.name,
        timestamp: voteTime,
        ipAddress: ip,
        deviceFingerprint: deviceFP,
        receiptHash,
        processingTimeMs: Math.floor(Math.random() * 400 + 100)
      });

      voter.hasVoted = true;
      voter.voteReceiptHash = receiptHash;
      await Voter.findByIdAndUpdate(voter._id, { hasVoted: true, voteReceiptHash: receiptHash });
    }
    console.log('✅ 80 votes cast for normal voters');

    // ============================================
    // 10 duplicate-attempt voters
    // ============================================
    console.log('\n🚨 Creating 10 duplicate-attempt voters...');
    for (let i = 0; i < 10; i++) {
      let voterID, email, aadhaarID;
      do { voterID = generateVoterID(); } while (usedVoterIDs.has(voterID));
      do {
        email = `fraud.dup${i}@tempmail.com`;
      } while (usedEmails.has(email));
      do { aadhaarID = generateAadhaar(); } while (usedAadhaars.has(aadhaarID));

      usedVoterIDs.add(voterID); usedEmails.add(email); usedAadhaars.add(aadhaarID);

      const name = `${randomFromArray(INDIAN_FIRST_NAMES)} ${randomFromArray(INDIAN_LAST_NAMES)}`;
      const state = randomFromArray(INDIAN_STATES);
      const password = await bcrypt.hash('Password@123', 10);
      const hashedFingerprint = generateVoterHash(voterID, email);
      const ip = `10.0.${i}.100`;

      const voter = await Voter.create({
        name, email, voterID, aadhaarID,
        dob: randomDOB(18, 60),
        state, password, hashedFingerprint,
        role: 'voter',
        registeredIP: ip,
        hasVoted: true,
        fraudScore: 85,
        riskLevel: 'HIGH',
        loginAttempts: 3
      });

      // They voted once
      const candidateId = CANDIDATES[Math.floor(Math.random() * CANDIDATES.length)].id;
      const candidate = CANDIDATES.find(c => c.id === candidateId);
      const rcptHash = generateVoteReceipt(hashedFingerprint, candidateId, Date.now() - i * 1000);
      await Vote.create({
        voterHash: hashedFingerprint, voterID, candidateId, candidateName: candidate.name,
        timestamp: new Date(Date.now() - i * 60000), ipAddress: ip,
        deviceFingerprint: crypto.randomBytes(16).toString('hex'),
        receiptHash: rcptHash, processingTimeMs: 120
      });
      await Voter.findByIdAndUpdate(voter._id, { voteReceiptHash: rcptHash });

      // Log the fraud attempt
      await FraudLog.create({
        voterID, voterName: name,
        fraudType: 'DUPLICATE_VOTE',
        score: 100, riskLevel: 'HIGH',
        reason: 'Voter attempted to cast a second vote. Blocked by hash verification.',
        ipAddress: ip
      });

      await AuditLog.create({
        action: 'FRAUD_DETECTED', actor: voterID, actorName: name,
        description: `Duplicate vote attempt detected for ${name} (${voterID})`,
        ipAddress: ip, severity: 'CRITICAL'
      });
    }
    console.log('✅ 10 duplicate-attempt voters created');

    // ============================================
    // 5 cluster fraud voters (same IP)
    // ============================================
    console.log('\n🔗 Creating 5 cluster fraud voters (shared IP)...');
    const clusterIP = '172.16.0.55'; // Shared fraudulent IP
    const clusterDevice = crypto.createHash('sha256').update(clusterIP).digest('hex').substring(0, 32);

    for (let i = 0; i < 5; i++) {
      let voterID, email, aadhaarID;
      do { voterID = generateVoterID(); } while (usedVoterIDs.has(voterID));
      do { email = `cluster.fraud${i}@proxy.net`; } while (usedEmails.has(email));
      do { aadhaarID = generateAadhaar(); } while (usedAadhaars.has(aadhaarID));

      usedVoterIDs.add(voterID); usedEmails.add(email); usedAadhaars.add(aadhaarID);

      const name = `${randomFromArray(INDIAN_FIRST_NAMES)} ${randomFromArray(INDIAN_LAST_NAMES)}`;
      const state = randomFromArray(INDIAN_STATES);
      const password = await bcrypt.hash('Password@123', 10);
      const hashedFingerprint = generateVoterHash(voterID, email);

      const voter = await Voter.create({
        name, email, voterID, aadhaarID,
        dob: randomDOB(18, 50), state, password, hashedFingerprint,
        role: 'voter', registeredIP: clusterIP,
        hasVoted: true, fraudScore: 75, riskLevel: 'HIGH',
        deviceFingerprints: [clusterDevice]
      });

      const candidateId = 1; // All cluster voters vote for candidate 1
      const candidate = CANDIDATES[0];
      const rcptHash = generateVoteReceipt(hashedFingerprint, candidateId, Date.now() - i * 500);
      await Vote.create({
        voterHash: hashedFingerprint, voterID, candidateId, candidateName: candidate.name,
        timestamp: new Date(Date.now() - i * 30000), ipAddress: clusterIP,
        deviceFingerprint: clusterDevice, receiptHash: rcptHash, processingTimeMs: 80
      });
      await Voter.findByIdAndUpdate(voter._id, { voteReceiptHash: rcptHash });

      await FraudLog.create({
        voterID, voterName: name,
        fraudType: 'CLUSTER_FRAUD',
        score: 75, riskLevel: 'HIGH',
        reason: `Part of fraud cluster: 5 voters sharing IP ${clusterIP} and same device fingerprint`,
        ipAddress: clusterIP, deviceFingerprint: clusterDevice
      });
    }
    console.log('✅ 5 cluster fraud voters created');

    // ============================================
    // 5 bot-pattern voters (vote in <3 seconds)
    // ============================================
    console.log('\n🤖 Creating 5 bot-pattern voters...');
    for (let i = 0; i < 5; i++) {
      let voterID, email, aadhaarID;
      do { voterID = generateVoterID(); } while (usedVoterIDs.has(voterID));
      do { email = `bot.voter${i}@automation.io`; } while (usedEmails.has(email));
      do { aadhaarID = generateAadhaar(); } while (usedAadhaars.has(aadhaarID));

      usedVoterIDs.add(voterID); usedEmails.add(email); usedAadhaars.add(aadhaarID);

      const name = `Bot Account ${i + 1}`;
      const state = randomFromArray(INDIAN_STATES);
      const password = await bcrypt.hash('Password@123', 10);
      const hashedFingerprint = generateVoterHash(voterID, email);
      const ip = `10.10.${i}.1`;

      const voter = await Voter.create({
        name, email, voterID, aadhaarID,
        dob: randomDOB(18, 40), state, password, hashedFingerprint,
        role: 'voter', registeredIP: ip,
        hasVoted: true, fraudScore: 90, riskLevel: 'HIGH',
        isBlocked: true,
        deviceFingerprints: []
      });

      const candidateId = CANDIDATES[Math.floor(Math.random() * CANDIDATES.length)].id;
      const candidate = CANDIDATES.find(c => c.id === candidateId);
      const rcptHash = generateVoteReceipt(hashedFingerprint, candidateId, Date.now() - i * 1000);

      await Vote.create({
        voterHash: hashedFingerprint, voterID, candidateId, candidateName: candidate.name,
        timestamp: new Date(Date.now() - i * 2000), ipAddress: ip,
        deviceFingerprint: 'headless-chrome-bot-fingerprint-' + i,
        receiptHash: rcptHash, processingTimeMs: 2 // 2ms = bot-speed
      });
      await Voter.findByIdAndUpdate(voter._id, { voteReceiptHash: rcptHash });

      await FraudLog.create({
        voterID, voterName: name,
        fraudType: 'BOT_PATTERN',
        score: 90, riskLevel: 'HIGH',
        reason: 'Vote submitted in < 3 seconds. Headless browser detected. Auto-blocked.',
        ipAddress: ip, deviceFingerprint: 'headless-chrome-bot-fingerprint-' + i
      });

      await FraudLog.create({
        voterID, voterName: name,
        fraudType: 'BURST_VOTING',
        score: 85, riskLevel: 'HIGH',
        reason: 'Bot activity detected: multiple rapid requests from same endpoint',
        ipAddress: ip
      });

      await AuditLog.create({
        action: 'VOTER_BLOCKED', actor: 'SYSTEM', actorName: 'Fraud Detection Engine',
        target: voterID,
        description: `Bot voter auto-blocked: ${name} (${voterID}) — vote in <3s, headless browser`,
        severity: 'CRITICAL'
      });
    }
    console.log('✅ 5 bot-pattern voters created and blocked');

    // Final counts
    const totalVoters = await Voter.countDocuments({ role: 'voter' });
    const totalVotes = await Vote.countDocuments();
    const totalFraud = await FraudLog.countDocuments();

    console.log('\n🎉 ===== SEEDING COMPLETE =====');
    console.log(`👥 Total Voters: ${totalVoters}`);
    console.log(`🗳️  Total Votes: ${totalVotes}`);
    console.log(`🚨 Fraud Logs: ${totalFraud}`);
    console.log('\n🔑 Admin Credentials:');
    console.log(`   VoterID: ${adminVoterID}`);
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${process.env.ADMIN_PASSWORD || 'Admin@123456'}`);
    console.log('\n🔑 Sample Voter (Password: Password@123)');
    console.log('   Any voter email from the generated list');
    console.log('====================================\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    await mongoose.connection.close();
    process.exit(1);
  }
}

seed();
