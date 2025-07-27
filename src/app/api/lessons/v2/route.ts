import { Lesson } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET({context}: { context: { params: { id: string } } }) {
    const lessonsData = [] as Lesson[];
  return NextResponse.json(lessonsData)
}