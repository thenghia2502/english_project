import { promises as fs } from "fs"
import path from "path"
import { NextRequest, NextResponse } from "next/server"
import { Course } from "@/lib/types"

const dataPath = path.join(process.cwd(), "src", "lib", "courses.json")

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = await Promise.resolve(params);
  const file = await fs.readFile(dataPath, "utf-8")
  const courses = JSON.parse(file)
  const course = courses.find((c: Course) => c.id === resolvedParams.id)

  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 })
  }

  return NextResponse.json(course)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const body = await req.json()
    const { name, estimatedTime, words, done, lessonListId } = body
    const resolvedParams = await Promise.resolve(params);
    const courseId = resolvedParams.id;

    if (!name || !estimatedTime || !words || !lessonListId) {
      return NextResponse.json(
        { error: "Thiếu dữ liệu bắt buộc: name, estimatedTime, words, lessonListId" },
        { status: 400 }
      )
    }

    const file = await fs.readFile(dataPath, "utf-8")
    const courses = JSON.parse(file)
    const courseIndex = courses.findIndex((c: Course) => c.id === courseId)

    if (courseIndex === -1) {
      return NextResponse.json({ error: "Không tìm thấy khóa học" }, { status: 404 })
    }

    // Update entire course
    courses[courseIndex] = {
      ...courses[courseIndex],
      name: name.trim(),
      estimatedTime,
      words,
      done: done || courses[courseIndex].done,
      lessonListId
    }

    // Write back to file
    await fs.writeFile(dataPath, JSON.stringify(courses, null, 2), "utf-8")

    return NextResponse.json(courses[courseIndex])
  } catch (error) {
    console.error("Error updating course:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const courseId = resolvedParams.id;

    const file = await fs.readFile(dataPath, "utf-8")
    const courses = JSON.parse(file)
    const courseIndex = courses.findIndex((c: Course) => c.id === courseId)

    if (courseIndex === -1) {
      return NextResponse.json({ error: "Không tìm thấy khóa học" }, { status: 404 })
    }

    // Store course info before deletion for response
    const deletedCourse = courses[courseIndex]

    // Remove course from array
    courses.splice(courseIndex, 1)

    // Write back to file
    await fs.writeFile(dataPath, JSON.stringify(courses, null, 2), "utf-8")

    return NextResponse.json({ 
      message: "Xóa khóa học thành công", 
      deletedCourse: {
        id: deletedCourse.id,
        name: deletedCourse.name
      }
    })
  } catch (error) {
    console.error("Error deleting course:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const { id, words, done } = await req.json()
    const resolvedParams = await Promise.resolve(params);

    // Use id from params if not in body
    const courseId = id || resolvedParams.id;

    if (typeof courseId !== "string" || typeof done !== "string") {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ. 'id' phải là string, 'done' phải là string." },
        { status: 400 }
      )
    }

    const file = await fs.readFile(dataPath, "utf-8")
    const courses = JSON.parse(file)
    const courseIndex = courses.findIndex((c: Course) => c.id === courseId)

    if (courseIndex === -1) {
      return NextResponse.json({ error: "Không tìm thấy khóa học" }, { status: 404 })
    }

    // Update course
    courses[courseIndex] = {
      ...courses[courseIndex],
      done,
      words: words || courses[courseIndex].words
    }

    // ✅ Ghi lại toàn bộ danh sách vào file
    await fs.writeFile(dataPath, JSON.stringify(courses, null, 2), "utf-8")

    return NextResponse.json(courses[courseIndex])
  } catch (error) {
    console.error("Error updating course:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
