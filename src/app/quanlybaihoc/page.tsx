"use client"

import { useState, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Users, Trash2, Play, Pen, Check, Funnel } from "lucide-react"
import { useRouter } from "next/navigation"
import clsx from "clsx"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { Lesson } from "@/lib/types"
import Loading from "@/components/ui/loading"
import ErrorHandler from "@/components/ui/error-handler"
import { useDeleteLesson, useLessons } from "@/hooks/use-lessons"
// Ensure all other imports and usages of Lesson come from "@/lib/types" only

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

export default function QuanLyKhoaHocPage() {
  const router = useRouter()

  // React Query hooks
  const deleteLessonMutation = useDeleteLesson()
  const { data: lessons = [], isLoading: lessonsLoading, error: lessonsError } = useLessons()
  // Local state for UI
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "progress-desc" | "progress-asc">('date-desc')
  const [searchText, setSearchText] = useState('')

  // Computed value
  const isLoading = lessonsLoading 
  const error = lessonsError?.message
  const hasNoLessons = !isLoading && !error && lessons.length === 0

  const handleSortChange = (value: string) => {
    if (value === "date-desc" || value === "date-asc" || value === "progress-desc" || value === "progress-asc") {
      setSortBy(value)
    }
  }

  // // Tính toán courses đã được lọc và sắp xếp
  const filteredAndSortedCourses = useMemo(() => {
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

  const handleFindCourses = useCallback((text: string) => {
    setSearchText(text)
  }, [])

  // Delete a course using React Query mutation
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

  // Edit lesson - lưu lesson data vào sessionStorage
  const editLesson = async (lesson: Lesson) => {
    try {
      // Chuyển hướng đến trang edit với mode=edit
      router.push(`/taobaihoc?mode=edit&lid=${lesson.id}&id=${lesson.curriculum_custom_id}`)
      
    } catch (error) {
      console.error('Error fetching lesson data for edit:', error)
    }
  }

  // // Format date
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
      {/* Fixed Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Quản lý bài học</h1>
            <Button onClick={() => router.push("/quanlygiaotrinh")} className="bg-blue-600 hover:bg-blue-700 text-white">
              Quản lý Giáo trình
            </Button>
          </div>
        </div>
      </nav>

      {/* ✅ Loading State */}
      {isLoading && (
        <Loading
          variant="skeleton"
          skeletonType="quan-ly-bai-hoc"
        />
      )}

      {/* ✅ Error State */}
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

      {/* ✅ No Data State */}
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

      {/* ✅ Main Content - only show when not loading, no error and has courses */}
      {true && true && true && (
        <div className="pt-[4.5rem] min-h-screen">
          <div className="mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <>
              <div className="mb-5 space-y-2">
                <div className="flex items-center m-2 text-gray-900">
                  <Label className="w-[100px] text-lg">Tìm kiếm: </Label>
                  <Input
                    type="text"
                    placeholder="Nhập tên khóa học..."
                    className="border-gray-300 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    onChange={(e) => handleFindCourses(e.target.value)}
                  />
                </div>
                <div className={`relative p-2 ${(searchText && filteredAndSortedCourses.length === 0) ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div className="flex flex-row space-x-8 p-6 border rounded-md border-gray-300">
                    {/* Container Ngày tạo */}
                    <div className="flex flex-col space-y-3">
                      <h4 className="text-sm font-semibold text-gray-700">Ngày tạo</h4>
                      <RadioGroup value={sortBy} onValueChange={handleSortChange} className="flex flex-col space-y-2 text-gray-900">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <RadioGroupItem value="date-desc" id="date-desc" />
                          <span className="text-sm">
                            Mới đến cũ
                          </span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <RadioGroupItem value="date-asc" id="date-asc" />
                          <span className="text-sm">
                            Cũ đến mới
                          </span>
                        </label>
                      </RadioGroup>
                    </div>

                    {/* Container Tiến độ */}
                    <div className="flex flex-col space-y-3">
                      <h4 className="text-sm font-semibold text-gray-700">Tiến độ</h4>
                      <RadioGroup value={sortBy} onValueChange={handleSortChange} className="flex flex-col space-y-2 text-gray-900">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <RadioGroupItem value="progress-desc" id="progress-desc" />
                          <span className="text-sm">
                            Giảm dần
                          </span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <RadioGroupItem value="progress-asc" id="progress-asc" />
                          <span className="text-sm">
                            Tăng dần
                          </span>
                        </label>
                      </RadioGroup>
                    </div>
                  </div>

                  <div className="absolute top-0 left-0 flex pr-2 pb-1 bg-[#f3f4f6] text-gray-900">
                    <Funnel className="bg-[#f3f4f6] w-4 h-4" />
                    <span className="text-sm bg-[#f3f4f6]">
                      Sắp xếp
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {searchText && filteredAndSortedCourses.length === 0 && (
                  <div className="col-span-1 md:col-span-2 lg:col-span-4 flex justify-center items-center text-gray-500">
                    Không có khóa học nào được tìm thấy với chuỗi tìm kiếm &quot;{searchText}&quot;
                  </div>
                )}
                {filteredAndSortedCourses.map((lesson) => (
                  <Card
                    key={lesson.id}
                    className={clsx(
                      "bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer",
                      {
                        "bg-gradient-to-b from-blue-100 to-white": lesson.done === "100"
                      }
                    )}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">{lesson.name}</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteLesson(lesson.id)
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        {/* Course Stats */}
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{lesson.words?.length} từ</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{lesson.estimatedTime}</span>
                          </div>
                        </div>

                        {/* Course Details */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Tạo lúc:</span>
                            <span className="text-gray-500">{formatDate(lesson.created_at)}</span>
                          </div>
                        </div>

                        {/* Sample Words */}
                        <div className="flex items-center">
                          <div className="space-y-2 min-w-[240px]">
                            <p className="text-sm font-medium text-gray-700">Từ vựng mẫu:</p>
                            <div className="flex flex-wrap gap-1">
                              {(() => {
                                const words = lesson.words ?? []
                                return words.slice(0, 2).map((cw) => (
                                  <Badge key={cw.id} variant="outline" className="text-xs text-gray-900">
                                    {cw.word}
                                  </Badge>
                                ))
                              })()}
                              {(() => {
                                const words = lesson.words ?? []
                                return words.length > 2 ? (
                                  <Badge variant="outline" className="text-xs text-gray-900">
                                    +{words.length - 2} từ khác
                                  </Badge>
                                ) : null
                              })()}
                            </div>
                          </div>
                          <div className="flex-1 flex justify-center">
                            <div
                              className={`h-[50px] w-[50px] rounded-full flex items-center justify-center text-white ${lesson.done === '100' ? 'bg-green-600' : 'bg-yellow-500'
                                }`}
                            >
                              {lesson.done === '100' ? <Check /> : `${lesson.done}%`}
                            </div>
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="flex items-center justify-around">
                          <Button
                            onClick={() => startLearning(lesson)}
                            className="bg-green-600 hover:bg-green-700 text-white mt-4"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Bắt đầu học
                          </Button>
                          <Button className="bg-green-600 hover:bg-green-700 text-white mt-4"
                            onClick={() => editLesson(lesson)}
                          >
                            <Pen className="w-4 h-4 mr-2" />
                            Chỉnh sửa bài học
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>

          </div>
        </div>
      )}
    </div>
  )
}
