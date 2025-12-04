import { NextRequest } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
    const id = (await params).id;
    try {
        const response = await fetch(`http://localhost:4000/lesson/${id}`);
        const data = await response.json();
        return new Response(JSON.stringify(data), { status: 200 });
    } catch {
        return new Response("Error fetching lesson data", { status: 500 });
    }
}