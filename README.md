# 🔐 EnvHub (Hackathon Edition)

**Secure, Versioned Environment Variable Management for Vercel.**

## 🏆 GitHub Copilot CLI Challenge Submission

EnvHub allows your team to manage application secrets using encryption and versioning—without the complexity of HashiCorp Vault. 
**This version is optimized for the Hackathon, running entirely on Vercel (Next.js + Vercel Blob).**

### 🚀 Architecture (Unified Monorepo)
The `platform-web` directory is a **Full Stack Next.js Application**.
- **Frontend**: React-based UI (Dashboard) for browsing and managing environments.
- **Backend**: API Routes (`/api`) handling encryption, storage, and CLI requests.
- **CLI**: Python tool that talks to the Next.js API.
- **Storage**: Vercel Blob (Encrypted JSON).
- **Authentication**: GitHub OAuth (NextAuth.js) for Web + CLI.

### 🛠️ Quick Start

#### 1. Start the Backend
```bash
cd platform-web
npm install
npm run dev
# Running on http://localhost:3000
```

#### 2. Install the CLI
```bash
cd cli
pip install -e .
```

#### 3. Initialize & Use
```bash
# Initialize (Points to local Next.js by default)
envhub init

# Push your .env file
envhub push -p my-app -s backend -e dev -f .env -r "Initial hackathon commit"

# Pull it back
envhub pull -p my-app -s backend -e dev
```

### 🔒 Security
All secrets are **encrypted locally** (or at the edge) before reaching storage. The storage backend only sees encrypted text. 
User identity is simulated via `x-user-id` header for this demo.