import { cookies } from "next/headers";

export async function POST(request: Request) {
    const body = await request.json();
    try {
        const cookieStore = await cookies();
        const access_token = cookieStore.get('access_token')?.value
        const response = await fetch('http://localhost:4000/lesson/update-progress', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${access_token}`,
            },
            body: JSON.stringify(body),
        });
        const data = await response.json();
        return new Response(JSON.stringify(data), { status: 200 });
    } catch {
        return new Response("Error in curriculum proxy endpoint:", { status: 500 });
    }
}
