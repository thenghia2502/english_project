"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { useCreateLesson, useUpdateLesson } from "@/hooks"
import { Lesson, LessonWord } from "@/lib/types"
import { LocalWord, LessonWithWords } from "./types"

interface UseLessonBuilderLogicProps {
    // Data
    lessonsFiltered: LessonWithWords[]
    data: { [key: string]: LocalWord[] }
    lessonWords: LessonWord[]
    courseName: string
    actualCCId: string
    lessonById?: unknown
    curriculumId?: string
    
    // Setters
    setLessonWords: React.Dispatch<React.SetStateAction<LessonWord[]>>
    setLessonsFiltered: React.Dispatch<React.SetStateAction<LessonWithWords[]>>
    setData: React.Dispatch<React.SetStateAction<{ [key: string]: LocalWord[] }>>
}

export function useLessonBuilderLogic({
    lessonsFiltered,
    data,
    lessonWords,
    courseName,
    actualCCId,
    curriculumId,
    lessonById,
    setLessonWords,
    setLessonsFiltered,
    setData
}: UseLessonBuilderLogicProps) {
    const router = useRouter()
    const { mutate: createLessonMutation } = useCreateLesson()
    const { mutate: updateLessonMutation } = useUpdateLesson()

    // Get selected words count
    const getSelectedCount = useCallback(() => {
        let count = 0
        // lessonsFiltered.forEach((lesson) => {
        //     count += lesson.words.filter(w => w.selected).length
        // })
        Object.values(data).forEach((words) => {
            count += words.filter(w => w.selected).length
        })
        return count
    }, [data])

    // Transfer selected words to course builder
    const transferSelectedWords = useCallback(() => {
        const selectedWords: LessonWord[] = []

        // Get words from lessons
        lessonsFiltered.forEach((lesson) => {
            lesson.words.forEach((word) => {
                if (word.selected) {
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

        // Get words from data
        Object.values(data).forEach((words) => {
            words.forEach((word) => {
                if (word.selected) {
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

        // Remove duplicates and add to lesson words
        setLessonWords((prevWords) => {
            const existingIds = prevWords.map((w) => w.id)
            const newWords = selectedWords.filter((w) => !existingIds.includes(w.id))
            return [...prevWords, ...newWords]
        })
    }, [lessonsFiltered, data, setLessonWords])

    // Update lesson word properties
    const updateLessonWord = useCallback((wordId: string, field: keyof LessonWord, value: string) => {
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
        
        setLessonWords((prevWords) => 
            prevWords.map((word) => 
                (word.id === wordId ? { ...word, [canonicalField]: value } : word)
            )
        )
    }, [setLessonWords])

    // Update max reads and calculate related values
    const updateMaxReadsLessonWord = useCallback((wordId: string, value: string) => {
        const maxReads = Number(value)
        const showIpa = Math.floor(maxReads * 0.6)
        const showWord = Math.floor(maxReads * 0.3)
        const showIpaAndWord = maxReads - showIpa - showWord
        const readsPerRound = maxReads < 6 ? maxReads : 6

        setLessonWords((prevWords) =>
            prevWords.map((word) =>
                word.id === wordId
                    ? {
                        ...word,
                        maxRead: String(maxReads),
                        show_ipa: String(showIpa),
                        show_word: String(showWord),
                        show_ipa_and_word: String(showIpaAndWord),
                        reads_per_round: String(readsPerRound)
                    }
                    : word
            )
        )
    }, [setLessonWords])

    // Remove word from lesson
    const removeLessonWord = useCallback((wordId: string) => {
        // Remove from lesson words
        setLessonWords((prevWords) => prevWords.filter((word) => word.id !== wordId))

        // Unselect from lessons filtered
        setLessonsFiltered((prevLessons) =>
            prevLessons.map((lesson) => ({
                ...lesson,
                words: lesson.words.map((word) =>
                    word.id === wordId ? { ...word, selected: false } : word
                ),
            }))
        )

        // Unselect from data
        setData((prevData) => {
            const newData: typeof prevData = {}
            for (const key in prevData) {
                newData[key] = prevData[key].map((word) =>
                    word.id === wordId ? { ...word, selected: false } : word
                )
            }
            return newData
        })
    }, [setLessonWords, setLessonsFiltered, setData])

    // Calculate estimated time
    const calculateEstimatedTime = useCallback(() => {
        let totalSeconds = 0

        lessonWords.forEach((word) => {
            const readCount = Number.parseInt(word.maxRead) || 0
            if (readCount > 0) {
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
    }, [lessonWords])

    // Create new lesson
    const handleCreateLesson = useCallback(async () => {
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
            curriculum_original_id: curriculumId || ''
        }

        try {
            createLessonMutation(newLesson, {
                onSuccess: () => {
                    router.push('/baihoc')
                },
                onError: (error) => {
                    console.error('Failed to create lesson:', error)
                    alert('Failed to create lesson. Please try again.')
                }
            })
        } catch (err) {
            console.error('Failed to create course locally', err)
        }
    }, [calculateEstimatedTime, courseName, lessonWords, actualCCId, curriculumId, createLessonMutation, router])

    // Update existing lesson
    const handleUpdateLesson = useCallback(async () => {
        if (!lessonById) {
            alert('Không tìm thấy bài học để cập nhật')
            return
        }

        const estimatedTime = calculateEstimatedTime()
        const asRecord = lessonById as unknown as Record<string, unknown>
        const toStr = (v: unknown) => (v === undefined || v === null) ? '' : String(v)
        const created_at = toStr(asRecord['created_at'] ?? asRecord['createdAt'] ?? new Date().toISOString())

        const payload: Lesson = {
            id: toStr(asRecord['id']),
            name: courseName.trim(),
            words: lessonWords.map((w) => ({ ...w })),
            created_at,
            updated_at: new Date().toISOString(),
            estimatedTime,
            done: toStr(asRecord['done'] ?? '0'),
            curriculum_custom_id: actualCCId 
        }

        try {
            updateLessonMutation(payload, {
                onSuccess: () => {
                    router.push('/baihoc')
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
    }, [lessonById, courseName, lessonWords, actualCCId, calculateEstimatedTime, updateLessonMutation, router])

    return {
        getSelectedCount,
        transferSelectedWords,
        updateLessonWord,
        updateMaxReadsLessonWord,
        removeLessonWord,
        calculateEstimatedTime,
        handleCreateLesson,
        handleUpdateLesson
    }
}