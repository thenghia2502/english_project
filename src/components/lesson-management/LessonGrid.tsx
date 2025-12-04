"use client"

import { Lesson } from "@/lib/types"
import LessonCard from "./LessonCard"

interface LessonGridProps {
    lessons: Lesson[]
    searchText: string
    onDelete: (lessonId: string) => Promise<void>
    onStartLearning: (lesson: Lesson) => void
    onEditLesson: (lesson: Lesson) => void
    formatDate: (dateString: string) => string
}

export default function LessonGrid({
    lessons,
    searchText,
    onDelete,
    onStartLearning,
    onEditLesson,
    formatDate
}: LessonGridProps) {
    if (searchText && lessons.length === 0) {
        return (
            <div className="col-span-1 md:col-span-2 lg:col-span-4 flex justify-center items-center text-gray-500">
                Không có khóa học nào được tìm thấy với chuỗi tìm kiếm &quot;{searchText}&quot;
            </div>
        )
    }

    return (
        <>
            {lessons.map((lesson) => (
                <LessonCard
                    key={lesson.lesson_id}
                    lesson={lesson}
                    onDelete={onDelete}
                    onStartLearning={onStartLearning}
                    onEditLesson={onEditLesson}
                    formatDate={formatDate}
                />
            ))}
        </>
    )
}