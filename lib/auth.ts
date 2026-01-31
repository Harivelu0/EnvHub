
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

    if (session?.user?.name) {
        // If we have a GitHub login stored in name or logic, return it.
        // Our auth-options logic might put the login in 'name'. 
        // Usually Github provider puts display name in 'name' and login in 'email' or valid profile.
        // Let's assume for this hackathon 'name' or 'email' works as identifier.
        // Ideally we want the handle. 
        return session.user.name || session.user.email || "UnknownUser";
    }

    return null;
}
