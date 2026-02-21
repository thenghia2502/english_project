// export async function GET(request: Request, { params }: { params: { id: string } }) {
//     const { id } = await params;
//     try {
//         const response = await fetch(`http://localhost:4000/api/curriculum_original/${id}`);
//         const data = await response.json();
//         return new Response(JSON.stringify(data), { status: 200 });
//     } catch {
//        return new Response('Error fetching curriculum original', { status: 500 });
//     }



// }
import { cookies } from "next/headers";
export async function GET(request: Request, { params }: { params: { id: string } }) {
    const { id } = await params;
    try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('access_token')?.value;
        const response = await fetch(`http://localhost:4000/curriculum/${id}`, {
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