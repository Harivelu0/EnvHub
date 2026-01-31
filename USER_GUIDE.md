# 📘 EnvHub User Guide (v2.0)

This guide is for developers using the **Enterprise Secure** version of EnvHub.

## 1. Installation

### One-Line Install
```bash
# Install v2.0 from Azure Storage
pip install 
```

### Prerequisites
You must have the Azure CLI installed:
- [Install Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli)

## 2. Authentication (New)

We now use your **Corporate Identity** (Azure AD).

1.  **Login to Azure**:
    ```bash
    az login --tenant "e2422382-0770-43ed-9c3c-79c8c4766d46" --scope "api://828f5826-7208-4263-885d-f3146957f978/.default"
    ```
2.  **Initialize the Tool**:
    ```bash
    envhub init
    ```
    *   **Azure Function URL**: Provided by DevOps (e.g. `https://envhub.azurewebsites.net/api`)
    *   **App ID URI**: Provided by DevOps (e.g. `api://<client-id>/.default` or just hit Enter to use default management scope if configured).

## 3. Managing Secrets

All commands (`push`, `pull`, `history`) remain the same, but you no longer need to worry about the "email" check—your identity is verified automatically!

### 📤 Push Secrets
```bash
envhub push -p my-app -s api -e dev -f .env -r "Initial Commit"
```

### 📥 Pull Secrets
```bash
envhub pull -p my-app -s api -e dev
```

### 📜 View History
```bash
envhub history -p my-app -s api -e dev
```

## 4. Troubleshooting
*   **"Authentication Failed"**: Run `az login` again. Your session may have expired.
*   **"Access Denied"**: Ensure your Azure account has access to the Function App.
