import { promises as fs } from "fs"
import path from "path"
import { NextRequest, NextResponse } from "next/server"

const dataPath = path.join(process.cwd(), "src", "lib", "courses.json")

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const file = await fs.readFile(dataPath, "utf-8")
  const courses = JSON.parse(file)
  const course = courses.find((c: any) => c.id === params.id)

  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 })
  }

  return NextResponse.json(course)
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, words, done } = await req.json()

    if (typeof id !== "string" || typeof done !== "number" || done < 0 || done > 100) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ. 'id' phải là string, 'done' từ 0 đến 100." },
        { status: 400 }
      )
    }

    const file = await fs.readFile(dataPath, "utf-8")
    const courses = JSON.parse(file)
    const course = courses.find((c: any) => c.id === id)

    if (!course) {
      return NextResponse.json({ error: "Không tìm thấy khóa học" }, { status: 404 })
    }

    course.done = String(done)
    course.words = words
    // ✅ Ghi lại toàn bộ danh sách vào file
    await fs.writeFile(dataPath, JSON.stringify(courses, null, 2), "utf-8")

    return NextResponse.json({ message: "Đã cập nhật trạng thái", course })
  } catch (error) {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
