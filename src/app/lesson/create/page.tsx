import { Suspense } from "react"
import LessonBuilder from "@/components/lesson-builder/LessonBuilder"

export default function CreateLessonPage() {
  return (
    <Suspense fallback={null}>
      <LessonBuilder mode="create" />
    </Suspense>
  )
}
