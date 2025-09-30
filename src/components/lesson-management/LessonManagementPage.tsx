"use client"

import { useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Lesson } from "@/lib/types"
import Loading from "@/components/ui/loading"
import ErrorHandler from "@/components/ui/error-handler"
import { useDeleteLesson, useLessons } from "@/hooks/use-lessons"
import TopNavigation from "./TopNavigation"
import LessonSortFilter from "./LessonSortFilter"
import LessonGrid from "./LessonGrid"
import { SortBy } from "./types"

// Helper functions for sorting and searching
function sortLessonsByCreatedAt(lessons: Lesson[]): Lesson[] {
    return [...lessons].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
}

function searchLessonsByName(lessons: Lesson[], query: string): Lesson[] {
    return lessons.filter(lesson =>
        lesson.name.toLowerCase().includes(query.toLowerCase())
    )
}

function sortLessonsByDone(lessons: Lesson[]): Lesson[] {
    return [...lessons].sort(
        (a, b) => Number(b.done) - Number(a.done)
    )
}

export default function LessonManagementPage() {
    const router = useRouter()

    // React Query hooks
    const deleteLessonMutation = useDeleteLesson()
    const { data: lessons = [], isLoading: lessonsLoading, error: lessonsError } = useLessons()
    
    // Local state for UI
    const [sortBy, setSortBy] = useState<SortBy>('date-desc')
    const [searchText, setSearchText] = useState('')

    // Computed values
    const isLoading = lessonsLoading
    const error = lessonsError?.message
    const hasNoLessons = !isLoading && !error && lessons.length === 0

    const handleSortChange = (value: string) => {
        if (value === "date-desc" || value === "date-asc" || value === "progress-desc" || value === "progress-asc") {
            setSortBy(value)
        }
    }

    // Tính toán lessons đã được lọc và sắp xếp
    const filteredAndSortedLessons = useMemo(() => {
        // Lọc theo text search trước
        const filtered = searchText
            ? searchLessonsByName(lessons, searchText)
            : lessons

        // Sau đó sắp xếp
        if (sortBy === 'date-desc') {
            return sortLessonsByCreatedAt(filtered) // Mới đến cũ
        } else if (sortBy === 'date-asc') {
            return [...filtered].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) // Cũ đến mới
        } else if (sortBy === 'progress-desc') {
            return sortLessonsByDone(filtered) // Giảm dần (100% -> 0%)
        } else { // progress-asc
            return [...filtered].sort((a, b) => Number(a.done) - Number(b.done)) // Tăng dần (0% -> 100%)
        }
    }, [lessons, sortBy, searchText])

    const handleSearchChange = useCallback((text: string) => {
        setSearchText(text)
    }, [])

    // Delete a lesson using React Query mutation
    const deleteLesson = async (lessonId: string) => {
        try {
            await deleteLessonMutation.mutateAsync(lessonId)
            // React Query sẽ tự động invalidate và refetch lessons
        } catch (error) {
            console.error("Error deleting lesson:", error)
            // TODO: Show error toast/notification
        }
    }

    // Start learning a lesson
    const startLearning = (lesson: Lesson) => {
        router.push(`/hoctu?lessonId=${lesson.id}`)
    }

    // Edit lesson
    const editLesson = async (lesson: Lesson) => {
        try {
            // Chuyển hướng đến trang edit với mode=edit
            router.push(`/taobaihoc?mode=edit&lid=${lesson.id}&id=${lesson.curriculum_custom_id}`)
        } catch (error) {
            console.error('Error fetching lesson data for edit:', error)
        }
    }

    // Format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <TopNavigation onNavigateToManagement={() => router.push("/giaotrinh")} />

            {/* Loading State */}
            {isLoading && (
                <Loading
                    variant="skeleton"
                    skeletonType="quan-ly-bai-hoc"
                />
            )}

            {/* Error State */}
            {error && !isLoading && (
                <ErrorHandler
                    type="GENERAL_ERROR"
                    pageType="quan-ly-bai-hoc"
                    title="Không thể tải dữ liệu quản lý bài học"
                    message="Đã xảy ra lỗi khi tải danh sách khóa học. Vui lòng thử lại."
                    errorDetails={error}
                    onRetry={() => window.location.reload()}
                    onGoBack={() => router.push("/quanlygiaotrinh")}
                    onGoHome={() => router.push("/")}
                />
            )}

            {/* No Data State */}
            {hasNoLessons && (
                <ErrorHandler
                    type="NO_DATA_FOUND"
                    pageType="quan-ly-bai-hoc"
                    title="Chưa có bài học nào"
                    message="Bạn chưa tạo bài học nào. Hãy tạo bài học đầu tiên để bắt đầu."
                    onActionButton={() => router.push("/taobaihoc")}
                    labelActionButton="Tạo bài học mới"
                    onGoBack={() => router.push("/quanlygiaotrinh")}
                    onGoHome={() => router.push("/")}
                />
            )}

            {/* Main Content */}
            {!isLoading && !error && !hasNoLessons && (
                <div className="pt-[4.5rem] min-h-screen">
                    <div className="mx-auto px-4 py-8 sm:px-6 lg:px-8">
                        <LessonSortFilter
                            sortBy={sortBy}
                            searchText={searchText}
                            onSortChange={handleSortChange}
                            onSearchChange={handleSearchChange}
                            hasResults={filteredAndSortedLessons.length > 0}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <LessonGrid
                                lessons={filteredAndSortedLessons}
                                searchText={searchText}
                                onDelete={deleteLesson}
                                onStartLearning={startLearning}
                                onEditLesson={editLesson}
                                formatDate={formatDate}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}