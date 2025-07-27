"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Check, ChevronRight, Plus, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import clsx from "clsx"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import React from "react"
// import data2 from "./data2.json"
import { Lesson } from "../api/lessons/route"

interface Word {
  "id": string
  "word": string
  "meaning": string
  "ipa": string
  "selected": boolean
  "done": boolean,
  "popularity": number,
  "belong": string
}

interface CourseWord {
  wordId: string
  pauseTime: string
  maxReads: string
  showIpa: string
  showWord: string
  showIpaAndWord: string
  readsPerRound: string
  progress: string
}


// interface CourseState {
//   courseId: string;

//   currentWordIndex: number;         // chỉ số của từ đang học trong danh sách
//   currentRound: number;             // vòng lặp hiện tại
//   isPlaying: boolean;               // có đang phát audio không
//   isPaused: boolean;                // đang tạm dừng không
//   isFinished: boolean;             // đã hoàn thành khóa học chưa

//   totalTimeSpent: number;          // tổng thời gian học (giây)
//   wordReadCounts: Record<string, number>; // số lần đã đọc cho từng wordId

//   // có thể mở rộng thêm nếu bạn cần:
//   loopMode: boolean;               // có bật chế độ lặp không
//   startTime?: number;              // timestamp bắt đầu học
// }

interface Course {
  id: string
  name: string
  words: CourseWord[]
  createdAt: string
  estimatedTime: string
  done: string
}

export default function TaoKhoaHocPage() {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [data, setData] = useState<{
    [key: string]: Word[]
  }>({})
  const [courseWords, setCourseWords] = useState<CourseWord[]>([])
  const [courseName, setCourseName] = useState("")
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // ✅ Helper functions để update word status
  const updateWordStatus = useCallback((words: Word[], courses: Course[]) => {
    return words.map((word: Word) => {
      const matcheds = findAllMatchedWords(word.id, courses);
      const belong = findBelongLessons(word.id, courses);

      if (matcheds.length < 1) return word;

      const isDone = matcheds.some(
        (matched) => Number(matched.progress || 0) >= Number(matched.maxReads || 0)
      );
      return {
        ...word,
        done: isDone,
        belong: belong ?? "",
      };
    });
  }, []);

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const res = await fetch("/api/lessons")
        if (!res.ok) throw new Error('Failed to fetch lessons')
        const data = await res.json()

        const res_get_courses = await fetch(`/api/courses`)
        if (!res_get_courses.ok) throw new Error('Failed to fetch courses')
        const courses: Course[] = await res_get_courses.json()

        // ✅ Lấy wordId của các từ đã học (done = "100")
        const learnedWordIds = new Set(
          courses
            .filter(course => course.done === "100")
            .flatMap(course => course.words.map(word => word.wordId))
        )

        // ✅ Cập nhật mỗi từ trong lessons với trạng thái học và progress
        const finalLessons = data.map((lesson: Lesson) => {
          const wordsWithLearnedStatus = lesson.words.map((word: Word) => ({
            ...word,
            done: learnedWordIds.has(word.id)
          }));
          
          return {
            ...lesson,
            words: updateWordStatus(wordsWithLearnedStatus, courses)
          };
        });

        setLessons(finalLessons)
        setCourses(courses)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred')
        console.error('Error fetching data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchLessons()
  }, [updateWordStatus, setCourses])

  useEffect(() => {
    if (lessons.length === 0) return

    const fetchLevel2Words = async () => {
      const requests: Promise<[string, Word[] | null]>[] = []

      for (const lesson of lessons) {
        for (const word of lesson.words) {
          const promise = fetch(`/api/word/level2/list/${word.id}`)
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

      // ✅ Lấy wordId của các từ đã học (done = "100")
      const learnedWordIds = courses
        .filter(course => course.done === "100")
        .flatMap(course => course.words.map(word => word.wordId))

      setData((prevData) => {
        const merged: typeof prevData = { ...prevData }

        for (const key in resultMap) {
          const newWords = resultMap[key]
          const oldWords = prevData[key] || []

          // Giữ trạng thái selected nếu có từ trước
          const mergedWords = newWords.map((newWord) => {
            const old = oldWords.find((w) => w.id === newWord.id)
            return {
              ...newWord,
              selected: old?.selected ?? false,
              done: learnedWordIds.includes(newWord.id)
            }
          })

          merged[key] = mergedWords
        }

        // ✅ Cập nhật với progress và belong info từ courses
        const updatedData: { [key: string]: Word[] } = {};
  
        for (const lessonKey in merged) {
          updatedData[lessonKey] = updateWordStatus(merged[lessonKey], courses);
        }

        return updatedData;
      })
    }

    fetchLevel2Words()
  }, [lessons, courses, updateWordStatus])

  // Handle checkbox selection
  const handleWordSelection = (lessonId: string, wordId: string) => {
    console.log('id: ', lessonId)
    console.log('wid: ', wordId)
    setLessonsFiltered((prevLessons) =>
      prevLessons.map((lesson) =>
        lesson.id === lessonId
          ? {
            ...lesson,
            words: lesson.words.map((word) => (word.id === wordId ? { ...word, selected: !word.selected } : word)),
          }
          : lesson,
      ),
    )
    setLessons((prevLessons) =>
      prevLessons.map((lesson) =>
        lesson.id === lessonId
          ? {
            ...lesson,
            words: lesson.words.map((word) => (word.id === wordId ? { ...word, selected: !word.selected } : word)),
          }
          : lesson,
      ),
    )
  }
  const handleWordSelection2 = (dataId: string, wordId: string) => {
    console.log('dataid: ', dataId)
    setData((prevData) => {
      const updatedList = prevData[dataId].map((word) =>
        word.id === wordId ? { ...word, selected: !word.selected } : word
      );

      return {
        ...prevData,
        [dataId]: updatedList,
      };
    });

  };


  // Transfer selected words to course builder
  const transferSelectedWords = () => {
    const selectedWords: CourseWord[] = []

    // ✅ Lấy từ được chọn từ lessons
    lessons.forEach((lesson) => {
      lesson.words.forEach((word) => {
        if (word.selected) {
          selectedWords.push({
            wordId: word.id,
            pauseTime: "2",
            maxReads: "6",
            showIpa: "3",
            showWord: "1",
            showIpaAndWord: "2",
            readsPerRound: "6",
            progress: "0"
          })
        }
      })
    })

    // ✅ Lấy từ được chọn từ data
    Object.values(data).forEach((words) => {
      words.forEach((word) => {
        if (word.selected) {
          selectedWords.push({
            wordId: word.id,
            pauseTime: "2",
            maxReads: "6",
            showIpa: "3",
            showWord: "1",
            showIpaAndWord: "2",
            readsPerRound: "6",
            progress: "0"
          })
        }
      })
    })

    // ✅ Bỏ trùng id (nếu từ đã tồn tại trong courseWords)
    setCourseWords((prevWords) => {
      const existingIds = prevWords.map((w) => w.wordId)
      const newWords = selectedWords.filter((w) => !existingIds.includes(w.wordId))
      return [...prevWords, ...newWords]
    })

  }

  // Update course word properties
  const updateCourseWord = (wordId: string, field: keyof CourseWord, value: string) => {
    setCourseWords((prevWords) => prevWords.map((word) => (word.wordId === wordId ? { ...word, [field]: value } : word)))
  }
  const updateMaxReadsCourseWord = (wordId: string, value: string) => {
    const maxReads = Number(value);
    const showIpa = Math.floor(maxReads * 0.6);
    const showWord = Math.floor(maxReads * 0.3);
    const showIpaAndWord = maxReads - showIpa - showWord;
    const readsPerRound = maxReads < 6 ? maxReads : 6
    setCourseWords((prevWords) =>
      prevWords.map((word) =>
        word.wordId === wordId
          ? {
            ...word,
            maxReads: String(maxReads),
            showIpa: String(showIpa),
            showWord: String(showWord),
            showIpaAndWord: String(showIpaAndWord),
            readsPerRound: String(readsPerRound)
          }
          : word
      )
    );
  };

  // Remove word from course
  const removeCourseWord = (wordId: string) => {
    // Xóa khỏi danh sách course
    setCourseWords((prevWords) => prevWords.filter((word) => word.wordId !== wordId))

    // Bỏ chọn từ trong lessons
    setLessons((prevLessons) =>
      prevLessons.map((lesson) => ({
        ...lesson,
        words: lesson.words.map((word) =>
          word.id === wordId ? { ...word, selected: false } : word
        ),
      })),
    )
    setLessonsFiltered((prevLessons) =>
      prevLessons.map((lesson) => ({
        ...lesson,
        words: lesson.words.map((word) =>
          word.id === wordId ? { ...word, selected: false } : word
        ),
      })),
    )
    // Bỏ chọn từ trong data
    setData((prevData) => {
      const newData: typeof prevData = {}
      for (const key in prevData) {
        newData[key] = prevData[key].map((word) =>
          word.id === wordId ? { ...word, selected: false } : word
        )
      }
      return newData
    })

    console.log('đã xóa id: ', wordId)
  }

  const createCourse = async () => {
    if (courseWords.length === 0) {
      alert("Vui lòng thêm ít nhất một từ vào khóa học!")
      return
    }

    if (!courseName.trim()) {
      alert("Vui lòng nhập tên khóa học!")
      return
    }

    const payload = {
      name: courseName.trim(),
      estimatedTime: calculateEstimatedTime(),
      words: courseWords,
      done: "0"
    }

    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        let message = "Lỗi không xác định"
        try {
          const errorData = await res.json()
          message = errorData.error || message
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (err) {
          message = "Server không trả về JSON hợp lệ."
        }
        alert(`❌ Lỗi tạo khóa học: ${message}`)
        return
      }


      const createdCourse = await res.json()

      alert(`✅ Đã tạo khóa học "${createdCourse.name}" thành công với ${createdCourse.words.length} từ!`)

      // Reset state
      setCourseWords([])
      setCourseName("")
      setLessons(lessons)

      // Navigate
      router.push("/quanlykhoahoc")
    } catch (error) {
      console.error("Lỗi khi tạo khóa học:", error)
      alert("❌ Đã xảy ra lỗi khi gửi dữ liệu đến server.")
    }
  }

  // Get selected words count
  const getSelectedCount = () => {
    const lessonCount = lessonsFiltered.reduce(
      (total, lesson) => total + lesson.words.filter((word) => word.selected).length,
      0
    )

    const dataCount = Object.values(data).reduce(
      (total, words) => total + words.filter((word) => word.selected).length,
      0
    )

    return lessonCount + dataCount
  }

  // Calculate estimated time based on the formula:
  // For each word: readCount * (pauseTime * readCount)
  const calculateEstimatedTime = () => {
    let totalSeconds = 0

    courseWords.forEach((word) => {
      const readCount = Number.parseInt(word.maxReads) || 0

      if (readCount > 0) {
        // Each reading takes about 2 seconds
        const readingTime = readCount * 2
        totalSeconds += readingTime
      }
    })

    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60

    if (minutes > 0) {
      return `${minutes}p ${seconds}s`
    } else {
      return `${seconds}s`
    }
  }
  const sensors = useSensors(useSensor(PointerSensor))
  const [expandedWordIds, setExpandedWordIds] = useState<Record<string, boolean>>({})
  // ✅ Tạo bản đồ để lấy từ gốc theo wordId
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

  const toggleExpand = (wordId: string) => {
    setExpandedWordIds(prev => ({ ...prev, [wordId]: !prev[wordId] }))
  }
  const findListWordLevel2 = (
    data: { [key: string]: Word[] },
    wordId: string
  ): { id: string; words: Word[] } | null => {
    const words = data[wordId];
    if (words) {
      return { id: wordId, words };
    }
    return null;
  };
  const sortLessons = (lessons: { id: string, title: string, words: Word[] }[]) => {
    return [...lessons].sort((a, b) => a.title.localeCompare(b.title));
  };

  const [isAllSelected, setIsAllSelected] = useState(true);
  const [lessonsFiltered, setLessonsFiltered] = useState<Lesson[]>(lessons)
  const changeFilter = (lessonId: string, checked: boolean | "indeterminate") => {
    const lesson = lessons.find((l) => l.id === lessonId);
    if (!lesson) return;

    if (isAllSelected && checked === true) {
      // 👉 Đang chọn tất cả, giờ muốn chỉ chọn bài 1 → reset lại
      setIsAllSelected(false);
      setLessonsFiltered([lesson]);
      return;
    }

    setLessonsFiltered((prev) => {
      const newList = checked
        ? [...prev, lesson]
        : prev.filter((l) => l.id !== lessonId);
      return sortLessons(newList);
    });

  };

  useEffect(() => {
    if (lessonsFiltered.length === 0) {
      setIsAllSelected(true);
      setLessonsFiltered(lessons); // ✅ tự động chọn lại tất cả
    }
  }, [lessonsFiltered, lessons]);
  const findAllMatchedWords = (wordId: string, list_bai: Course[]): CourseWord[] => {
    const matchedWords: CourseWord[] = [];

    for (const bai of list_bai) {
      const matches = bai.words.filter((w) => w.wordId === wordId);
      matchedWords.push(...matches);
    }

    return matchedWords;
  };
  const findBelongLessons = (wordId: string, list_bai: Course[]): string => {
    const belongs: string[] = [];

    for (const bai of list_bai) {
      if (bai.words.some((w) => w.wordId === wordId)) {
        belongs.push(bai.name);
      }
    }

    return belongs.join(', ');
  };

  useEffect(() => {
    const fetchapi = async () => {
      try {
        const res_get_courses = await fetch(`/api/courses`)
        if (!res_get_courses.ok) throw new Error('Failed to fetch courses')
        const coursesData: Course[] = await res_get_courses.json()
        setCourses(coursesData)
      } catch (err) {
        console.error('Error fetching courses:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch courses')
      }
    }
    fetchapi();
  }, [setCourses]);

  useEffect(() => {
    if (!courses || courses.length === 0) return;

    console.log("✅ courses ready:", courses);

    setLessonsFiltered(() => {
      // console.log("1", lessons);
      const updatedLessons = lessons.map((lesson) => {
        // console.log("2")
        const updatedWords = lesson.words.map((word) => {
          // console.log("3")
          const matcheds = findAllMatchedWords(word.id, courses);
          const belong = findBelongLessons(word.id, courses);

          // console.log("Word ID:", word.id, "Matched:", matcheds, "Belong:", belong);

          if (matcheds.length < 1) return word;

          // const current = Number(matched.progress || 0);
          // const maxReads = Number(matched.maxReads || 0);
          const isDone = matcheds.some(
            (matched) => Number(matched.progress || 0) >= Number(matched.maxReads || 0)
          );
          return {
            ...word,
            done: isDone,
            belong: belong ?? "",
          };
        });

        return {
          ...lesson,
          words: updatedWords,
        };
      });

      return updatedLessons;
    });

  }, [courses, lessons]);


  return (
    <div className="min-h-screen bg-gray-100">
      {/* Fixed Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Tạo bài học</h1>
            <Button onClick={() => router.push("/quanlykhoahoc")} variant="outline">
              Quản lý bài học
            </Button>
          </div>
        </div>
      </nav>

      {/* Loading State */}
      {loading && (
        <div className="pt-16 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="pt-16 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Có lỗi xảy ra</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700">
              Thử lại
            </Button>
          </div>
        </div>
      )}

      {/* Main Content - only show when not loading and no error */}
      {!loading && !error && (
      <div className="pt-16 h-screen flex">
        {/* Left Panel - Word Selection */}
        <div className="w-1/3 bg-gray-100 border-r border-gray-300 overflow-y-auto">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Chọn từ vựng</h2>
            <div className="mb-6">
              <Card className="bg-white shadow-sm border border-gray-200">
                <CardHeader className="pb-4">
                  <CardTitle>Bộ lọc</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-5">
                    <div key={'all'} className="space-x-1 flex items-center">
                      <label htmlFor="all">Tất cả</label>
                      <Checkbox
                        id="all"
                        checked={isAllSelected}
                        onCheckedChange={(checked) => {
                          setIsAllSelected(checked === true);
                          if (checked) {
                            setLessonsFiltered(lessons);
                          } else {
                            setLessonsFiltered([]);
                          }
                        }}
                      />
                    </div>
                    {lessons.map((lesson) => (
                      <div key={lesson.id} className="space-x-1 flex items-center">
                        <label htmlFor={`bai${lesson.id}`}>Bài {lesson.id}</label>
                        <Checkbox
                          id={`bai${lesson.id}`}
                          checked={
                            isAllSelected
                              ? false // hiển thị unchecked nếu đang chọn "Tất cả"
                              : lessonsFiltered.some((l) => l.id === lesson.id)
                          }
                          onCheckedChange={(checked) => changeFilter(lesson.id, checked)}
                        />

                      </div>
                    ))}

                  </div>
                </CardContent>
              </Card>
            </div>

            {lessonsFiltered.map((lesson) => (
              <div key={lesson.id} className="mb-6 bg-white rounded-lg">
                <div className="text-center p-2">{lesson.title}</div>
                <Table className="">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="">Từ</TableHead>
                      <TableHead className="text-center">Độ phổ biến</TableHead>
                      <TableHead className="max-w-[100px]">Thuộc</TableHead>
                      <TableHead className="text-center">Xong</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lesson.words.map((word) => {
                      const wordLevel2 = findListWordLevel2(data, word.id)
                      return (
                        <React.Fragment key={word.id}>

                          <TableRow
                            className={clsx("",
                              courseWords.some((w) => w.wordId === word.id) &&
                              "opacity-50 cursor-not-allowed"
                            )}
                            onClick={
                              !courseWords.some((w) => w.wordId === word.id)
                                ? () => handleWordSelection(lesson.id, word.id)
                                : undefined
                            }
                          >
                            <TableCell className="w-1/3">
                              <div className=" text-sm font-medium text-gray-900">
                                {word.word}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-center">{word.popularity}</div>
                            </TableCell>

                            <TableCell className="max-w-[100px]">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="text-sm text-gray-600 truncate cursor-default">
                                      {word.belong}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">
                                    {word.belong}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>

                            <TableCell className="flex justify-center items-center">
                              {word.done && <Check className="text-green-500 w-4 h-4" />}
                            </TableCell>
                            <TableCell>
                              <Checkbox
                                id={word.id}
                                disabled={courseWords.some((w) => w.wordId === word.id)}
                                checked={word.selected}
                                onCheckedChange={() =>
                                  handleWordSelection(lesson.id, word.id)
                                }
                                onClick={(e) => e.stopPropagation()}
                                className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 cursor-pointer"
                              />
                            </TableCell>
                          </TableRow>

                          {wordLevel2 &&
                            (expandedWordIds[word.id]
                              ? wordLevel2.words
                              : wordLevel2.words.slice(0, 3)
                            ).map((childWord) => (
                              <TableRow
                                key={childWord.id}
                                className={clsx(
                                  "bg-gray-50",
                                  courseWords.some((w) => w.wordId === childWord.id) &&
                                  "opacity-50 cursor-not-allowed"
                                )}
                                onClick={
                                  !courseWords.some((w) => w.wordId === childWord.id)
                                    ? () => handleWordSelection2(wordLevel2.id, childWord.id)
                                    : undefined
                                }
                              >
                                <TableCell>
                                  <div className="text-sm font-medium text-gray-900">
                                    <span className="ml-5">
                                      {childWord.word}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm text-center">
                                  {childWord.popularity}
                                </TableCell>

                                <TableCell className="max-w-[100px] truncate">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="text-sm text-gray-600 truncate cursor-default">
                                          {childWord.belong}
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent side="top">
                                        {childWord.belong}
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </TableCell>

                                <TableCell className="flex justify-center items-center">
                                  {childWord.done && <Check className="text-green-500 w-4 h-4" />}
                                </TableCell>
                                <TableCell>
                                  <Checkbox
                                    id={childWord.id}
                                    disabled={courseWords.some((w) => w.wordId === childWord.id)}
                                    checked={childWord.selected}
                                    onCheckedChange={() =>
                                      handleWordSelection2(wordLevel2.id, childWord.id)
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 cursor-pointer"
                                  />
                                </TableCell>
                              </TableRow>
                            ))}


                          {wordLevel2 && wordLevel2.words.length > 3 && (
                            <TableRow>
                              <TableCell colSpan={5}>
                                <Button
                                  onClick={() => toggleExpand(word.id)}
                                  className="text-blue-600 text-sm hover:underline"
                                >
                                  {expandedWordIds[word.id] ? "Thu gọn" : "Mở rộng"}
                                </Button>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      )
                    })}
                  </TableBody>
                </Table>
                {/* </CardContent> */}
                {/* </Card> */}
              </div>
            ))}
          </div>
        </div>

        {/* Middle Panel - Action Control */}
        <div className=" flex flex-col items-center justify-center mx-4">
          <div className="text-center">
            <Button
              onClick={transferSelectedWords}
              disabled={getSelectedCount() === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-all duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm"
            >
              <ChevronRight className="w-4 h-4 mr-1" />
              <span className="text-sm font-medium">chuyển tiếp</span>
            </Button>
            {getSelectedCount() > 0 && (
              <div className="mb-3 text-xs text-gray-600 font-medium">{getSelectedCount()} từ đã chọn</div>
            )}
          </div>
        </div>

        {/* Right Panel - Course Building Table */}
        <div className="flex-1 border-l border-gray-300 bg-gray-100 overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Bài học mới ({courseWords.length} từ)</h2>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Label htmlFor="course-name" className="text-sm font-medium text-gray-700">
                    Tên bài học:
                  </Label>
                  <Input
                    id="course-name"
                    type="text"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    placeholder="Nhập tên bài học"
                    className="w-48 text-sm"
                  />
                </div>

                {courseWords.length > 0 && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Thời gian ước chừng: </span>
                    <span className="text-blue-600 font-semibold">{calculateEstimatedTime()}</span>
                  </div>
                )}
                <Button
                  onClick={createCourse}
                  disabled={courseWords.length === 0 || !courseName.trim()}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-all duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="font-medium">tạo bài học</span>
                </Button>
              </div>
            </div>

            {courseWords.length === 0 ? (
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardContent className="p-12 text-center">
                  <div className="text-gray-400">
                    <div className="text-5xl mb-4">📚</div>
                    <p className="text-lg font-medium mb-2 text-gray-600">Chưa có từ vựng nào</p>
                    <p className="text-sm text-gray-500">
                      Chọn từ vựng từ panel bên trái và nhấn &quot;chuyển tiếp&quot; để thêm vào khóa học
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white shadow-sm border border-gray-200">
                <CardContent className="p-0">
                  <DndContext
                    collisionDetection={closestCenter}
                    onDragEnd={({ active, over }) => {
                      if (active.id !== over?.id) {
                        const oldIndex = courseWords.findIndex((w) => w.wordId === active.id)
                        const newIndex = courseWords.findIndex((w) => w.wordId === over?.id)
                        setCourseWords((words) => arrayMove(words, oldIndex, newIndex))
                      }
                    }}
                    sensors={sensors}
                  >
                    <Table className="">
                      <TableHeader>
                        <TableRow className="bg-gray-50 border-b border-gray-200">
                          <TableHead className="font-semibold text-gray-700 py-4 px-6">Từ vựng</TableHead>
                          <TableHead className="font-semibold text-gray-700 py-4 px-4 w-32 text-center">
                            số lần đọc tối đa
                          </TableHead>
                          <TableHead className="font-semibold text-gray-700 py-4 px-4 w-32 text-center">
                            số lần hiện IPA
                          </TableHead>
                          <TableHead className="font-semibold text-gray-700 py-4 px-4 w-32 text-center">
                            số lần hiện từ
                          </TableHead>
                          <TableHead className="font-semibold text-gray-700 py-4 px-4 w-32 text-center">
                            số lần hiện IPA và từ
                          </TableHead>
                          <TableHead className="font-semibold text-gray-700 py-4 px-4 w-32 text-center">
                            số lần đọc trong 1 lần
                          </TableHead>
                          <TableHead className="font-semibold text-gray-700 py-4 px-4 w-32 text-center">khoảng dừng</TableHead>
                          <TableHead className="w-16 py-4 px-4"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <SortableContext items={courseWords.map((w) => w.wordId)} strategy={verticalListSortingStrategy}>
                        <TableBody className="">
                          {courseWords.map((cw) => {
                            const word = allWordsById[cw.wordId]
                            if (!word) return null;

                            return (<SortableRow
                              key={word.id}
                              word={word}
                              updateCourseWord={updateCourseWord}
                              removeCourseWord={removeCourseWord}
                              courseWord={cw}
                              updateMaxReadsCourseWord={updateMaxReadsCourseWord}
                            />)
                          })}
                        </TableBody>
                      </SortableContext>

                    </Table>
                  </DndContext>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  )
}

const SortableRow = ({ word,
  courseWord, updateCourseWord, removeCourseWord, updateMaxReadsCourseWord }: {
    word: Word
    courseWord: CourseWord
    updateMaxReadsCourseWord: (id: string, value: string) => void
    updateCourseWord: (id: string, field: keyof CourseWord, value: string) => void
    removeCourseWord: (id: string) => void
  }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: word.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      {...attributes}
      // {...listeners}
      className="hover:bg-gray-50 transition-colors border-b border-gray-100 cursor-move"
    >
      {/* <TableCell className="py-4 px-4 text-gray-400 cursor-move" {...listeners}>
        <span className="text-lg">⠿</span>
      </TableCell> */}
      <TableCell className="py-4 px-6 flex items-center justify-between" {...listeners}>
        <div>
          <div className="font-medium text-gray-900">{word.word}</div>
          <div className="text-xs text-gray-400 ipa-text">{word.ipa}</div>
        </div>
      </TableCell>

      <TableCell className="py-4 px-4 cursor-default">
        <Input
          type="number"
          value={courseWord.maxReads}
          onChange={(e) => updateMaxReadsCourseWord(courseWord.wordId, e.target.value)}
          placeholder="0"
          className="w-full text-sm text-center"
          min="0"
        />
      </TableCell >
      <TableCell className="py-4 px-4 cursor-default">
        <Input
          type="number"
          value={courseWord.showIpa}
          onChange={(e) => updateCourseWord(courseWord.wordId, "showIpa", e.target.value)}
          placeholder="0"
          className="w-full text-sm text-center"
          min="0"
          max={Number(courseWord.maxReads) - (Number(courseWord.showIpaAndWord) + Number(courseWord.showWord))}
        />
      </TableCell>
      <TableCell className="py-4 px-4 cursor-default">
        <Input
          type="number"
          value={courseWord.showWord}
          onChange={(e) => updateCourseWord(courseWord.wordId, "showWord", e.target.value)}
          placeholder="0"
          className="w-full text-sm text-center"
          min="0"
          max={Number(courseWord.maxReads) - (Number(courseWord.showIpaAndWord) + Number(courseWord.showIpa))}
        />
      </TableCell>
      <TableCell className="py-4 px-4 cursor-default">
        <Input
          type="number"
          value={courseWord.showIpaAndWord}
          onChange={(e) => updateCourseWord(courseWord.wordId, "showIpaAndWord", e.target.value)}
          placeholder="0"
          className="w-full text-sm text-center"
          min="0"
          max={Number(courseWord.maxReads) - (Number(courseWord.showIpa) + Number(courseWord.showWord))}
        />
      </TableCell>
      <TableCell className="py-4 px-4 cursor-default">
        <Input
          type="number"
          value={courseWord.readsPerRound}
          onChange={(e) => updateCourseWord(courseWord.wordId, "readsPerRound", e.target.value)}
          placeholder="0"
          className="w-full text-sm text-center"
          min="1"
          max={courseWord.maxReads}
        />
      </TableCell>
      <TableCell className="py-4 px-4 cursor-default">
        <div className="flex items-center space-x-2">
          <Input
            id="pause-time"
            type="number"
            value={courseWord.pauseTime}
            onChange={(e) => updateCourseWord(courseWord.wordId, "pauseTime", e.target.value)}
            placeholder="0"
            className="w-full text-sm text-center"
            min="0"
          />
          <span>
            giây
          </span>
        </div>
      </TableCell>
      <TableCell className="py-4 px-4 cursor-default">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            console.log("Đã bấm nút X của từ:", courseWord.wordId)
            removeCourseWord(courseWord.wordId)
          }}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </Button>
      </TableCell>
    </TableRow>
  )
}



