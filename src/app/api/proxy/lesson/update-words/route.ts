export async function POST(request: Request) {
    const body = await request.json();
    try {
        const response = await fetch('http://localhost:4000/lesson/update-words', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
        const data = await response.json();
        return new Response(JSON.stringify(data), { status: 200 });
    } catch {
        return new Response("Error in curriculum proxy endpoint:", { status: 500 });
    }
}
