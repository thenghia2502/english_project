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
    } catch (error) {
        console.error("Error in curriculum proxy endpoint:", error);
    }
    return new Response("Hello, this is the curriculum proxy endpoint!");
}
