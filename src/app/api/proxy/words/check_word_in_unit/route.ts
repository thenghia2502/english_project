import { getBackendBaseUrl } from "@/lib/backend-url"
import { cookies } from "next/headers";

const backendBaseUrl = getBackendBaseUrl()

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('access_token')?.value
        const userId = cookieStore.get('user_id')?.value;
        const res = await fetch(`${backendBaseUrl}/unit/check-word`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({ ...body, userId }),
        });
        // Lấy JSON từ backend
        const data = await res.json();

        // Trả đúng JSON cho FE
        return new Response(JSON.stringify(data), {
            status: res.status,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return new Response(JSON.stringify({ message: 'Invalid request body' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}