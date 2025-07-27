import { NextResponse } from "next/server"
import curriculums from "@/lib/curriculum.json"

export async function GET() {
  const ar = curriculums.map((item) => ({
    id: item.id,
    title: item.title
  }));

  return NextResponse.json(ar);
}
