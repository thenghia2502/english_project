'use client';

import { useRouter } from "next/navigation";

export default function SignUpPage() {
    const router = useRouter();
    const handleSubmit = async (event: React.FormEvent) => {
        try {

            event.preventDefault();
            const formData = new FormData(event.target as HTMLFormElement);
            const data = Object.fromEntries(formData.entries());
            const response = await fetch('/api/proxy/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result?.error || 'Failed to sign up');
            } else {
                router.push('/curriculum');
            }
            console.log(result);
        } catch (error) {
            console.error('Error during sign up:', error);
        }
    }
    return (
        <div className="h-screen w-full flex justify-center items-center">
            <div className="border rounded py-6 shadow-md w-1/4">
                <h3 className="text-center">Đăng nhập</h3>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4  p-6 pb-0  items-center">
                    <label className="w-full flex">
                        <span className="w-[80px]">
                            Email:
                        </span>
                        <input type="email" name="email" required className="border flex-1 px-2" />
                    </label>
                    <label className="w-full flex">
                        <span className="w-[80px]">
                            Password:
                        </span>
                        <input type="password" name="password" required className="border flex-1 px-2" />
                    </label>
                    <button type="submit" className="border rounded py-2 w-1/2 hover:cursor-pointer hover:-translate-y-0.5 transition-transform">Đăng nhập</button>
                </form>
            </div>
        </div>
    )
}