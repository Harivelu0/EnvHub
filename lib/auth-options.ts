
import GithubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { type AuthOptions } from "next-auth";

export const authOptions: AuthOptions = {
    providers: [
        GithubProvider({
            clientId: process.env.GITHUB_ID || "",
            clientSecret: process.env.GITHUB_SECRET || "",
            authorization: { params: { scope: "read:user user:email read:org" } },
        }),
        // Fallback for Hackathon/Dev (if ENABLE_DEMO_MODE is true)
        ...(process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === "true" ? [
            CredentialsProvider({
                name: "Demo User",
                credentials: {},
                async authorize(credentials, req) {
                    return { id: "1", name: "DemoUser", email: "demo@aity.dev" };
                }
            })
        ] : [])
    ],
    pages: {
        signIn: '/auth/signin',
        error: '/auth/signin', // Show errors on the same page
    },
    callbacks: {
        async signIn({ user, account, profile }) {
            const allowedUsersEnv = process.env.ALLOWED_USERS;
            const allowedOrgsEnv = process.env.ALLOWED_ORGS;

            // If neither variable is set, allow everyone (default behavior)
            if (!allowedUsersEnv && !allowedOrgsEnv) return true;

            // SPECIAL: Always allow the Demo User (Credentials Provider)
            if (account?.provider === "credentials") return true;

            const email = user.email?.toLowerCase();
            // @ts-ignore - 'login' exists on GitHub profile
            const username = profile?.login?.toLowerCase();

            // 1. Check User Whitelist
            if (allowedUsersEnv) {
                const allowedUsers = allowedUsersEnv.split(',').map(u => u.trim().toLowerCase());
                const isUserAllowed =
                    (email && allowedUsers.includes(email)) ||
                    (username && allowedUsers.includes(username));

                if (isUserAllowed) return true;
            }

            // 2. Check Organization Whitelist
            if (allowedOrgsEnv && account?.provider === "github" && account.access_token) {
                const allowedOrgs = allowedOrgsEnv.split(',').map(o => o.trim().toLowerCase());

                try {
                    const res = await fetch("https://api.github.com/user/orgs", {
                        headers: {
                            Authorization: `Bearer ${account.access_token}`,
                            "User-Agent": "EnvHub-Platform",
                            Accept: "application/vnd.github.v3+json"
                        }
                    });

                    if (res.ok) {
                        const orgs = await res.json();
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const userOrgLogins = orgs.map((o: any) => o.login.toLowerCase());

                        const isOrgAllowed = allowedOrgs.some(allowed => userOrgLogins.includes(allowed));

                        if (isOrgAllowed) return true;
                    } else {
                        console.error("Failed to fetch user orgs", res.status);
                    }
                } catch (e) {
                    console.error("Error checking orgs", e);
                }
            }

            console.warn(`Access Denied for user: ${email} (${username}). Not in ALLOWED_USERS or ALLOWED_ORGS.`);
            return false;
        },
        async jwt({ token, profile }) {
            if (profile?.login) {
                token.username = profile.login;
            }
            return token;
        },
        async session({ session, token }) {
            if (session?.user) {
                session.user.id = token.sub;
                session.user.username = token.username;
            }
            return session;
        }
    }
};
