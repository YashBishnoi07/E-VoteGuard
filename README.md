# 🗳️ VoteGuard — E-Voting Fraud Detection System

A full-stack electronic voting system with **5 DAA algorithms** for real-time fraud detection.

[![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Node.js%20%7C%20MongoDB-6366f1)](#)
[![Algorithms](https://img.shields.io/badge/Algorithms-SHA256%20%7C%20BFS%20%7C%20DP%20%7C%20Greedy-10b981)](#)

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB running locally (or use Docker)
- npm

### 1. Clone & Setup Server

```bash
cd server
npm install
cp .env.example .env
# Edit .env with your MongoDB URI
```

### 2. Setup Client

```bash
cd client
npm install
cp .env.example .env  # or just use defaults
```

### 3. Start MongoDB

```bash
# Option A: Local MongoDB
mongod

# Option B: Docker
docker-compose up -d mongodb
```

### 4. Seed the Database

```bash
cd server
npm run seed
```

This creates:
- 1 Admin account
- 80 normal voters (each votes once)
- 10 duplicate-vote attempt fraudsters
- 5 cluster fraud voters (shared IP)
- 5 bot-pattern voters (auto-blocked)

### 5. Start the Server

```bash
cd server
npm run dev
# Server runs on http://localhost:5000
```

### 6. Start the Client

```bash
cd client
npm run dev
# Client runs on http://localhost:5173
```

---

## 🔑 Demo Credentials

| Role | Voter ID | Password |
|------|----------|----------|
| **Admin** | `ADMIN0000001` | `Admin@123456` |
| **Voter** | Any generated voter ID | `Password@123` |

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new voter |
| POST | `/api/auth/login` | Login (voter/admin) |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/vote/cast` | Cast a vote |
| GET | `/api/vote/results` | Live vote counts |
| GET | `/api/vote/verify/:hash` | Verify vote receipt |
| GET | `/api/vote/candidates` | Get candidate list |
| GET | `/api/fraud/logs` | All fraud events (admin) |
| GET | `/api/fraud/flagged` | Flagged voters (admin) |
| GET | `/api/fraud/score/:voterId` | Fraud score (admin) |
| POST | `/api/fraud/block/:voterId` | Block voter (admin) |
| GET | `/api/fraud/clusters` | Fraud clusters (admin) |
| GET | `/api/admin/stats` | Dashboard stats |
| GET | `/api/admin/audit` | Audit log |
| GET | `/api/admin/complexity` | Algorithm complexity |

---

## 🧮 DAA Algorithms

### 1. SHA-256 Hashing — `hashingEngine.js`
- **Purpose**: Duplicate vote detection, identity fingerprinting
- **Time**: O(1) average lookup via hash table
- **Space**: O(n) for hash set

### 2. Merge Sort + Sliding Window — `patternDetection.js`
- **Purpose**: Burst voting detection, frequency analysis
- **Time**: O(n log n) sort + O(n) window scan
- **Space**: O(n)

### 3. BFS/DFS Graph Traversal — `graphFraudDetector.js`
- **Purpose**: Fraud ring detection (voters sharing same IP/device)
- **Time**: O(V + E) where V=voters, E=shared connections
- **Space**: O(V + E)

### 4. Greedy Fraud Scoring — `greedyValidator.js`
- **Purpose**: Real-time multi-signal risk assessment
- **Time**: O(k) where k = number of signals (constant)
- **Space**: O(1)

### 5. DP Anomaly Scoring — `anomalyScoring.js`
- **Purpose**: Longest Suspicious Sequence in voter action logs
- **Time**: O(n) basic, O(n²) full analysis
- **Space**: O(n) for DP table

---

## 🏗️ Project Structure

```
evoting-fraud-detection/
├── server/
│   ├── models/           # Mongoose models
│   ├── routes/           # Express routes
│   ├── controllers/      # Business logic
│   ├── algorithms/       # DAA implementations
│   ├── middleware/        # Auth + rate limiting
│   ├── server.js         # Entry point
│   └── seed.js           # Database seeder
└── client/
    └── src/
        ├── pages/        # React pages
        ├── components/   # Reusable UI
        ├── context/      # Auth context
        ├── hooks/        # Socket.IO hook
        └── api/          # Axios config
```

---

## ⚡ Real-Time Events (Socket.IO)

| Event | Trigger | Payload |
|-------|---------|---------|
| `vote:cast` | New vote submitted | `{ candidateId, voteCounts }` |
| `fraud:detected` | Fraud algorithm flags voter | `{ voterID, fraudType, riskLevel, score }` |
| `voter:blocked` | Voter blocked by admin/system | `{ voterID, reason }` |

---

## 🐳 Docker Setup

```bash
# Start everything with Docker
docker-compose up -d

# Then seed:
docker-compose exec server npm run seed
```

---

## 🛡️ Security Features

- **JWT Authentication** — 24h token expiry
- **bcrypt Password Hashing** — 10 salt rounds
- **Rate Limiting** — Auth: 20/15min, Vote: 5/min
- **SHA-256 Fingerprinting** — Unique per voter
- **Auto-block** — Fraud score ≥ 60 triggers automatic block
- **Audit Trail** — Every action logged immutably
