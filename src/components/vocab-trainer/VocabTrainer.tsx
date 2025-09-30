"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { useSearchParams } from "next/navigation"
import ErrorHandler from "@/components/ui/error-handler"
import { useLessonById, useUpdateLesson } from "@/hooks"
import { LessonWord } from '@/lib/types'
import { useUIStore } from "@/stores"
import Loading from "@/components/ui/loading"

// Components
import TopNavigation from "@/components/vocab-trainer/TopNavigation"
import TrainerControls from "@/components/vocab-trainer/TrainerControls"
import AudioControls from "@/components/vocab-trainer/AudioControls"
import ProgressBadge from "@/components/vocab-trainer/ProgressBadge"
import VocabDisplay from "@/components/vocab-trainer/VocabDisplay"
import VocabTable from "@/components/vocab-trainer/VocabTable"
import { useAudioManager } from "@/components/vocab-trainer/useAudioManager"

// Audio data imports
import audioDataLocalUK from '../../app/datalocaluk.json'
import audioDataLocalUS from '../../app/datalocalus.json'

function getAudioUrlLocal(word: string, dialect: string): string | null {
    let data: { [key: string]: string } = {}
    if (dialect === 'us') {
        data = audioDataLocalUS as Record<string, string>
    } else {
        data = audioDataLocalUK as Record<string, string>
    }
    return data[word] ?? null
}

export default function VocabTrainer() {
    // React Query hooks
    const searchParams = useSearchParams()
    const lessonId = searchParams.get("lessonId")

    const {
        data: selectedLesson,
        isLoading: lessonLoading,
        error: lessonError,
        refetch: refetchLesson
    } = useLessonById(lessonId)

    const updateLessonMutation = useUpdateLesson()

    // Zustand store
    const { setError: setGlobalError } = useUIStore()

    // Local state
    const [vocabularyData, setVocabularyData] = useState<LessonWord[]>([])
    const [isTransformingData, setIsTransformingData] = useState(false)
    const [transformError, setTransformError] = useState<string | null>(null)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isPlaying, setIsPlaying] = useState(false)
    const [audioError, setAudioError] = useState(false)
    const [isLooping, setIsLooping] = useState(false)
    const [dialect, setDialect] = useState("us")
    const [isDialectChanging, setIsDialectChanging] = useState(false)
    const [checked, setChecked] = useState(true)
    const [isUpdatingLesson, setIsUpdatingLesson] = useState(false)
    const [hasInitialData, setHasInitialData] = useState(false)
    const [disableSkeleton, setDisableSkeleton] = useState(false)

    // Refs
    const lastShownWordRef = useRef<LessonWord | null>(null)
    const updatingLessonRef = useRef(false)

    // Track when we have initial data and disable skeleton after first load
    useEffect(() => {
        if (vocabularyData.length > 0 && !hasInitialData) {
            setHasInitialData(true)
            setDisableSkeleton(true) // Vô hiệu hóa skeleton vĩnh viễn sau lần load đầu
        }
    }, [vocabularyData.length, hasInitialData])

    // Computed values
    // Chỉ hiển thị loading khi thực sự cần load dữ liệu ban đầu, không phải khi update
    // Sau khi đã có dữ liệu lần đầu, không bao giờ hiển thị skeleton nữa
    const isPageLoading = !disableSkeleton && 
                          !hasInitialData && 
                          vocabularyData.length === 0 && 
                          (lessonLoading || isTransformingData) && 
                          !updatingLessonRef.current && 
                          !isUpdatingLesson
    const error = lessonError?.message || transformError
    const currentWord = vocabularyData[currentIndex] || null
    
    // Debug logging
    useEffect(() => {
        console.log('🔍 Loading states:', {
            lessonLoading,
            isTransformingData,
            updatingLessonRef: updatingLessonRef.current,
            isUpdatingLesson,
            mutationPending: updateLessonMutation.isPending,
            isPageLoading,
            vocabularyDataLength: vocabularyData.length
        })
    }, [lessonLoading, isTransformingData, isUpdatingLesson, updateLessonMutation.isPending, isPageLoading, vocabularyData.length])

    // Check if no lesson selected
    useEffect(() => {
        if (!lessonId) {
            setGlobalError("NO_LESSON_SELECTED")
        }
    }, [lessonId, setGlobalError])

    // Save course progress using React Query mutation
    const onDoneCourse = useCallback(async () => {
        if (!selectedLesson || vocabularyData.length === 0) return

        const totalProgress = vocabularyData.reduce((sum, word) => sum + Number(word.progress), 0)
        const totalMaxReads = vocabularyData.reduce((sum, word) => sum + Number(word.maxRead), 0)

        let done = 0
        if (selectedLesson.words.every((word) => Number(word.progress) >= Number(word.maxRead))) {
            done = 100
        } else if (totalMaxReads > 0) {
            done = Math.round((totalProgress / totalMaxReads) * 100)
        }

        try {
            const wordsPayload: LessonWord[] = vocabularyData.map((w) => ({
                id: String(w.id),
                word: w.word,
                ipa: w.ipa,
                meaning: w.meaning,
                example: w.example,
                pause_time: String(w.pause_time),
                maxRead: String(w.maxRead),
                show_ipa: String(w.show_ipa),
                show_word: String(w.show_word),
                show_ipa_and_word: String(w.show_ipa_and_word),
                reads_per_round: String(w.reads_per_round),
                progress: String(w.progress),
            }))

            updatingLessonRef.current = true
            setIsUpdatingLesson(true)
            await updateLessonMutation.mutateAsync({
                ...selectedLesson,
                words: wordsPayload,
                done: String(done),
            })
            
            // Không cần update lại vocabularyData từ response vì data local đã chính xác
            // Cache đã được cập nhật trong mutation onSuccess
        } catch (error) {
            console.error("❌ Lỗi khi cập nhật lesson:", error)
        } finally {
            updatingLessonRef.current = false
            setIsUpdatingLesson(false)
        }
    }, [selectedLesson, vocabularyData, updateLessonMutation])

    // Audio Manager Hook
    const audioManager = useAudioManager({
        vocabularyData,
        currentIndex,
        dialect,
        isLooping,
        setIsPlaying,
        setIsLooping,
        setAudioError,
        setCurrentIndex,
        setVocabularyData,
        onDoneCourse
    })

    // Transform course data to vocabulary data when course is loaded
    useEffect(() => {
        if (!selectedLesson || !Array.isArray(selectedLesson.words)) {
            if (!updatingLessonRef.current) {
                setVocabularyData([])
                setIsTransformingData(false)
            }
            return
        }

        if (Array.isArray(selectedLesson.words) && selectedLesson.words.length === 0 && updatingLessonRef.current) {
            return
        }

        // Không transform data nếu đang trong quá trình update lesson
        if (updatingLessonRef.current) {
            return
        }

        const transformCourseData = () => {
            setIsTransformingData(true)
            setTransformError(null)
            try {
                const transformedData = selectedLesson.words.map((cw) => {
                    const id = String(cw.id ?? '')
                    const wordText = String(cw.word)
                    return {
                        id,
                        word: wordText,
                        ipa: String(cw.ipa),
                        meaning: String(cw.meaning),
                        audioUrl: getAudioUrlLocal(wordText, dialect) || '',
                        maxRead: String(cw.maxRead),
                        show_ipa: String(cw.show_ipa),
                        show_word: String(cw.show_word),
                        show_ipa_and_word: String(cw.show_ipa_and_word),
                        progress: String(cw.progress),
                        reads_per_round: String(cw.reads_per_round),
                        pause_time: String(cw.pause_time),
                    }
                })
                setVocabularyData(transformedData)
            } catch (error) {
                console.error("Error transforming course data:", error)
                const errorMessage = error instanceof Error ? error.message : 'Không thể tải dữ liệu từ vựng'
                setTransformError(errorMessage)
                setVocabularyData([])
            } finally {
                setIsTransformingData(false)
            }
        }

        transformCourseData()
    }, [dialect, selectedLesson])

    // Update audio URLs when dialect changes
    useEffect(() => {
        if (vocabularyData.length === 0) return

        setIsDialectChanging(true)

        try {
            const updatedData = vocabularyData.map((word: LessonWord) => ({
                ...word,
                audioUrl: getAudioUrlLocal(word.word, dialect) || ""
            }))

            setVocabularyData(updatedData)
        } catch (error) {
            console.error("Error updating dialect:", error)
            setTransformError(`Không thể chuyển đổi accent sang ${dialect.toUpperCase()}`)
        } finally {
            setIsDialectChanging(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dialect])

    // Clamp currentIndex if vocabularyData changes and currentIndex becomes out of range
    useEffect(() => {
        if (vocabularyData.length === 0) return
        if (currentIndex >= vocabularyData.length) {
            setCurrentIndex(vocabularyData.length - 1)
        }
        if (currentIndex < 0) {
            setCurrentIndex(0)
        }
    }, [vocabularyData, currentIndex])

    // Keep a reference to the last non-null word
    useEffect(() => {
        if (currentWord) {
            lastShownWordRef.current = currentWord
        }
    }, [currentWord])

    // Update course word function
    const updateCourseWord = (wordId: string, field: keyof LessonWord, value: string) => {
        setVocabularyData((prevWords) => {
            const updated = prevWords.map((word) => (word.id === wordId ? { ...word, [field]: value } : word))
            return updated
        })
    }

    // Handle word click in table
    const handleWordClick = (index: number) => {
        setCurrentIndex(index)
        // Stop current audio if playing
        // This would need to be exposed from the audio manager if needed
    }

    // Error handling
    if (!lessonId) {
        return (
            <ErrorHandler
                type="NO_LESSON_SELECTED"
                pageType="vocab-trainer"
                title="Chưa chọn bài học"
                message="Bạn cần chọn một khóa học để bắt đầu luyện tập từ vựng"
                onGoBack={() => window.history.back()}
                onGoHome={() => window.location.href = '/'}
            />
        )
    }

    if (error) {
        return (
            <ErrorHandler
                type="GENERAL_ERROR"
                pageType="vocab-trainer"
                title="Không thể tải dữ liệu khóa học"
                message="Đã xảy ra lỗi khi tải khóa học và từ vựng. Vui lòng thử lại."
                errorDetails={error}
                onRetry={() => refetchLesson()}
                onGoBack={() => window.history.back()}
                onGoHome={() => window.location.href = '/'}
            />
        )
    }

    if (isPageLoading) {
        return (
            <Loading
                variant="skeleton"
                skeletonType="vocab-trainer"
            />
        )
    }

    if (!isPageLoading && selectedLesson && vocabularyData.length === 0) {
        return (
            <ErrorHandler
                type="NO_DATA_FOUND"
                pageType="vocab-trainer"
                title="Không có từ vựng trong khóa học"
                message="Khóa học này chưa có từ vựng nào. Vui lòng thêm từ vựng hoặc chọn khóa học khác."
                onRetry={() => refetchLesson()}
                onGoBack={() => window.history.back()}
                onGoHome={() => window.location.href = '/'}
            />
        )
    }

    if (!isPageLoading && lessonId && !selectedLesson && !error) {
        return (
            <ErrorHandler
                type="NO_DATA_FOUND"
                pageType="vocab-trainer"
                title="Không tìm thấy bài học"
                message={`Bài học với ID "${lessonId}" không tồn tại hoặc đã bị xóa.`}
                onRetry={() => refetchLesson()}
                onGoBack={() => window.history.back()}
                onGoHome={() => window.location.href = '/'}
            />
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <TopNavigation lessonName={selectedLesson?.name} />
            
            <main className="mx-auto min-h-[52rem] px-4 py-8 sm:px-6 lg:pb-8 lg:pt-16 flex flex-col space-y-5">
                <div className="my-3 flex justify-between">
                    <TrainerControls 
                        checked={checked}
                        setChecked={setChecked}
                        dialect={dialect}
                        setDialect={setDialect}
                        isLooping={isLooping}
                        isPlaying={isPlaying}
                    />
                    
                    <div className="flex-shrink-0">
                        <AudioControls
                            isLooping={isLooping}
                            isPageLoading={isPageLoading}
                            isDialectChanging={isDialectChanging}
                            audioError={audioError}
                            vocabularyData={vocabularyData}
                            onAudioToggle={audioManager.handleAudioToggle}
                            onRetryAudio={audioManager.handleRetryAudio}
                        />
                    </div>
                </div>

                <Card className="border-none shadow-lg bg-white relative">
                    <ProgressBadge 
                        currentWord={currentWord} 
                        lastShownWord={lastShownWordRef.current} 
                    />
                    
                    <CardContent className="p-6 h-fit">
                        <div className="mb-6 flex items-center justify-between bg-gray-50 rounded-lg p-4 h-[30rem]">
                            <div className="w-full mx-4 md:mx-8 flex justify-center items-center">
                                <VocabDisplay currentWord={currentWord} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {checked && (
                    <VocabTable
                        vocabularyData={vocabularyData}
                        currentIndex={currentIndex}
                        isLooping={isLooping}
                        isPlaying={isPlaying}
                        onWordClick={handleWordClick}
                        onUpdateWord={updateCourseWord}
                    />
                )}
            </main>
        </div>
    )
}