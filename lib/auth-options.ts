
import GithubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { type AuthOptions } from "next-auth";

export const authOptions: AuthOptions = {
    providers: [
        GithubProvider({
            clientId: process.env.GITHUB_ID || "",
            clientSecret: process.env.GITHUB_SECRET || "",
        }),
        // Fallback for Hackathon/Dev (if no GitHub App set up)
        CredentialsProvider({
            name: "Demo User",
            credentials: {},
            async authorize(credentials, req) {
                return { id: "1", name: "DemoUser", email: "demo@aity.dev" };
            }
        })
    ],
    pages: {
        signIn: '/auth/signin',
        error: '/auth/signin', // Show errors on the same page
    },
    callbacks: {
        async session({ session, token }) {
            if (session?.user) {
                // @ts-ignore
                session.user.id = token.sub;
            }
            return session;
        }
    }
};
