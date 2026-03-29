import { getBackendBaseUrl } from "@/lib/backend-url"
import { cookies } from "next/headers";

const backendBaseUrl = getBackendBaseUrl()

export async function POST(request: Request) {
    try {
        const reqData = await request.json();
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('access_token')?.value
        const res = await fetch(`${backendBaseUrl}/unit-notes/upsert`, {
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