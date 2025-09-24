"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronRight, Plus, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter, useSearchParams } from "next/navigation"
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
import React from "react"
import { Lesson, LessonWord, Word } from "@/lib/types"
import { useCreateLesson, useCurriculumCustomById, useLessonById, useUpdateLesson } from "@/hooks"
import Loading from "@/components/ui/loading"

// Revert to original structure to maintain functionality
interface LocalWord extends Word {
  "selected": boolean
  "done": boolean,
  "popularity": number,
  "belong": string
  "ipa": string // Add ipa property for compatibility
}

interface LessonWithWords {
  id: string
  title: string
  words: LocalWord[]
}

export default function TaoKhoaHocPage() {
  // Get URL params via Next navigation hook (client-safe and stable)
  const searchParams = useSearchParams()
  const ccId = (searchParams?.get("id") || '')
  const mode = searchParams?.get("mode") // Check for edit mode
  const lessonId = searchParams?.get("lid")
  // State for edit mode
  const [isEditMode, setIsEditMode] = useState(false)
  // removed unused editCourseData state (prefill handled from lessonById)
  const [actualCCId, setActualCCId] = useState<string>(ccId)

  // Handle edit mode - toggle flag and track ccId
  useEffect(() => {
    if (mode === 'edit') {
      setIsEditMode(true)
    } else {
      setIsEditMode(false)
      setActualCCId(ccId)
    }
  }, [mode, ccId])

  // React Query hooks - use actualCCId instead of ccId
  const { data: customCurriculum, isLoading: customCurriculumLoading } = useCurriculumCustomById(actualCCId || '')
  const { data: lessonById, isLoading: lessonByIdLoading } = useLessonById(lessonId)
  const { mutate: createLessonMutation } = useCreateLesson()
  const { mutate: updateLessonMutation } = useUpdateLesson()

  const isLoading = customCurriculumLoading || lessonByIdLoading
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  const [data, setData] = useState<{
    [key: string]: LocalWord[]
  }>({})
  const [lessonsFiltered, setLessonsFiltered] = useState<LessonWithWords[]>([])
  const [lessonWords, setLessonWords] = useState<LessonWord[]>([])
  const [courseName, setCourseName] = useState("")
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([])
  const [expandedChildGroups, setExpandedChildGroups] = useState<Set<string>>(new Set())

  const router = useRouter()

  // Normalize units: backend may send words under different keys (list_word, list_words, words)
  const normalizedUnits = useMemo(() => {
    const units = (customCurriculum && Array.isArray((customCurriculum).list_unit)) ? (customCurriculum).list_unit : []
    return units.map((u) => {
      const list_word = u.list_word
      return { ...u, list_word }
    })
  }, [customCurriculum])

  // Initialize selectedUnitIds to all units by default and prepare data map
  useEffect(() => {
    if (!Array.isArray(normalizedUnits) || normalizedUnits.length === 0) return
    const allIds = normalizedUnits.map((u) => u.id)
    setSelectedUnitIds(allIds)

    // initialize data map for left-panel selection if empty
    setData((prev) => {
      // only initialize if prev is empty to avoid clobbering user selections
      if (Object.keys(prev).length > 0) return prev
      const initialData: { [key: string]: LocalWord[] } = {}
      normalizedUnits.forEach((u) => {
        const words: LocalWord[] = (u.list_word || []).map((w: Word) => ({
          id: w.id,
          word: w.word,
          meaning: w.meaning || '',
          ipa: w.ipa || '',
          selected: false,
          done: false,
          popularity: (w.popularity as number) || 0,
          belong: ''
        }))
        initialData[u.id] = words
      })
      return initialData
    })
  }, [normalizedUnits])

  // helper removed: not used in this component

  // Update lessons when data changes

  // Transfer selected words to course builder
  const transferSelectedWords = () => {
    const selectedWords: LessonWord[] = []

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
            id: word.id,
            word: word.word,
            meaning: word.meaning,
            ipa: word.ipa,
            pause_time: "2",
            maxRead: "6",
            show_ipa: "3",
            show_word: "1",
            show_ipa_and_word: "2",
            reads_per_round: "6",
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
            id: word.id,
            meaning: word.meaning,
            ipa: word.ipa,
            word: word.word,
            pause_time: "2",
            maxRead: "6",
            show_ipa: "3",
            show_word: "1",
            show_ipa_and_word: "2",
            reads_per_round: "6",
            progress: "0"
          })
        }
      })
    })

    console.log('All selected words to transfer:', selectedWords)
    console.log('=== TRANSFER DEBUG END ===')

    // ✅ Bỏ trùng id (nếu từ đã tồn tại trong courseWords)
    setLessonWords((prevWords) => {
      const existingIds = prevWords.map((w) => w.id)
      const newWords = selectedWords.filter((w) => !existingIds.includes(w.id))
      console.log('New words after deduplication:', newWords)
      return [...prevWords, ...newWords]
    })

  }

  // Update lesson word properties
  const updateLessonWord = (wordId: string, field: keyof LessonWord, value: string) => {
    // Normalize common alias fields to the canonical keys used in the UI
    const normalizeField = (f: string) => {
      switch (f) {
        case 'maxReads': return 'maxRead'
        case 'showIpa': return 'show_ipa'
        case 'showWord': return 'show_word'
        case 'showIpaAndWord': return 'show_ipa_and_word'
        case 'readsPerRound': return 'reads_per_round'
        default: return f
      }
    }
    const canonicalField = normalizeField(String(field)) as keyof LessonWord
    console.log('updateLessonWord called', { wordId, field, canonicalField, value })
    setLessonWords((prevWords) => prevWords.map((word) => (word.id === wordId ? { ...word, [canonicalField]: value } : word)))
  }

  const updateMaxReadsLessonWord = (wordId: string, value: string) => {
    const maxReads = Number(value);
    const showIpa = Math.floor(maxReads * 0.6);
    const showWord = Math.floor(maxReads * 0.3);
    const showIpaAndWord = maxReads - showIpa - showWord;
    const readsPerRound = maxReads < 6 ? maxReads : 6
  console.log('updateMaxReadsLessonWord called', { wordId, maxReads, showIpa, showWord, showIpaAndWord, readsPerRound })
    setLessonWords((prevWords) =>
      prevWords.map((word) =>
        word.id === wordId
          ? {
            ...word,
            // use the same keys the rest of the UI expects
            maxRead: String(maxReads),
            show_ipa: String(showIpa),
            show_word: String(showWord),
            show_ipa_and_word: String(showIpaAndWord),
            reads_per_round: String(readsPerRound)
          }
          : word
      )
    );
  };

  // Remove word from course
  const removeLessonWord = (wordId: string) => {
    // Xóa khỏi danh sách lesson
    setLessonWords((prevWords) => prevWords.filter((word) => word.id !== wordId))

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

  const handleCreateLesson = async () => {
    console.log('Creating lesson with name:', courseName)

    // Build payload following `Course` type in src/types
    const id = `ls${Date.now()}`
    const estimatedTime = calculateEstimatedTime()

    const newLesson = {
      id,
      name: courseName.trim(),
      estimatedTime,
      words: lessonWords.map((w) => ({ ...w })),
      done: '0',
      curriculum_custom_id: actualCCId || '',
      createdAt: new Date().toISOString(),
    }
    console.log('Creating lesson with data:', newLesson)
    try {
      // If a course store exists, add to it for local state persistence
      createLessonMutation(newLesson, {
        onSuccess: (data) => {
          console.log('Lesson created successfully:', data)
          // Navigate back to course management
          router.push('/quanlybaihoc')
        },
        onError: (error) => {
          console.error('Failed to create lesson:', error)
          alert('Failed to create lesson. Please try again.')
        }
      })

      // Fallback: log the new lesson data
      console.log('New lesson created locally:', newLesson)
    } catch (err) {
      // fallback: log error
      console.error('Failed to create course locally', err)
    }
  }
  const handleUpdateLesson = async () => {
    console.log('Updating lesson with name:', courseName)

    if (!lessonById) {
      alert('Không tìm thấy bài học để cập nhật')
      return
    }

    const estimatedTime = calculateEstimatedTime()

    // Preserve existing lesson id and created timestamps
    const asRecord = lessonById as unknown as Record<string, unknown>
    const toStr = (v: unknown) => (v === undefined || v === null) ? '' : String(v)
    const created_at = toStr(asRecord['created_at'] ?? asRecord['createdAt'] ?? new Date().toISOString())

    const payload: Lesson = {
      id: lessonById.id,
      name: courseName.trim(),
      words: lessonWords.map((w) => ({ ...w })),
      created_at,
      updated_at: new Date().toISOString(),
      estimatedTime,
      done: toStr(asRecord['done'] ?? '0'),
      curriculum_custom_id: actualCCId 
    }

    console.log('Updating lesson with payload:', payload)

    try {
      updateLessonMutation(payload, {
        onSuccess: (data) => {
          console.log('Lesson updated successfully:', data)
          router.push('/quanlybaihoc')
        },
        onError: (error) => {
          console.error('Failed to update lesson:', error)
          alert('Failed to update lesson. Please try again.')
        }
      })
    } catch (err) {
      console.error('Failed to update lesson locally', err)
      alert('Có lỗi xảy ra khi cập nhật bài học')
    }
  }
  // Get selected words count
  const getSelectedCount = () => {
    let count = 0
    lessonsFiltered.forEach((lesson) => {
      count += lesson.words.filter(w => w.selected).length
    })
    Object.values(data).forEach((words) => {
      count += words.filter(w => w.selected).length
    })
    return count
  }

  // Calculate estimated time based on the formula:
  // For each word: readCount * (pauseTime * readCount)
  const calculateEstimatedTime = () => {
    let totalSeconds = 0

    lessonWords.forEach((word) => {
      const readCount = Number.parseInt(word.maxRead) || 0

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

  // Populate lessonsFiltered and local data from normalizedUnits
  useEffect(() => {
    // If not edit mode or no lesson data, skip
    if (!isEditMode || !lessonById) return

    try {
      const lb = lessonById as Lesson

      // small helper to convert unknown to string safely (avoids using `any`)
      type RawWord = Record<string, unknown>
      const toStr = (v: unknown) => (v === undefined || v === null) ? '' : String(v)

      // Prefill course name
      setCourseName(toStr((lb as unknown as Record<string, unknown>)['name']))

      // Normalize incoming lesson words into LessonWord[] shape
      const incomingWords: LessonWord[] = Array.isArray(lb.words)
        ? (lb.words as unknown as RawWord[]).map((w) => ({
          id: toStr(w['id'] ?? w['wordId'] ?? w['word']),
          word: toStr(w['word'] ?? w['wordText']),
          meaning: toStr(w['meaning'] ?? w['mean']),
          ipa: toStr(w['ipa'] ?? w['pronunciation']),
          pause_time: toStr(w['pauseTime'] ?? '2'),
          maxRead: toStr(w['maxRead'] ?? '6'),
          show_ipa: toStr(w['show_ipa'] ?? '3'),
          show_word: toStr(w['show_word'] ?? '1'),
          show_ipa_and_word: toStr(w['show_ipa_and_word'] ?? '2'),
          reads_per_round: toStr(w['reads_per_round'] ?? '6'),
          progress: toStr(w['progress'] ?? '0')
        }))
        : []

      setLessonWords(incomingWords)

      // If lesson contains curriculum_custom_id, set actualCCId so left-panel units load
      const ccid = (lb as unknown as Record<string, unknown>)['curriculum_custom_id']
      if (ccid) setActualCCId(String(ccid))

      // Mark selected words in lessonsFiltered and data when those structures are available
      const selectedIds = new Set(incomingWords.map((w) => w.id))

      setLessonsFiltered((prev) => prev.map((lesson) => ({
        ...lesson,
        words: lesson.words.map((lw) => ({ ...lw, selected: selectedIds.has(lw.id) }))
      })))

      setData((prev) => {
        const out: typeof prev = {}
        for (const key of Object.keys(prev)) {
          out[key] = prev[key].map((lw) => ({ ...lw, selected: selectedIds.has(lw.id) }))
        }
        return out
      })
    } catch (err) {
      // defensive: don't crash the editor if shape is unexpected
      console.error('Failed to prefill edit data for lesson:', err)
    }
  }, [isEditMode, lessonById])

  useEffect(() => {
    // Only include units that are marked visible in selectedUnitIds
    const visibleUnits = normalizedUnits.filter((u) => selectedUnitIds.includes(u.id))
    const items: LessonWithWords[] = visibleUnits.map((u) => {
      const words: LocalWord[] = (u.list_word || []).map((w: Word) => ({
        id: w.id,
        word: w.word,
        meaning: w.meaning || '',
        ipa: w.ipa || '',
        selected: false,
        done: false,
        popularity: (w.popularity as number) || 0,
        belong: ''
      }))
      return { id: u.id, title: u.name || '', words }
    })

    setLessonsFiltered(items)

    // initialize data map for left-panel selection if empty
    setData((prev) => {
      // only initialize if prev is empty to avoid clobbering user selections
      if (Object.keys(prev).length > 0) return prev
      const initialData: { [key: string]: LocalWord[] } = {}
      visibleUnits.forEach((it) => { initialData[it.id] = it.list_word?.map((w: Word) => ({
        id: w.id,
        word: w.word,
        meaning: w.meaning || '',
        ipa: w.ipa || '',
        selected: false,
        done: false,
        popularity: (w.popularity as number) || 0,
        belong: ''
      })) || [] })
      return initialData
    })
  }, [normalizedUnits, selectedUnitIds])

  // Keep left-panel selections (lessonsFiltered & data) in sync with lessonWords
  useEffect(() => {
    const selectedIds = new Set(lessonWords.map((w) => w.id))

    setLessonsFiltered((prev) => prev.map((lesson) => ({
      ...lesson,
      words: lesson.words.map((lw) => ({ ...lw, selected: selectedIds.has(lw.id) }))
    })))

    setData((prev) => {
      const out: typeof prev = {}
      for (const key of Object.keys(prev)) {
        out[key] = prev[key].map((lw) => ({ ...lw, selected: selectedIds.has(lw.id) }))
      }
      return out
    })
  }, [lessonWords, normalizedUnits])



  
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

      {/* Loading State - render skeleton only after hydration to avoid SSR/CSR mismatch */}
      {mounted && isLoading && (
          <Loading 
            variant="skeleton" 
            skeletonType="tao-bai-hoc"
          />
        )}

      {/* Error State - Using unified ErrorHandler */}
      {/* {error && !isLoading && (
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
        )} */}

      {/* Main Content - only show when not loading and no error */}
      {true && true && (
        <div className="pt-20 h-screen flex">
          {/* Left Panel - Word Selection */}
          <div className="w-1/3 bg-gray-100 border-r border-gray-300 overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Chọn từ vựng</h2>
              <div className="mb-6">
                <Card className="bg-white shadow-sm border border-gray-200">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-gray-900">Bộ lọc</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-5">
                      <div key={'all'} className="space-x-1 flex items-center text-gray-900">
                        <label htmlFor="all">Tất cả</label>
                        <Checkbox
                          id="all"
                          checked={selectedUnitIds.length === normalizedUnits.length && normalizedUnits.length > 0}
                          onCheckedChange={(checked) => {
                            const enable = checked === true
                            if (enable) {
                              const allIds = normalizedUnits.map((u) => u.id)
                              setSelectedUnitIds(allIds)
                            } else {
                              setSelectedUnitIds([])
                            }
                          }}
                        />
                      </div>
                      {normalizedUnits.map((unit) => (
                        <div key={unit.id} className="space-x-1 flex items-center text-gray-900">
                          <label htmlFor={`bai${unit.id}`}>{unit.name}</label>
                          <Checkbox
                            id={`bai${unit.id}`}
                            checked={selectedUnitIds.includes(unit.id)}
                            onCheckedChange={(checked) => {
                              const enable = checked === true
                              setSelectedUnitIds((prev) => {
                                if (enable) {
                                  // add
                                  return Array.from(new Set([...prev, unit.id]))
                                }
                                // remove
                                return prev.filter((id) => id !== unit.id)
                              })
                            }}
                          />

                        </div>
                      ))}

                    </div>
                  </CardContent>
                </Card>
              </div>
              {normalizedUnits.filter(u => selectedUnitIds.includes(u.id)).map((unit) => {
                // group children by parent_id and collect roots
                const childrenMap = new Map<string, Word[]>()
                const roots: Word[] = []
                ;(unit.list_word || []).forEach((w: Word) => {
                  if (w.parent_id) {
                    if (!childrenMap.has(w.parent_id)) childrenMap.set(w.parent_id, [])
                    childrenMap.get(w.parent_id)!.push(w)
                  } else {
                    roots.push(w)
                  }
                })

                // sort roots and children for predictable order
                roots.sort((a, b) => a.word.localeCompare(b.word))
                childrenMap.forEach((list) => list.sort((a, b) => a.word.localeCompare(b.word)))

                const renderRow = (word: Word) => {
                  const getWordSelected = (unitId: string, wordId: string) => {
                    const list = data[unitId]
                    if (!Array.isArray(list)) return false
                    const found = list.find((w: LocalWord) => w.id === wordId)
                    return !!(found && found.selected)
                  }

                  const toggleWordSelection = (unitId: string, wordId: string, unitWords?: Word[]) => {
                    setData((prev) => {
                      const prevList = prev[unitId] ?? (unitWords ?? []).map((w) => ({ ...w, selected: false }))
                      const updated = prevList.map((w: LocalWord) => (w.id === wordId ? { ...w, selected: !w.selected } : w))
                      return { ...prev, [unitId]: updated }
                    })
                  }

                  const selected = getWordSelected(unit.id, word.id)

                  return (
                    <TableRow key={word.id} className="hover:bg-gray-50 text-gray-900 flex" onClick={() => toggleWordSelection(unit.id, word.id, unit.list_word)}>
                      <TableCell className="px-4 py-3 w-1/3">
                        <div className={`flex items-center space-x-3 ${word.parent_id ? 'pl-2.5' : ''}`}>
                          <div>
                            <div className="font-medium text-gray-900">{word.word}</div>
                            <div className="text-sm text-gray-500">{word.meaning}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 w-20 text-sm text-gray-700 flex-1 flex items-center">
                        {word.lesson_ids && word.lesson_ids.length > 0 && (
                          <div className="text-xs">
                            {word.lesson_ids.length === 1 
                              ? `đã có trong bài ${word.lesson_names?.[0] || word.lesson_ids[0]}`
                              : `đã có trong ${word.lesson_ids.length} bài học`
                            }
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 w-10 flex items-center">
                        <div className={` space-x-3`}>
                          <Checkbox 
                            checked={selected} 
                            className={`${selected ? 'bg-blue-500 border-blue-500' : 'bg-white'}`}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                }

                return (
                  <div key={unit.id} className="mb-6">
                    <h3 className="text-md font-semibold text-gray-800 mb-3">{unit.name} từ</h3>
                    <Card className="bg-white shadow-sm border border-gray-200">
                      <CardContent className="p-0 ">
                        <Table className="">
                          <TableBody>
                            {roots.map((root) => {
                              const children = childrenMap.get(root.id) || []

                              return (
                                <React.Fragment key={root.id}>
                                  {renderRow(root)}
                                  {children.length > 0 && (
                                    <>
                                      {expandedChildGroups.has(root.id) ? (
                                        // expanded: show all children + collapse button
                                        <>
                                          {children.map((c) => renderRow(c))}
                                          <TableRow className="border-b border-gray-700">
                                            <TableCell colSpan={3} className="px-4 py-2 flex justify-center">
                                              <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); setExpandedChildGroups((s) => { const ns = new Set(s); ns.delete(root.id); return ns }) }}
                                                className="text-sm text-gray-600 hover:underline"
                                              >
                                                Ẩn bớt
                                              </button>
                                            </TableCell>
                                          </TableRow>
                                        </>
                                      ) : (
                                        // collapsed: show only first child and a button to reveal remaining
                                        <>
                                          {children[0] && renderRow(children[0])}
                                          {children.length > 1 && (
                                            <TableRow className="border-b border-gray-700">
                                              <TableCell colSpan={3} className="px-4 py-2 flex justify-center ">
                                                <button
                                                  type="button"
                                                  onClick={(e) => { e.stopPropagation(); setExpandedChildGroups((s) => { const ns = new Set(s); ns.add(root.id); return ns }) }}
                                                  className="text-sm text-blue-600 hover:underline"
                                                >
                                                  Hiện thêm {children.length - 1} từ
                                                </button>
                                              </TableCell>
                                            </TableRow>
                                          )}
                                        </>
                                      )}
                                    </>
                                  )}
                                </React.Fragment>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </div>
                )
              })}
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
                <h2 className="text-lg font-semibold text-gray-900">Bài học mới ({lessonWords.length} từ)</h2>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 text-gray-900">
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

                  {lessonWords.length > 0 && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Thời gian ước chừng: </span>
                      <span className="text-blue-600 font-semibold">{calculateEstimatedTime()}</span>
                    </div>
                  )}
                  <Button
                    onClick={isEditMode ? handleUpdateLesson : handleCreateLesson}
                    disabled={lessonWords.length === 0 || !courseName.trim()}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-all duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    <span className="font-medium">
                      {isEditMode ? "Cập nhật bài học" : "Tạo bài học"}
                    </span>
                  </Button>
                </div>
              </div>

              {lessonWords.length === 0 ? (
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
                          const oldIndex = lessonWords.findIndex((w) => w.id === active.id)
                          const newIndex = lessonWords.findIndex((w) => w.id === over?.id)
                          setLessonWords((words) => arrayMove(words, oldIndex, newIndex))
                        }
                      }}
                      sensors={sensors}
                    >
                      <Table className="">
                        <TableHeader>
                          <TableRow className="bg-gray-50 border-b border-gray-200">
                            <TableHead className="font-semibold text-gray-700 py-4 px-6">Từ vựng</TableHead>
                            <TableHead className="font-semibold text-gray-700 py-4 px-2 w-24 text-center">
                              Số lần đọc tối đa
                            </TableHead>
                            <TableHead className="font-semibold text-gray-700 py-4 px-2 w-24 text-center">
                              Số lần hiện IPA
                            </TableHead>
                            <TableHead className="font-semibold text-gray-700 py-4 px-2 w-24 text-center">
                              Số lần hiện từ
                            </TableHead>
                            <TableHead className="font-semibold text-gray-700 py-4 px-2 w-24 text-center">
                              Số lần hiện IPA và từ
                            </TableHead>
                            <TableHead className="font-semibold text-gray-700 py-4 px-2 w-24 text-center">
                              Số lần đọc trong 1 lần
                            </TableHead>
                            <TableHead className="font-semibold text-gray-700 py-4 px-2 w-30 text-center">Khoảng dừng</TableHead>
                            <TableHead className="w-16 py-4 px-4"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <SortableContext items={lessonWords.map((w) => w.id)} strategy={verticalListSortingStrategy}>
                          <TableBody className="">
                            {lessonWords.map((cw) => {
                              // const meta = allWordsById[cw.id] ?? findWordMeta(cw.id)
                              const word: LocalWord = {
                                id: cw.id,
                                word: cw.word,
                                meaning: '',
                                selected: false,
                                done: false,
                                popularity: 0,
                                belong: '',
                                ipa: cw.ipa || ''
                              }

                              return (<SortableRow
                                key={word.id}
                                word={word}
                                lessonWord={cw}
                                updateLessonWord={updateLessonWord}
                                removeLessonWord={removeLessonWord}
                                updateMaxReadsLessonWord={updateMaxReadsLessonWord}
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
  lessonWord, updateLessonWord, removeLessonWord, updateMaxReadsLessonWord }: {
    word: LocalWord
    lessonWord: LessonWord
    updateMaxReadsLessonWord: (id: string, value: string) => void
    updateLessonWord: (id: string, field: keyof LessonWord, value: string) => void
    removeLessonWord: (id: string) => void
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
      className="hover:bg-gray-50 transition-colors border-b border-gray-100 cursor-move text-gray-900"
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
          value={lessonWord.maxRead}
          onChange={(e) => updateMaxReadsLessonWord(lessonWord.id, e.target.value)}
          placeholder="0"
          className="w-full text-sm text-center"
          min="0"
        />
      </TableCell >
      <TableCell className="py-4 px-4 cursor-default">
        <Input
          type="number"
          value={lessonWord.show_ipa}
          onChange={(e) => updateLessonWord(lessonWord.id, "show_ipa", e.target.value)}
          placeholder="0"
          className="w-full text-sm text-center"
          min="0"
          max={Number(lessonWord.maxRead) - (Number(lessonWord.show_ipa_and_word) + Number(lessonWord.show_word))}
        />
      </TableCell>
      <TableCell className="py-4 px-4 cursor-default">
        <Input
          type="number"
          value={lessonWord.show_word}
          onChange={(e) => updateLessonWord(lessonWord.id, "show_word", e.target.value)}
          placeholder="0"
          className="w-full text-sm text-center"
          min="0"
          max={Number(lessonWord.maxRead) - (Number(lessonWord.show_ipa_and_word) + Number(lessonWord.show_word))}
        />
      </TableCell>
      <TableCell className="py-4 px-4 cursor-default">
        <Input
          type="number"
          value={lessonWord.show_ipa_and_word}
          onChange={(e) => updateLessonWord(lessonWord.id, "show_ipa_and_word", e.target.value)}
          placeholder="0"
          className="w-full text-sm text-center"
          min="0"
          max={Number(lessonWord.maxRead) - (Number(lessonWord.show_ipa) + Number(lessonWord.show_word))}
        />
      </TableCell>
      <TableCell className="py-4 px-4 cursor-default">
        <Input
          type="number"
          value={lessonWord.reads_per_round}
          onChange={(e) => updateLessonWord(lessonWord.id, "reads_per_round", e.target.value)}
          placeholder="0"
          className="w-full text-sm text-center"
          min="1"
          max={lessonWord.maxRead}
        />
      </TableCell>
      <TableCell className="py-4 px-4 cursor-default">
        <div className="flex items-center space-x-2">
          <Input
            id="pause-time"
            type="number"
            value={lessonWord.pause_time}
            onChange={(e) => updateLessonWord(lessonWord.id, "pause_time", e.target.value)}
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
            console.log("Đã bấm nút X của từ:", lessonWord.id)
            removeLessonWord(lessonWord.id)
          }}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </Button>
      </TableCell>
    </TableRow>
  )
}



