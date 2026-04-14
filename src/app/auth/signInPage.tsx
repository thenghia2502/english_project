'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLogin } from "@/hooks/use-login";
import { supabase } from '@/lib/supabase-client';
const domain = process.env.NODE_ENV === "production" ? process.env.DOMAIN_PROD : process.env.DOMAIN_DEV;
export default function SignInPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [oauthError, setOauthError] = useState<string | null>(null);
    const { login, isLoading, error } = useLogin();
    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        await login(email, password);
    }

    const handleLogin = async () => {
        if (!supabase) {
            setOauthError('Google login is not configured yet. Please contact admin.');
            return;
        }

        setOauthError(null);
        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${domain}/?tab=lessons`,
                queryParams: {
                    prompt: "select_account", // 🔥 fix Edge toujours
                },
            },
        });
    };
    
    return (
        <div className="w-full max-w-md">
            <div className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 text-balance">Welcome Back</h1>
                <p className="text-foreground/60 text-base">Continue your English learning journey</p>
            </div>

            <Card className="p-8 border border-border/50 shadow-lg">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <label htmlFor="email" className="block text-sm font-medium text-foreground">
                            Email Address
                        </label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label htmlFor="password" className="block text-sm font-medium text-foreground">
                                Password
                            </label>
                            <a href="#" className="text-sm text-primary hover:text-primary/80 transition-colors font-medium">
                                Forgot?
                            </a>
                        </div>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full"
                        />
                    </div>

                    <Button type="submit" disabled={isLoading} className="w-full mt-6 h-11 font-semibold text-base">
                        {isLoading ? "Logging in..." : "Log In"}
                    </Button>
                </form>

                <div className="mt-6 pt-6 border-t border-border/40">
                    <p className="text-center text-foreground/70 text-sm">
                        Don't have an account?{" "}
                        <Link href="/auth?auth=sign-up" className="text-primary hover:text-primary/80 transition-colors font-semibold">
                            Sign up
                        </Link>
                    </p>
                </div>
            </Card>

            <div className="mt-8 space-y-3">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border/40"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-background text-foreground/60">or continue with</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    <Button variant="outline" className="w-full h-10 bg-transparent" onClick={handleLogin}>
                        Google
                    </Button>
                </div>
                {oauthError ? <p className="text-sm text-destructive text-center">{oauthError}</p> : null}
            </div>
        </div>
    )
}