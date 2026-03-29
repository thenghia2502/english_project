import { getBackendBaseUrl } from "@/lib/backend-url"
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const backendBaseUrl = getBackendBaseUrl()

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
    const id = (await params).id;
    try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('access_token')?.value
        // const userId = cookieStore.get('user_id')?.value;
        const response = await fetch(`${backendBaseUrl}/lesson/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
        });
        const data = await response.json();
        return new Response(JSON.stringify(data), { status: 200 });
    } catch {
        return new Response("Error fetching lesson data", { status: 500 });
    }
}