import { promises as fs } from "fs"
import path from "path"
import { NextRequest, NextResponse } from "next/server"

const dataPath = path.join(process.cwd(), "src", "lib", "courses.json")

export async function GET() {
  const file = await fs.readFile(dataPath, "utf-8")
  const courses = JSON.parse(file)
  return NextResponse.json(courses)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const file = await fs.readFile(dataPath, "utf-8")
    const courses = JSON.parse(file)

    const newCourse = {
      id: crypto.randomUUID(),
      ...body,
      createdAt: new Date().toISOString(),
    }

    courses.push(newCourse)
    await fs.writeFile(dataPath, JSON.stringify(courses, null, 2))

    return NextResponse.json(newCourse)
  } catch (error) {
    console.error("🔥 Lỗi tạo khóa học:", error)
    return NextResponse.json(error)
  }
}


