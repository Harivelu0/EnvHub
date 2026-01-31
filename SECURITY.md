# Security Policy (EnvHub)

## 🛡️ Architecture
This platform uses a secure, modern architecture on **Vercel**.

- **Storage**: Vercel Blob (Object Store).
- **Encryption**: **AES-128 (Fernet)**. Secrets are encrypted *inside the application* before they ever leave the server.
    - **Key**: Managed via `ENVHUB_MASTER_KEY` environment variable.
    - **At Rest**: Data in Blob Storage is unreadable without the key.
- **Identity**: GitHub OAuth (via NextAuth.js).

---

## 🔐 1. Authentication (Who are you?)

### Local Development (Mock)
In local mode (`mock_server.py`), security is **relaxed** for development speed.
- **Mechanism**: The backend checks the `x-user-id` header or the email provided in requests.
- **Check**: The code strictly verifies that the email ends in `@aity.dev`.
- **Limitation**: A developer *could* technically spoof this locally, but it prevents accidents.

### Production (Azure) - The "Real" Security
In Production, we **do not** trust the user's input. We trust **Microsoft**.

**You MUST enable "App Service Authentication" in the Azure Portal:**

1.  **The Wall**: When enabled, Azure puts a login screen in front of your API and Frontend.
2.  **Verification**: The user must log in with their corporate Microsoft account (MFA, Password).
3.  **The Handoff**: 
    - Azure verifies the user.
    - Azure adds a header `X-MS-CLIENT-PRINCIPAL-NAME` to the request.
    - Our Backend reads *this* header to know who the user is.

**Result**: It is impossible to access the application without a valid `@aity.dev` corporate account.

---

## 🔒 2. Encryption (Data Protection)

We use **Fernet (Symmetric Encryption)**.

1.  **User pushes secrets**: `DB_PASS=secret`
2.  **Backend Encrypts**: Uses `ENVHUB_MASTER_KEY` to turn `secret` into `gAAAAABk...` (gibberish).
3.  **Storage**: The `gAAAAABk...` string is saved to Vercel Blob Storage.
4.  **Retrieval**: When an authorized user pulls, the Backend decrypts it back to `secret`.

**Critical Rule**:
- **NEVER** lose the `ENVHUB_MASTER_KEY`. If you lose it, all data in Blob Storage implies becomes forever unreadable trash.
- Rotate this key periodically if desired (requires re-encrypting data).

---

## 🐛 Reporting Vulnerabilities
Please report security issues to the internal security team.
