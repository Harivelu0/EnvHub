import { put, list, head } from '@vercel/blob';
import fernet from 'fernet';

// ENVHUB_MASTER_KEY must be a 32-byte base64-encoded string, just like in Python's cryptography.fernet
// If not provided, we warn and use a dummy key (DEV ONLY)
const MASTER_KEY = process.env.ENVHUB_MASTER_KEY || 'no-secret-set-no-secret-set-no-secret-set!!=';

if (!process.env.ENVHUB_MASTER_KEY) {
    console.warn("WARNING: ENVHUB_MASTER_KEY not set. Using insecure dummy key.");
}

const secret = new fernet.Secret(MASTER_KEY);

export class BlobManager {
    private localMode: boolean;

    constructor() {
        // Vercel Blob works with a token. In local development or if BLOB_READ_WRITE_TOKEN is missing,
        // we might need a fallback or just let it fail/warn if we don't have a local solutions.
        // However, @vercel/blob documentation says it works on deployed envs. 
        // For this implementation, we assume we are targeting Vercel deployment.
        this.localMode = false;
    }

    private getPath(project: string, service: string, env: string, version: number) {
        return `${project}/${service}/${env}/v${version}.json`;
    }

    private encryptVars(variables: Record<string, string>): Record<string, string> {
        const encrypted: Record<string, string> = {};
        for (const [key, value] of Object.entries(variables)) {
            const token = new fernet.Token({ secret: secret, ttl: 0 });
            encrypted[key] = token.encode(String(value));
        }
        return encrypted;
    }

    private decryptVars(variables: Record<string, string>): Record<string, string> {
        const decrypted: Record<string, string> = {};
        for (const [key, value] of Object.entries(variables)) {
            try {
                const token = new fernet.Token({ secret: secret, token: value, ttl: 0 });
                decrypted[key] = token.decode();
            } catch (e) {
                // Fallback or keep raw if decryption fails
                console.error(`Failed to decrypt key ${key}:`, e);
                decrypted[key] = value;
            }
        }
        return decrypted;
    }

    async getLatestVersion(project: string, service: string, env: string): Promise<number> {
        const prefix = `${project}/${service}/${env}/`;
        let maxV = 0;

        try {
            // List blobs with the prefix
            const { blobs } = await list({ prefix: prefix, limit: 1000 }); // limit to 1000 revisions checks

            for (const blob of blobs) {
                // format: project/service/env/v1.json
                const parts = blob.pathname.split('/');
                const filename = parts[parts.length - 1]; // v1.json

                if (filename.startsWith('v') && filename.endsWith('.json')) {
                    const vStr = filename.substring(1, filename.length - 5);
                    const v = parseInt(vStr);
                    if (!isNaN(v) && v > maxV) {
                        maxV = v;
                    }
                }
            }
        } catch (e) {
            console.error("Error listing versions:", e);
        }

        return maxV;
    }

    async pushBundle(
        project: string,
        service: string,
        env: string,
        variables: Record<string, string>,
        user: string,
        reason: string
    ): Promise<number> {
        const latestV = await this.getLatestVersion(project, service, env);
        const newV = latestV + 1;

        const secureVars = this.encryptVars(variables);

        const bundle = {
            project,
            service,
            environment: env,
            version: newV,
            created_at: new Date().toISOString(),
            created_by: user,
            change_reason: reason,
            variables: secureVars
        };

        const path = this.getPath(project, service, env, newV);

        // Store in Vercel Blob
        await put(path, JSON.stringify(bundle, null, 2), {
            access: 'public', // Or 'private' depending on need. 'public' writes random unguessable URLs.
            // Ideally strictly private but @vercel/blob public is okay if content is encrypted.
            // 'public' is easier for the hackathon. 
            contentType: 'application/json',
            addRandomSuffix: false // We control the path
        });

        return newV;
    }

    async getBundle(project: string, service: string, env: string, version?: number) {
        let targetVersion = version;
        if (!targetVersion) {
            targetVersion = await this.getLatestVersion(project, service, env);
        }

        if (targetVersion === 0) return null;

        const path = this.getPath(project, service, env, targetVersion);

        try {
            // We can use list to find the url strictly by path, or try to construct it.
            // However, @vercel/blob put returns a URL. If we want to read it back by path,
            // we usually list it. 
            // Since the "pathname" is consistent, let's list specifically that file.
            const { blobs } = await list({ prefix: path, limit: 1 });
            if (blobs.length === 0) return null;

            const blobUrl = blobs[0].url;
            const response = await fetch(blobUrl);
            if (!response.ok) return null;

            const bundle = await response.json();

            if (bundle.variables) {
                bundle.variables = this.decryptVars(bundle.variables);
            }

            return bundle;
        } catch (e) {
            console.error("Error fetching bundle:", e);
            return null;
        }
    }

    async listHistory(project: string, service: string, env: string) {
        const prefix = `${project}/${service}/${env}/`;
        const history = [];

        try {
            const { blobs } = await list({ prefix: prefix });

            for (const blob of blobs) {
                // We need to fetch content to get metadata if we didn't store it in blob metadata
                // But iterating and fetching all is slow.
                // Optimization: Start with basic info from filename.
                // Real optimization: store metadata in a separate index or rely on filename timestamp?
                // The Python version reads the file or metadata involved.
                // Vercel Blob `list` doesn't return custom metadata yet in the basic payload (it might).
                // For now, let's just return list of versions. To match functionality we might have to fetch them.
                // Be careful with performance.

                // Let's assume for Hackathon we just returning version numbers or fetch the top 10.
                // We will try to fetch the JSON for history.

                const response = await fetch(blob.url);
                const data = await response.json();

                history.push({
                    version: data.version,
                    created_at: data.created_at,
                    created_by: data.created_by,
                    change_reason: data.change_reason
                });
            }
        } catch (e) {
            console.error("Error history:", e);
        }

        return history.sort((a, b) => b.version - a.version);
    }
}
