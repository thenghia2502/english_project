import { NextRequest, NextResponse } from "next/server"
import curriculums from "@/lib/curriculum.json"

export async function GET(req: NextRequest, context: { params: { id: string } }) {
    const { id } = await context.params;
    const curriculum = curriculums.find(item => item.id === id);
    return NextResponse.json(curriculum);
}
