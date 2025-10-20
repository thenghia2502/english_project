export async function DELETE(request: Request) {
    const { id } = await request.json();
    try {
        const response = await fetch(`http://localhost:4000/api/curriculum_custom/delete`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id }),
        });
        const data = await response.json();
        return new Response(JSON.stringify(data), { status: 200 });
    } catch {
        return new Response("Error in curriculum proxy endpoint:", { status: 500});
    }
}
