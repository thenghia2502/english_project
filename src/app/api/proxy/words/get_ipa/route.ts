export async function GET(request: Request) {
    try {
        // Extract words from query parameters
        const { searchParams } = new URL(request.url);
        const words = searchParams.getAll('words');
        const res = await fetch(`http://localhost:4000/dictionary/ipa?word=${words}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) {
            return new Response(JSON.stringify({ error: 'Failed to fetch IPA data' }), { status: res.status });
        }
        return new Response(JSON.stringify(await res.json()), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
}