'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import clsx from 'clsx';
import { useSignUp } from '@/hooks/use-sign-up';

export default function SignUpPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const { signUp, isLoading, error, retryAfterSeconds } = useSignUp();
    
    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSuccessMessage(null);

        try {
            await signUp(email, password, confirmPassword, name);
            setSuccessMessage('Dang ky thanh cong. Vui long kiem tra email de xac nhan tai khoan truoc khi dang nhap.');
        } catch {
            // Error state is already handled by the hook.
        }
    }

    return (
        <div className="w-full max-w-md">
            <div className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 text-balance">Create account</h1>
                <p className="text-foreground/60 text-base">Start your English learning journey</p>
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

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
                                Confirm password
                            </label>
                        </div>
                        <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className={clsx("w-full", confirmPassword && password !== confirmPassword ? "border-destructive" : "")}
                        />
                        {confirmPassword && password !== confirmPassword ? (
                            <p className="text-sm text-destructive">Passwords do not match</p>
                        ) : null}
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label htmlFor="name" className="block text-sm font-medium text-foreground">
                                Name
                            </label>
                        </div>
                        <Input
                            id="name"
                            type="text"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full"
                        />
                    </div>

                    <Button type="submit" disabled={isLoading || retryAfterSeconds > 0} className="w-full mt-6 h-11 font-semibold text-base">
                        {isLoading
                            ? "Signing up..."
                            : retryAfterSeconds > 0
                                ? `Please wait ${retryAfterSeconds}s`
                                : "Sign Up"}
                    </Button>
                    {error ? <p className="text-sm text-destructive">{error}</p> : null}
                    {retryAfterSeconds > 0 ? (
                        <p className="text-sm text-amber-600">Too many attempts. Please try again after {retryAfterSeconds} seconds.</p>
                    ) : null}
                    {successMessage ? <p className="text-sm text-green-600">{successMessage}</p> : null}
                </form>

                <div className="mt-6 pt-6 border-t border-border/40">
                    <p className="text-center text-foreground/70 text-sm">
                        Already have an account?{" "}
                        <Link href="/auth" className="text-primary hover:text-primary/80 transition-colors font-semibold">
                            Sign in
                        </Link>
                    </p>
                </div>
            </Card>
        </div>
    )
}