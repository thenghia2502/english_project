import { NextResponse } from "next/server"
import curriculums from "@/lib/curriculum.json"

export async function GET() {
  // Trả về toàn bộ thông tin curriculum bao gồm levels
  return NextResponse.json(curriculums);
}
