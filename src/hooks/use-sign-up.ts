'use client';

import { useEffect, useState } from 'react';

export const useSignUp = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [retryAfterSeconds, setRetryAfterSeconds] = useState(0);

    useEffect(() => {
        if (retryAfterSeconds <= 0) {
            return;
        }

        const timer = window.setInterval(() => {
            setRetryAfterSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
        }, 1000);

        return () => {
            window.clearInterval(timer);
        };
    }, [retryAfterSeconds]);

    const signUp = async (email: string, password: string, confirmPassword?: string, name?: string) => {
        try {
            if (retryAfterSeconds > 0) {
                throw new Error(`Too many requests. Please wait ${retryAfterSeconds}s before trying again.`);
            }

            if (confirmPassword !== undefined && password !== confirmPassword) {
                throw new Error('Passwords do not match');
            }

            setIsLoading(true);
            setError(null);

            const response = await fetch('/api/proxy/auth/sign-up', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name }),
            });

            const result = await response.json();

            if (!response.ok) {
                if (response.status === 429) {
                    const retryHeader = response.headers.get('retry-after');
                    const retryFromHeader = retryHeader ? Number(retryHeader) : NaN;
                    const retryFromBody = Number(result?.retryAfterSeconds);
                    const cooldown = Number.isFinite(retryFromHeader)
                        ? retryFromHeader
                        : Number.isFinite(retryFromBody)
                            ? retryFromBody
                            : 60;
                    setRetryAfterSeconds(cooldown);
                }

                const messageFromArray = Array.isArray(result?.message)
                    ? result.message.join(', ')
                    : null;
                throw new Error(
                    result?.error ||
                    result?.message ||
                    result?.details ||
                    messageFromArray ||
                    'Failed to sign up'
                );
            }

            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error during sign up';
            setError(errorMessage);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        signUp,
        isLoading,
        error,
        retryAfterSeconds,
    };
};