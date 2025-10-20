export async function GET() {
    try {
        const response = await fetch('http://localhost:4000/api/lesson');
        const data = await response.json();
        return new Response(JSON.stringify(data), { status: 200 });
    } catch {
        return new Response("Error in lesson proxy endpoint:", { status: 500 });
    }
}