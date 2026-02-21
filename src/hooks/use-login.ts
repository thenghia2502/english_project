import { useState } from 'react';
import { useRouter } from 'next/navigation';

export const useLogin = () => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const login = async (email: string, password: string) => {
        try {
            setIsLoading(true);
            setError(null);
            
            const response = await fetch('/api/proxy/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result?.error || 'Failed to sign up');
            }
            
            console.log(result);
            router.push('/curriculum');
            
            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error during sign up';
            setError(errorMessage);
            console.error('Error during sign up:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        login,
        isLoading,
        error
    };
};
