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
// import { Lesson } from "@/types" // TODO: Use when refactoring
import Loading from "@/components/ui/loading"
import ErrorHandler from "../../components/ui/error-handler"
import { useLesson } from "@/hooks/use-lessons"
import { useCourses, useCreateCourse } from "@/hooks/use-courses"
import { Word } from "@/types"

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

interface Course {
  id: string
  name: string
  words: CourseWord[]
  createdAt: string
  estimatedTime: string
  done: string
}

// TODO: MAJOR REFACTORING NEEDED - HIGH PRIORITY
// Trang này có logic rất phức tạp và cần refactor hoàn toàn để sử dụng React Query
// Hiện tại giữ nguyên để tránh break functionality
// Khi refactor cần:
// 1. Sử dụng useLesson(lessonId) thay cho manual fetch
// 2. Sử dụng useCourses() thay cho manual fetch  
// 3. Sử dụng useCreateCourse() mutation thay cho manual POST
// 4. Cleanup tất cả manual state management
// 5. Fix type conflicts giữa LocalWord và Word interface
// 6. Đảm bảo drag & drop functionality vẫn hoạt động

// Revert to original structure to maintain functionality
interface LocalWord extends Word {
  "selected": boolean
  "done": boolean,
  "popularity": number,
  "belong": string
  "ipa": string // Add ipa property for compatibility
}

interface LessonUnit {
  id: string
  title: string
  words: {
    id: string
    word: string
    meaning: string
    ipa: string
    selected: boolean
    done: boolean
    popularity: number
    belong: string
  }[]
}

interface LessonWithWords {
  id: string
  title: string
  words: LocalWord[]
}

export default function TaoKhoaHocPage() {
  // Get URL params
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams()
  const lessonId = searchParams.get("id")
  const mode = searchParams.get("mode") // Check for edit mode
  
  // State for edit mode
  const [isEditMode, setIsEditMode] = useState(false)
  const [editCourseData, setEditCourseData] = useState<{
    id: string
    name: string
    lessonListId: string
    wordDetails: Array<{
      wordId: string
      progress: string
      word: string
      meaning: string
      pronunciation: string
    }>
  } | null>(null)
  const [actualLessonId, setActualLessonId] = useState<string | null>(lessonId)
  
  // Handle edit mode - load data from sessionStorage
  useEffect(() => {
    if (mode === 'edit') {
      setIsEditMode(true)
      
      // Try editCourseData first (from quanlybaihoc)
      let storedData = sessionStorage.getItem('editCourseData')
      let dataKey = 'editCourseData'
      
      // If not found, try editLessonData (from taodanhsachbaihoc)
      if (!storedData) {
        storedData = sessionStorage.getItem('editLessonData')
        dataKey = 'editLessonData'
      }
      
      if (storedData) {
        try {
          const courseData = JSON.parse(storedData)
          
          if (dataKey === 'editLessonData') {
            // Convert editLessonData format to editCourseData format
            const convertedData = {
              id: courseData.id,
              name: courseData.name,
              lessonListId: courseData.lessonListId,
              wordDetails: courseData.exercises ? courseData.exercises.map((exerciseName: string, index: number) => ({
                wordId: `word_${index}`, // Temporary ID, will be resolved when lesson loads
                progress: "0",
                word: exerciseName,
                meaning: "",
                pronunciation: ""
              })) : []
            }
            setEditCourseData(convertedData)
          } else {
            setEditCourseData(courseData)
          }
          
          // Set lesson ID from editCourseData or editLessonData
          if (courseData.lessonListId) {
            setActualLessonId(courseData.lessonListId)
          }
          
          // Set course name from edit data
          setCourseName(courseData.name || '')
          
        } catch (error) {
          console.error('Error parsing edit course data:', error)
        }
      }
    } else {
      setIsEditMode(false)
      setEditCourseData(null)
      setActualLessonId(lessonId)
    }
  }, [mode, lessonId])
  
  // React Query hooks - use actualLessonId instead of lessonId
  const { data: lesson, isLoading: isLessonLoading, error: lessonError } = useLesson(actualLessonId || '')
  const { data: courses = [], isLoading: isCoursesLoading, error: coursesError } = useCourses()
  const createCourseMutation = useCreateCourse()

  // Local state for complex UI functionality
  const [data, setData] = useState<{
    [key: string]: LocalWord[]
  }>({})
  const [courseWords, setCourseWords] = useState<CourseWord[]>([])
  const [courseName, setCourseName] = useState("")
  const [expandedWordIds, setExpandedWordIds] = useState<Record<string, boolean>>({})
  const [isAllSelected, setIsAllSelected] = useState(true)
  const [lessonsFiltered, setLessonsFiltered] = useState<LessonWithWords[]>([])
  
  const router = useRouter()

  // Derived state
  const loading = isLessonLoading || isCoursesLoading
  // 🔧 In edit mode, don't show NO_LESSON_SELECTED error even if actualLessonId is null initially
  const error = lessonError || coursesError || 
    (!isEditMode && !actualLessonId ? "NO_LESSON_SELECTED" : null)
  
  // Pre-populate courseWords in edit mode
  useEffect(() => {
    if (!isEditMode) return
    if (courseWords.length > 0) return // Already populated
    
    // Check if all required data is available
    const editCourseDataId = editCourseData?.id
    const hasLessonsData = lessonsFiltered.length > 0
    
    if (!editCourseDataId || !actualLessonId || !hasLessonsData) return
    
    // Wait for data to be populated
    const hasDataWords = Object.keys(data).length > 0
    if (!hasDataWords) return
    
    // Create a word lookup map from lesson data
    const wordLookup: Record<string, LocalWord> = {}
    
    // Add words from lessons
    lessonsFiltered.forEach(lessonItem => {
      lessonItem.words.forEach(word => {
        wordLookup[word.word] = word
        wordLookup[word.id] = word
      })
    })
    
    // Add words from level2 data
    Object.values(data).forEach(words => {
      words.forEach(word => {
        wordLookup[word.word] = word
        wordLookup[word.id] = word
      })
    })
    
    // Convert editCourseData to CourseWord format
    let editCourseWords: CourseWord[] = []
    
    if (editCourseData.wordDetails && editCourseData.wordDetails.length > 0) {
      // From editCourseData (quanlybaihoc route)
      editCourseWords = editCourseData.wordDetails.map(wordDetail => ({
        wordId: wordDetail.wordId,
        progress: wordDetail.progress,
        pauseTime: "3000",
        maxReads: "3",
        showIpa: "2",
        showWord: "1", 
        showIpaAndWord: "0",
        readsPerRound: "1"
      }))
    } else {
      // From editLessonData (taodanhsachbaihoc route) - use words array directly
      const storedLessonData = sessionStorage.getItem('editLessonData')
      if (storedLessonData) {
        try {
          const lessonData = JSON.parse(storedLessonData)
          if (lessonData.words && Array.isArray(lessonData.words)) {
            // Set courseWords directly from the words array
            editCourseWords = lessonData.words.map((word: CourseWord) => ({
              wordId: word.wordId,
              progress: word.progress || "0",
              pauseTime: word.pauseTime || "3000",
              maxReads: word.maxReads || "3",
              showIpa: word.showIpa || "2",
              showWord: word.showWord || "1", 
              showIpaAndWord: word.showIpaAndWord || "0",
              readsPerRound: word.readsPerRound || "1"
            }))
          }
        } catch (error) {
          console.error('Error parsing editLessonData:', error)
        }
      }
    }
    
    // Only update if we have words
    if (editCourseWords.length > 0) {
      setCourseWords(editCourseWords)
      
      // Mark corresponding words as selected in lessonsFiltered and update belong field
      setLessonsFiltered(prev => 
        prev.map(lesson => ({
          ...lesson,
          words: lesson.words.map(word => ({
            ...word,
            selected: editCourseWords.some(cw => cw.wordId === word.id),
            belong: editCourseWords.some(cw => cw.wordId === word.id) 
              ? (word.belong ? `${word.belong}, ${courseName || editCourseData.name}` : courseName || editCourseData.name)
              : word.belong
          }))
        }))
      )
      
      // Mark corresponding words as selected in data and update belong field
      setData(prev => {
        const newData = { ...prev }
        Object.keys(newData).forEach(key => {
          newData[key] = newData[key].map(word => ({
            ...word,
            selected: editCourseWords.some(cw => cw.wordId === word.id),
            belong: editCourseWords.some(cw => cw.wordId === word.id) 
              ? (word.belong ? `${word.belong}, ${courseName || editCourseData.name}` : courseName || editCourseData.name)
              : word.belong
          }))
        })
        return newData
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, courseWords.length, lessonsFiltered.length, Object.keys(data).length])
  
  // Convert lesson data to expected format with proper type safety
  const lessons = useMemo((): LessonWithWords[] => {
    if (!lesson || !Array.isArray(lesson)) return []
    
    // API trả về mảng các units, convert thành LessonWithWords format
    return (lesson as LessonUnit[]).map((unit) => {
      const wordsWithLocalProps: LocalWord[] = unit.words.map((word) => ({
        ...word,
        pronunciation: word.ipa, // Ensure pronunciation is available
        selected: false,
        done: false,
        popularity: word.popularity || 0,
        belong: word.belong || "",
        ipa: word.ipa || ""
      }))
      
      return {
        id: unit.id,
        title: unit.title,
        words: wordsWithLocalProps
      }
    })
  }, [lesson])

  // ✅ Helper functions để update word status
  const updateWordStatus = useCallback((words: LocalWord[], courses: Course[]) => {
    return words.map((word: LocalWord) => {
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

  // Update lessons when data changes
  useEffect(() => {
    if (!lesson || !Array.isArray(lesson) || !courses.length) return

    // ✅ Lấy wordId của các từ đã học
    const learnedWordIds = new Set(
      courses
        .filter(course => course.done === "100")
        .flatMap(course => course.words.map(word => word.wordId))
    )

    // ✅ Cập nhật lessons với trạng thái học - xử lý mảng units
    const finalLessons: LessonWithWords[] = (lesson as LessonUnit[]).map((unit) => {
      const wordsWithLearnedStatus: LocalWord[] = unit.words.map((word) => ({
        ...word,
        pronunciation: word.ipa,
        selected: false,
        done: learnedWordIds.has(word.id),
        popularity: word.popularity || 0,
        belong: word.belong || "",
        ipa: word.ipa || ""
      }));
      
      return {
        id: unit.id,
        title: unit.title,
        words: updateWordStatus(wordsWithLearnedStatus, courses)
      };
    });

    setLessonsFiltered(finalLessons)
  }, [lesson, courses, updateWordStatus])

  // ✅ Loại bỏ useEffect thứ hai để tránh conflict
  // useEffect(() => {
  //   const fetchapi = async () => {
  //     // ... code cũ
  //   }
  //   fetchapi();
  // }, [setCourses]);



  useEffect(() => {
    if (lessonsFiltered.length === 0) return

    const fetchLevel2Words = async () => {
      const requests: Promise<[string, LocalWord[] | null]>[] = []

      for (const lesson of lessonsFiltered) {
        for (const word of lesson.words) {
          const promise = fetch(`/api/word/level2/list/${word.id}`)
            .then(async (res) => {
              if (!res.ok) return [word.id, null] as [string, null]
              const data = await res.json()
              if (!Array.isArray(data)) return [word.id, null] as [string, null]
              return [word.id, data] as [string, LocalWord[]]
            })
            .catch(() => [word.id, null] as [string, null])

          requests.push(promise)
        }
      }

      const responses = await Promise.all(requests)

      // Chuyển thành map { [wordId]: LocalWord[] }
      const resultMap: Record<string, LocalWord[]> = {}

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
              done: learnedWordIds.includes(newWord.id),
              popularity: newWord.popularity || 0,
              belong: ""
            }
          })

          merged[key] = mergedWords
        }

        // ✅ Cập nhật với progress và belong info từ courses
        const updatedData: { [key: string]: LocalWord[] } = {};
  
        for (const lessonKey in merged) {
          updatedData[lessonKey] = updateWordStatus(merged[lessonKey], courses);
        }

        return updatedData;
      })
    }

    fetchLevel2Words()
  }, [lessonsFiltered, courses, updateWordStatus])

  // Handle checkbox selection
  const handleWordSelection = (lessonId: string, wordId: string) => {
    console.log('handleWordSelection called:', { lessonId, wordId })
    
    // Find the selected word to debug
    const selectedLesson = lessonsFiltered.find(l => l.id === lessonId)
    const selectedWord = selectedLesson?.words.find(w => w.id === wordId)
    console.log('Selected word details:', selectedWord)
    
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
  }
  const handleWordSelection2 = (dataId: string, wordId: string) => {
    console.log('handleWordSelection2 called:', { dataId, wordId })
    
    // Find the selected word to debug
    const selectedWord = data[dataId]?.find(w => w.id === wordId)
    console.log('Selected word details from data:', selectedWord)
    
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

    console.log('=== TRANSFER DEBUG START ===')
    
    // Debug: Check all selected words in lessonsFiltered
    lessonsFiltered.forEach((lesson) => {
      const selectedInLesson = lesson.words.filter(w => w.selected)
      if (selectedInLesson.length > 0) {
        console.log(`Lesson ${lesson.title} has ${selectedInLesson.length} selected words:`, selectedInLesson.map(w => `${w.word} (${w.id})`))
      }
    })

    // Debug: Check all selected words in data
    Object.keys(data).forEach((dataKey) => {
      const selectedInData = data[dataKey].filter(w => w.selected)
      if (selectedInData.length > 0) {
        console.log(`Data ${dataKey} has ${selectedInData.length} selected words:`, selectedInData.map(w => `${w.word} (${w.id})`))
      }
    })

    // ✅ Lấy từ được chọn từ lessons
    lessonsFiltered.forEach((lesson) => {
      lesson.words.forEach((word) => {
        if (word.selected) {
          console.log('Adding word from lesson:', word)
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
          console.log('Adding word from data:', word)
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

    console.log('All selected words to transfer:', selectedWords)
    console.log('=== TRANSFER DEBUG END ===')

    // ✅ Bỏ trùng id (nếu từ đã tồn tại trong courseWords)
    setCourseWords((prevWords) => {
      const existingIds = prevWords.map((w) => w.wordId)
      const newWords = selectedWords.filter((w) => !existingIds.includes(w.wordId))
      console.log('New words after deduplication:', newWords)
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

    // Bỏ chọn từ trong lessonsFiltered
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

    if (!actualLessonId) {
      alert("Không tìm thấy ID bài học!")
      return
    }

    const payload = {
      name: courseName.trim(),
      estimatedTime: calculateEstimatedTime(),
      words: courseWords,
      done: "0",
      lessonListId: actualLessonId // Sử dụng actualLessonId thay vì lessonId
    }

    try {
      if (isEditMode && editCourseData?.id) {
        // Update existing course
        const response = await fetch(`/api/courses/${editCourseData.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const updatedCourse = await response.json()
        alert(`✅ Đã cập nhật bài học "${updatedCourse.name}" thành công với ${updatedCourse.words.length} từ!`)
      } else {
        // Create new course
        const createdCourse = await createCourseMutation.mutateAsync(payload)
        alert(`✅ Đã tạo khóa học "${createdCourse.name}" thành công với ${createdCourse.words.length} từ!`)
      }

      // Reset state
      setCourseWords([])
      setCourseName("")

      // Clear edit data
      if (isEditMode) {
        sessionStorage.removeItem('editCourseData')
        sessionStorage.removeItem('editLessonData')
      }

      // Navigate
      router.push("/quanlybaihoc")
    } catch (error) {
      console.error("Lỗi khi tạo/cập nhật khóa học:", error)
      alert(`❌ Lỗi ${isEditMode ? 'cập nhật' : 'tạo'} khóa học: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`)
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
  
  // ✅ Tạo bản đồ để lấy từ gốc theo wordId
  const allWordsById = useMemo(() => {
    const result: Record<string, LocalWord> = {}

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
    data: { [key: string]: LocalWord[] },
    wordId: string
  ): { id: string; words: LocalWord[] } | null => {
    const words = data[wordId];
    if (words) {
      return { id: wordId, words };
    }
    return null;
  };
  
  const sortLessons = (lessons: { id: string, title: string, words: LocalWord[] }[]) => {
    return [...lessons].sort((a, b) => a.title.localeCompare(b.title));
  };


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

  return (
    // <NoCopyWrapper>
      <div className="min-h-screen bg-gray-100">
        {/* Fixed Top Navbar */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-gray-900">
                {isEditMode ? "Chỉnh sửa bài học" : "Tạo bài học"}
              </h1>
              <Button className="bg-blue-600 text-white" onClick={() => router.push("/quanlybaihoc")} variant="outline">
                Quản lý bài học
              </Button>
            </div>
          </div>
        </nav>

        {/* Loading State */}
        {loading && (
          <Loading 
            variant="skeleton" 
            skeletonType="tao-bai-hoc"
          />
        )}

        {/* Error State - Using unified ErrorHandler */}
        {error && !loading && (
          <ErrorHandler
            type={error === "NO_LESSON_SELECTED" ? "NO_LESSON_SELECTED" : "GENERAL_ERROR"}
            title={error === "NO_LESSON_SELECTED" ? "Chưa chọn  giáo trình tùy chỉnh" : "Không thể tải dữ liệu bài học"}
            message={error === "NO_LESSON_SELECTED" 
              ? "Bạn cần chọn một giáo trình tùy chỉnh trước khi tạo bài học mới"
              : "Đã xảy ra lỗi khi tải danh sách từ vựng và khóa học. Vui lòng thử lại."
            }
            errorDetails={error !== "NO_LESSON_SELECTED" ? (error instanceof Error ? error.message : String(error)) : undefined}
            onRetry={error !== "NO_LESSON_SELECTED" ? () => window.location.reload() : undefined}
            onGoBack={() => router.push("/quanlygiaotrinh")}
            onGoHome={() => router.push("/")}
            onActionButton={() => window.location.href = '/quanlygiaotrinh'}
            labelActionButton="Đi đến Quản lý giáo trình"
          />
        )}

        {/* Main Content - only show when not loading and no error */}
        {!loading && !error && (
          <div className="pt-20 h-screen flex">
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
                            <label htmlFor={`bai${lesson.id}`}>{lesson.title}</label>
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
                                <TableRow >
                                  <TableCell colSpan={5} className="text-end">
                                    <Button
                                      onClick={() => toggleExpand(word.id)}
                                      className="text-blue-600 text-sm hover:underline cursor-pointer"
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
                      <span className="font-medium">
                        {isEditMode ? "Cập nhật bài học" : "Tạo bài học"}
                      </span>
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
    // </NoCopyWrapper>
  )
}

const SortableRow = ({ word,
  courseWord, updateCourseWord, removeCourseWord, updateMaxReadsCourseWord }: {
    word: LocalWord
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



