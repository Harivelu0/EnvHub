# EnvHub

**Secure, Versioned Environment Variable Management for Teams.**

EnvHub helps you manage secrets across projects, services, and environments with a Git-like workflow. It includes a beautiful web dashboard and a powerful CLI.

![EnvHub Dashboard](/screenshot.png)

## Features

- 🔒 **Secure Storage**: Secrets are encrypted at rest using Fernet (AES-128).
- 📜 **Version History**: Track every change (who changed what, when, and why).
- 🏢 **Organization-Ready**: Gate access to your GitHub Organization (`ALLOWED_ORGS`).
- 💻 **Cross-Platform CLI**: Python-based CLI for Windows, Mac, and Linux.
- ☁️ **Serverless**: Built on Next.js and Vercel Blob (No database required).

---

## 🚀 How to Deploy (For Your Organization)

You can deploy your own private instance of EnvHub in minutes.

### 1. Prerequisites
- A **GitHub Account** (or Organization).
- A **Vercel Account**.

### 2. Deploy to Vercel
Clone this repository and deploy it to Vercel.

```bash
git clone https://github.com/your-username/EnvHub.git
cd EnvHub
vercel deploy
```

### 3. Configure Environment Variables (Critical for Security)
To ensure your instance is **100% Secure** and private to your organization, you must set these variables in Vercel:

#### 🔐 Authentication & Access
| Variable | Description |
|----------|-------------|
| `GITHUB_ID` | **Required**. Create a [New OAuth App](https://github.com/settings/developers) on GitHub. This allows users to "Login with GitHub". |
| `GITHUB_SECRET` | **Required**. The secret key from your GitHub OAuth App. |
| `ALLOWED_ORGS` | **CRITICAL**. Comma-separated list of GitHub Organizations (e.g., `MyCompany,OpenAI`). <br>✅ **Security Guarantee**: Only users who are public members of these organizations can log in. Everyone else is rejected. |
| `ALLOWED_USERS` | (Optional) Restrict access to specific GitHub handles (e.g., `octocat`). |

#### 🗄️ Data Ownership
| Variable | Description |
|----------|-------------|
| `BLOB_READ_WRITE_TOKEN` | **Required**. This token connects to **YOUR** Vercel Blob store. <br>✅ **Privacy Guarantee**: All secrets are stored in your own bucket. We do not have access to it. |
| `ENVHUB_MASTER_KEY` | **Required**. 32-byte Fernet Key. <br>✅ **Encryption**: All variables are encrypted *before* they are saved. Even the database admin cannot read them without this key. |

#### ⚙️ Standard Config
| Variable | Value |
|----------|-------|
| `NEXTAUTH_SECRET` | A random string (run `openssl rand -base64 32`). |
| `NEXTAUTH_URL` | Your Vercel deployment URL (e.g., `https://envhub-mycompany.vercel.app`). |
| `NEXT_PUBLIC_ENABLE_DEMO_MODE` | Set to `false` (default). **Only set to `true` for public demos (Sandboxed).** |

---

## 4. Finalizing Production (GitHub App)
Since you developed locally on `localhost:3000`, you must update your GitHub App to point to your new Production URL.

1.  Go to [GitHub Developer Settings](https://github.com/settings/developers).
2.  Click on your **OAuth App**.
3.  **Update Homepage URL**:
    *   Change `http://localhost:3000` to `https://your-project.vercel.app`
4.  **Update Authorization Callback URL**:
    *   Change `http://localhost:3000/api/auth/callback/github` to `https://your-project.vercel.app/api/auth/callback/github`
5.  Click **Update Application**.

---

## 🛡️ Security Architecture

We take security seriously. Here is how EnvHub protects your infrastructure:

1.  **Zero-Knowledge Architecture**: You own the infrastructure. You deploy it to *your* Vercel account, using *your* database. We (the creators) have zero access to your data.
2.  **Encryption at Rest**: We use **Fernet (AES-128)** symmetric encryption. Secrets are encrypted before writing to storage.
3.  **Strict Isolation**: By setting `ALLOWED_ORGS`, you enforce a hardware-level gate. If a user is not in your GitHub Org, they cannot even see the dashboard.
4.  **Audit Logs**: Every change is versioned and attributed to a GitHub User Handle. You always know who changed `DATABASE_URL` and when.

## License
MIT