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

### 3. Configure Environment Variables
Set the following Environment Variables in your Vercel Project Settings:

| Variable | Description |
|----------|-------------|
| `BLOB_READ_WRITE_TOKEN` | **Required**. Create a Vercel Blob store and copy the generic Read/Write token. This is where your secrets live. |
| `ENVHUB_MASTER_KEY` | **Required**. 32-byte Fernet Key for encryption. Run `python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"` to generate one. |
| `GITHUB_ID` | **Required**. GitHub OAuth App Client ID. |
| `GITHUB_SECRET` | **Required**. GitHub OAuth App Secret. |
| `NEXTAUTH_SECRET` | **Required**. Any random string (e.g. `openssl rand -base64 32`). |
| `NEXTAUTH_URL` | Set to your Vercel URL (e.g. `https://envhub.your-org.com`). |
| `ALLOWED_ORGS` | **Recommended**. Comma-separated list of GitHub Organizations allowed to login (e.g. `MyCompany,OpenAI`). |
| `ALLOWED_USERS` | (Optional) Comma-separated list of specific GitHub emails/users allowed. |
| `NEXT_PUBLIC_ENABLE_DEMO_MODE` | Set to `false` (default) for production. Set to `true` only if you want a public sandbox. |

---

## 🛠️ CLI Installation

Once your instance is deployed, you don't need to distribute binaries manually.

1.  Log in to your **EnvHub Dashboard**.
2.  Click the **"Install CLI"** widget in the sidebar.
3.  Copy and run the `pip install` command:

```bash
pip install https://envhub.your-org.com/cli/envhub_cli-2.0.2-py3-none-any.whl
```

### authenticate
```bash
# Point the CLI to your private instance
export ENVHUB_URL=https://envhub.your-org.com

# Log in
envhub login
```

---

## 🛡️ Security Model

- **Authentication**: Usage is gated by GitHub OAuth. You control who gets in via `ALLOWED_ORGS`.
- **Isolation**: Each deployment uses its own Vercel Blob Store. Your data is physically separated from others.
- **Audit**: Every action (Push/Pull) is logged with the user's GitHub Handle.

## License
MIT