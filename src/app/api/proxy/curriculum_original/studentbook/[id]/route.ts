import { getBackendBaseUrl } from "@/lib/backend-url"

const backendBaseUrl = getBackendBaseUrl()
// export async function GET(request: Request, { params }: { params: { id: string } }) {
//     const { id } = await params;
//     try {
//         const response = await fetch(`${backendBaseUrl}/api/curriculum_original/${id}`);
//         const data = await response.json();
//         return new Response(JSON.stringify(data), { status: 200 });
//     } catch {
//        return new Response('Error fetching curriculum original', { status: 500 });
//     }



// }
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('access_token')?.value;
        const response = await fetch(`${backendBaseUrl}/curriculum/books/${id}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        const data = await response.json();
        return new Response(JSON.stringify(data), { status: 200 });
    } catch {
       return new Response('Error fetching curriculum original', { status: 500 });
    }
    
}