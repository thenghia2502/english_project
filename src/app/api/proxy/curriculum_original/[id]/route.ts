export async function GET(request: Request, { params }: { params: { id: string } }) {
    const { id } = await params;
    try {
        const response = await fetch(`http://localhost:4000/api/curriculum_original/${id}`);
        const data = await response.json();
        return new Response(JSON.stringify(data), { status: 200 });
    } catch {
       return new Response('Error fetching curriculum original', { status: 500 });
    }
    
}