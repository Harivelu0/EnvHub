"use client";

import { signIn } from "next-auth/react";
import { Lock, Github, Terminal } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginContent() {
    const searchParams = useSearchParams();
    const error = searchParams?.get("error");

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex flex-col items-center justify-center p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-1/2 -left-1/2 w-[1000px] h-[1000px] bg-blue-500/10 rounded-full blur-3xl opacity-50"></div>
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-purple-500/10 rounded-full blur-3xl opacity-30"></div>
            </div>

            <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 relative z-10 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex flex-col items-center text-center space-y-6">
                    <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-4 rounded-2xl shadow-lg relative group">
                        <div className="absolute inset-0 bg-white/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <Lock className="text-white w-10 h-10 relative z-10" />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold text-white tracking-tight">Welcome to EnvHub</h1>
                        <p className="text-gray-400 text-sm">
                            Secure, versioned environment variable management for modern teams.
                        </p>
                    </div>

                    {error && (
                        <div className="w-full bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm flex items-center justify-center animate-in slide-in-from-top-2">
                            {error === "OAuthSignin" && "Error connecting to GitHub. Check Client ID."}
                            {error === "OAuthCallback" && "Error during GitHub callback."}
                            {!["OAuthSignin", "OAuthCallback"].includes(error) && "Authentication failed"}
                        </div>
                    )}

                    <div className="w-full space-y-3 pt-4">
                        <button
                            onClick={() => signIn("github", { callbackUrl: "/" })}
                            className="w-full flex items-center justify-center space-x-3 bg-white text-black hover:bg-gray-100 font-semibold py-3.5 px-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Github className="w-5 h-5" />
                            <span>Continue with GitHub</span>
                        </button>

                        {process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === "true" && (
                            <button
                                onClick={() => signIn("credentials", { callbackUrl: "/" })}
                                className="w-full flex items-center justify-center space-x-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium py-3.5 px-4 rounded-xl transition-all hover:border-white/20"
                            >
                                <Terminal className="w-5 h-5 text-gray-400" />
                                <span>Demo Access (No Account)</span>
                            </button>
                        )}
                    </div>

                    <div className="pt-6 text-xs text-gray-500 border-t border-white/5 w-full">
                        <p>By continuing, you agree to secure handling of your secrets.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LoginScreen() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black" />}>
            <LoginContent />
        </Suspense>
    )
}
