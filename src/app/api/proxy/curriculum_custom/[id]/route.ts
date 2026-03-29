
import type { NextRequest } from "next/server"

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    try {
        const res = await fetch(`http://localhost:4000/api/curriculum_custom/${id}`)
        const json = await res.json()
        return new Response(JSON.stringify(json), { status: 200 })
    } catch{
        return new Response('Error fetching custom curriculum', { status: 500 })
    }
}
