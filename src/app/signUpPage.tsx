'use client';

export default function SignUpPage() {
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
            console.log(result);
        } catch (error) {
            console.error('Error during sign up:', error);
        }
    }
    return (
        <form onSubmit={handleSubmit}>
            <label>
                Email:
                <input type="email" name="email" required />
            </label>
            <label>
                Password:
                <input type="password" name="password" required />
            </label>
            <button type="submit">Sign Up</button>
        </form>
    )
}