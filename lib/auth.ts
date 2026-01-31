
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth-options";

export async function authenticate(req: Request): Promise<string | null> {
    // 1. Check for CLI Token (Bearer via GitHub API validation)
    const authHeader = req.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const response = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'User-Agent': 'EnvHub-Platform'
                }
            });
            if (response.ok) {
                const userData = await response.json();
                return userData.login;
            }
        } catch (e) {
            console.error("CLI Token validation failed", e);
        }
    }

    // 2. Check for Web Session (NextAuth)
    // We can't pass 'req' directly to getServerSession in Route Handlers the same way as Pages.
    // But we can just call it with authOptions.
    const session = await getServerSession(authOptions);

    if (session?.user) {
        // Prefer the username (handle) if available, otherwise fall back to name or email
        // @ts-ignore
        if (session.user.username) {
            // @ts-ignore
            return session.user.username;
        }
        return session.user.name || session.user.email || "UnknownUser";
    }

    return null;
}
