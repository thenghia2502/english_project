"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Users, Trash2, Play, Pen, Check, Funnel } from "lucide-react"
import { useRouter } from "next/navigation"
import data2 from "@/app/taobaihoc/data2.json"
import clsx from "clsx"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { Word, Course, Lesson } from "@/lib/types"
import Loading from "@/components/ui/loading"
import ErrorHandler from "@/components/ui/error-handler" // ✅ Import ErrorHandler

// Helper functions for sorting and searching
function sortCoursesByCreatedAt(courses: Course[]): Course[] {
  return [...courses].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

function searchCoursesByName(courses: Course[], query: string): Course[] {
  return courses.filter(course =>
    course.name.toLowerCase().includes(query.toLowerCase())
  )
}

function sortCoursesByDone(courses: Course[]): Course[] {
  return [...courses].sort(
    (a, b) => Number(b.done) - Number(a.done)
  )
}

export default function QuanLyKhoaHocPage() {
  const [originCourses, setOriginCourses] = useState<Course[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null) // ✅ Thêm error state
  const router = useRouter()

  // Load courses from localStorage on component mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setIsDataLoading(true)
        setError(null) // ✅ Reset error khi bắt đầu fetch

        const res = await fetch("/api/courses")
        if (!res.ok) {
          throw new Error(`Không thể tải danh sách khóa học. Status: ${res.status}`)
        }
        const data = await res.json()
        console.log("data: ", data)
        const sortedData = sortCoursesByCreatedAt(data)
        setCourses(sortedData)
        setOriginCourses(sortedData)
      } catch (err) {
        console.error("Lỗi khi lấy khóa học:", err)
        setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu khóa học')
      } finally {
        setIsDataLoading(false)
      }
    }

    fetchCourses()
  }, [])

  const [lessons, setLessons] = useState<Lesson[]>([])
  const [data, setData] = useState<{
    [key: string]: Word[]
  }>(data2)

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const res = await fetch("/api/lessons")
        if (!res.ok) {
          throw new Error(`Không thể tải danh sách bài học. Status: ${res.status}`)
        }
        const data = await res.json()
        setLessons(data)
      } catch (err) {
        console.error("Lỗi khi lấy bài học:", err)
        // Không set error ở đây vì lessons là data phụ
      }
    }

    fetchLessons()
  }, [])

  useEffect(() => {
    if (lessons.length === 0) return

    const fetchLevel2Words = async () => {
      try {
        const requests: Promise<[string, Word[] | null]>[] = []

        for (const lesson of lessons) {
          for (const word of lesson.words) {
            const promise = fetch(`/api/words/${word.id}/level2`)
              .then(async (res) => {
                if (!res.ok) return [word.id, null] as [string, null]
                const data = await res.json()
                if (!Array.isArray(data)) return [word.id, null] as [string, null]
                return [word.id, data] as [string, Word[]]
              })
              .catch(() => [word.id, null] as [string, null])

            requests.push(promise)
          }
        }

        const responses = await Promise.all(requests)

        // Chuyển thành map { [wordId]: Word[] }
        const resultMap: Record<string, Word[]> = {}

        for (const [wordId, words] of responses) {
          if (words) {
            resultMap[wordId] = words
          }
        }

        setData(resultMap)
      } catch (err) {
        console.error("Lỗi khi lấy từ vựng level 2:", err)
        // Không set error ở đây vì đây là data phụ
      }
    }

    fetchLevel2Words()
  }, [lessons])

  // Remove the complex loading logic and just use simple data loading check
  // The loading will be controlled by the main data fetch (courses)
  const allWordsById = useMemo(() => {
    const result: Record<string, Word> = {}

    lessons.forEach((lesson) => {
      lesson.words.forEach((word) => {
        result[word.id] = word
      })
    })

    Object.values(data).forEach((words) => {
      words.forEach((word) => {
        result[word.id] = word
      })
    })

    return result
  }, [lessons, data])
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "progress-desc" | "progress-asc">('date-desc')
  const [searchText, setSearchText] = useState('')

  const handleSortChange = (value: string) => {
    if (value === "date-desc" || value === "date-asc" || value === "progress-desc" || value === "progress-asc") {
      setSortBy(value)
    }
  }

  // Tính toán courses đã được lọc và sắp xếp
  const filteredAndSortedCourses = useMemo(() => {
    // Lọc theo text search trước
    const filtered = searchText
      ? searchCoursesByName(originCourses, searchText)
      : originCourses

    // Sau đó sắp xếp
    if (sortBy === 'date-desc') {
      return sortCoursesByCreatedAt(filtered) // Mới đến cũ
    } else if (sortBy === 'date-asc') {
      return [...filtered].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) // Cũ đến mới
    } else if (sortBy === 'progress-desc') {
      return sortCoursesByDone(filtered) // Giảm dần (100% -> 0%)
    } else { // progress-asc
      return [...filtered].sort((a, b) => Number(a.done) - Number(b.done)) // Tăng dần (0% -> 100%)
    }
  }, [originCourses, sortBy, searchText])

  // Cập nhật courses khi filteredAndSortedCourses thay đổi
  useEffect(() => {
    setCourses(filteredAndSortedCourses)
  }, [filteredAndSortedCourses])

  const handleFindCourses = useCallback((text: string) => {
    setSearchText(text)
  }, [])

  // Delete a course
  const deleteCourse = (courseId: string) => {
    const updatedCourses = originCourses.filter((course) => course.id !== courseId)
    setCourses(updatedCourses)
    setOriginCourses(updatedCourses)
    // TODO: Khi có API xóa, gọi DELETE tại đây
    // await fetch(`/api/courses/${courseId}`, { method: "DELETE" })
  }

  // Start learning a course
  const startLearning = (course: Course) => {
    router.push(`/?courseId=${course.id}`)
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
      {/* Fixed Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Quản lý bài học</h1>
            <Button onClick={() => router.push("/taobaihoc")} className="bg-blue-600 hover:bg-blue-700 text-white">
              Tạo bài học mới
            </Button>
          </div>
        </div>
      </nav>

      {/* ✅ Loading State */}
      {isDataLoading && (
        <Loading
          variant="skeleton"
          skeletonType="quan-ly-bai-hoc"
        />
      )}

      {/* ✅ Error State */}
      {error && !isDataLoading && (
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

      {/* ✅ Main Content - only show when not loading and no error */}
      {!isDataLoading && !error && (
        <div className="pt-[4.5rem] min-h-screen">
          <div className="mx-auto px-4 py-8 sm:px-6 lg:px-8">
            {courses.length === 0 ? (
              // ✅ Empty State - Sử dụng ErrorHandler
              <ErrorHandler
                type="NO_DATA_FOUND"
                pageType="quan-ly-bai-hoc"
                title="Chưa có khóa học nào"
                message="Tạo khóa học đầu tiên của bạn để bắt đầu học từ vựng"
                onRetry={() => window.location.reload()}
                onGoBack={() => router.push("/quanlygiaotrinh")}
                onGoHome={() => router.push("/")}
              />
            ) : (
              <>
                <div className="mb-5 space-y-2">
                  <div className="flex items-center m-2">
                    <Label className="w-[100px] text-lg">Tìm kiếm: </Label>
                    <Input 
                      type="text" 
                      placeholder="Nhập tên khóa học..."
                      className="border-gray-300 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0" 
                      onChange={(e) => handleFindCourses(e.target.value)} 
                    />
                  </div>
                  <div className="relative p-2">
                    <div className="flex flex-row space-x-8 p-6 border rounded-md border-gray-300">
                      {/* Container Ngày tạo */}
                      <div className="flex flex-col space-y-3">
                        <h4 className="text-sm font-semibold text-gray-700">Ngày tạo</h4>
                        <RadioGroup value={sortBy} onValueChange={handleSortChange} className="flex flex-col space-y-2">
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
                        <RadioGroup value={sortBy} onValueChange={handleSortChange} className="flex flex-col space-y-2">
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
                    
                    <div className="absolute top-0 left-0 flex pr-2 pb-1 bg-[#f3f4f6]">
                      <Funnel className="bg-[#f3f4f6] w-4 h-4" />
                      <span className="text-sm bg-[#f3f4f6]">
                        Sắp xếp
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {courses.map((course) => (
                    <Card
                      key={course.id}
                      className={clsx(
                        "bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer",
                        {
                          "bg-gradient-to-b from-blue-100 to-white": course.done === "100"
                        }
                      )}
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">{course.name}</CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteCourse(course.id)
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
                              <span>{course.words.length} từ</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{course.estimatedTime}</span>
                            </div>
                          </div>

                          {/* Course Details */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Tạo lúc:</span>
                              <span className="text-gray-500">{formatDate(course.createdAt)}</span>
                            </div>
                          </div>

                          {/* Sample Words */}
                          <div className="flex items-center">
                            <div className="space-y-2 min-w-[240px]">
                              <p className="text-sm font-medium text-gray-700">Từ vựng mẫu:</p>
                              <div className="flex flex-wrap gap-1">
                                {course.words.slice(0, 2).map((cw) => {
                                  const word = allWordsById[cw.wordId] // ← Lấy Word từ wordId
                                  return (<Badge key={cw.wordId} variant="outline" className="text-xs">
                                    {word?.word || "???"}
                                  </Badge>)
                                })}
                                {course.words.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{course.words.length - 2} từ khác
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex-1 flex justify-center">
                              <div
                                className={`h-[50px] w-[50px] rounded-full flex items-center justify-center text-white ${course.done === '100' ? 'bg-green-600' : 'bg-yellow-500'
                                  }`}
                              >
                                {course.done === '100' ? <Check /> : `${course.done}%`}
                              </div>
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className="flex items-center justify-around">
                            <Button
                              onClick={() => startLearning(course)}
                              className="bg-green-600 hover:bg-green-700 text-white mt-4"
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Bắt đầu học
                            </Button>
                            <Button className="bg-green-600 hover:bg-green-700 text-white mt-4">
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
            )}
          </div>
        </div>
      )}
    </div>
  )
}
