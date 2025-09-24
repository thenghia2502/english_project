export async function GET() {
    try {
        const response = await fetch('http://localhost:4000/api/curriculum_original');
        const data = await response.json();
        if (!data) return new Response(JSON.stringify({ items: [] }), { status: 200 })
        if (data.data && typeof data.data === 'object') return new Response(JSON.stringify(data.data), { status: 200 })
        if (data.items || data.total || data.page) return new Response(JSON.stringify(data), { status: 200 })
        if (data.items) return new Response(JSON.stringify({ items: data.items }), { status: 200 })
        return new Response(JSON.stringify({ items: [] }), { status: 200 })
    } catch (error) {
        console.error("Error in curriculum proxy endpoint:", error);
    }
}
