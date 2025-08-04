"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Clock, Users, Trash2, Play, Pen, Check, Funnel } from "lucide-react"
import { useRouter } from "next/navigation"
import data2 from "@/app/taobaihoc/data2.json"
import clsx from "clsx"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { Word, Course, Lesson } from "@/lib/types"
import Loading from "@/components/ui/loading"

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
  const router = useRouter()

  // Load courses from localStorage on component mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setIsDataLoading(true)
        const res = await fetch("/api/courses")
        if (!res.ok) throw new Error("Failed to fetch")
        const data = await res.json()
        console.log("data: ", data)
        const sortedData = sortCoursesByCreatedAt(data)
        setCourses(sortedData)
        setOriginCourses(sortedData)
      } catch (err) {
        console.error("Lỗi khi lấy khóa học:", err)
      } finally {
        setIsDataLoading(false)
      }
    }

    fetchCourses()
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
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [data, setData] = useState<{
    [key: string]: Word[]
  }>(data2)
  useEffect(() => {
    const fetchLessons = async () => {
      const res = await fetch("/api/lessons")
      const data = await res.json()
      setLessons(data)
    }

    fetchLessons()
  }, [])
  useEffect(() => {
    if (lessons.length === 0) return

    const fetchLevel2Words = async () => {
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
  const [sortBy, setSortBy] = useState<"date" | "progress">('date')
  const [searchText, setSearchText] = useState('')

  const handleSortChange = (value: string) => {
    if (value === "date" || value === "progress") {
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
    if (sortBy === 'date') {
      return sortCoursesByCreatedAt(filtered)
    } else {
      return sortCoursesByDone(filtered)
    }
  }, [originCourses, sortBy, searchText])

  // Cập nhật courses khi filteredAndSortedCourses thay đổi
  useEffect(() => {
    setCourses(filteredAndSortedCourses)
  }, [filteredAndSortedCourses])

  const handleFindCourses = useCallback((text: string) => {
    setSearchText(text)
  }, [])

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
      {/* Loadind data */}
      {isDataLoading && (
        <Loading
          variant="skeleton"
          skeletonType="quan-ly-bai-hoc"
        />
      )}
      {/* Main Content */}
      {!isDataLoading && (
        <div className="pt-[4.5rem] min-h-screen">
          <div className="mx-auto  px-4 py-8 sm:px-6 lg:px-8">
            {courses.length === 0 ? (
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardContent className="p-12 text-center">
                  <div className="text-gray-400">
                    <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2 text-gray-600">Chưa có khóa học nào</p>
                    <p className="text-sm text-gray-500 mb-6">Tạo khóa học đầu tiên của bạn để bắt đầu học từ vựng</p>
                    <Button
                      onClick={() => router.push("/taokhoahoc")}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Tạo khóa học mới
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="mb-5 space-y-2">
                  <div className="flex items-center m-2">
                    <Label className="w-[100px] text-lg">Tìm kiếm: </Label>
                    <Input type="text" className="border-gray-300 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0" onChange={(e) => handleFindCourses(e.target.value)} />
                  </div>
                  <div className="relative p-2">
                    <RadioGroup value={sortBy} onValueChange={handleSortChange} className="flex flex-row space-x-6 p-6 border rounded-md border-gray-300">
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="date" id="date" />
                        <Label htmlFor="date" className="text-sm font-medium cursor-pointer">
                          Ngày tạo
                        </Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="progress" id="progress" />
                        <Label htmlFor="progress" className="text-sm font-medium cursor-pointer">
                          Tiến độ
                        </Label>
                      </div>
                    </RadioGroup>
                    <div className="absolute top-0 left-0 flex pr-2 pb-1 bg-[#f3f4f6]">
                      <Funnel className="bg-[#f3f4f6] w-4 h-4" />
                      <span className="text-sm bg-[#f3f4f6] ">
                        Bộ lọc
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
                      <CardContent className="pt-0 ">
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
                          <div className="flex items-center ">
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
                            <div className="flex-1 flex justify-center ">
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
