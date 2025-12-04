export async function POST(request: Request) {
    const body = await request.json();
    try {
        const response = await fetch('http://localhost:4000/lesson/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "name": body.name,
                "curriculum_original_id": body.curriculum_original_id,
                "order": 1,
                "unit_ids": body.unit_ids,
                "words": body.words
            }),
        });
        const data = await response.json();
        return new Response(JSON.stringify(data), { status: 200 });
    } catch {
        return new Response("Error in curriculum proxy endpoint:", { status: 500 });
    }
}