import { cookies } from "next/headers";

export async function POST(request: Request) {
    const body = await request.json();
    try {
        const cookieStore = await cookies(); 
        const accessToken = cookieStore.get('access_token')?.value;
        const response = await fetch('http://localhost:4000/lesson/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                "name": body.name,
                "curriculum_original_id": body.curriculum_original_id,
                "order": 1,
                "unit_ids": body.unit_ids,
                "words": body.words,
                "description": body.description,
                "duration": body.duration,
                "category": body.category
            }),
        });
        const data = await response.json();
        return new Response(JSON.stringify(data), { status: 200 });
    } catch {
        return new Response("Error in curriculum proxy endpoint:", { status: 500 });
    }
}