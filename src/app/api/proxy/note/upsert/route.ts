import { cookies } from "next/headers";

export async function POST(request: Request) {
    try {
        const reqData = await request.json();
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('access_token')?.value
        const res = await fetch(`http://localhost:4000/unit-notes/upsert`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(reqData)
        });
        const data = await res.json();
        return new Response(JSON.stringify(data), { status: res.status });
    } catch (error) {
        return new Response("Error processing request", { status: 500 });
    }
}