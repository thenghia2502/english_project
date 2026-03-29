import { getBackendBaseUrl } from "@/lib/backend-url"
import { cookies } from "next/headers";

const backendBaseUrl = getBackendBaseUrl()


export async function POST(request: Request) {
    const body = await request.json();
    try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('access_token')?.value;
        const response = await fetch(`${backendBaseUrl}/lesson/update-words`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify(body),
        });
        const res = await response.text();
        return new Response(res, {
            status: response.status, // 🔥 giữ nguyên 401
            headers: {
                'Content-Type': response.headers.get('content-type') ?? 'application/json',
            },
        })
    } catch (err) {
        // 🔥 CHỈ BẮT LỖI FETCH THẬT
        return new Response(
            JSON.stringify({ message: 'Proxy network error' }),
            { status: 500 }
        )
    }
}
