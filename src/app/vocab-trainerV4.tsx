"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import audioData from "./data.json"
import audioDataLocalUK from './datalocaluk.json';
import audioDataLocalUS from './datalocalus.json';
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { useSearchParams } from "next/navigation"
import ErrorHandler from "@/components/ui/error-handler"
import { useCourse, useUpdateCourse } from "@/hooks"
import { useUIStore } from "@/stores"
import { cn } from "@/lib/utils"
import { CourseWord } from "@/types"
import Loading from "@/components/ui/loading"

// S3 Configuration - fallback if not found in data.json
const S3_BUCKET_URL = "https://your-vocab-bucket.s3.amazonaws.com/audio"

// Function to get audio URL for a word
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getAudioUrl = (word: string) => {
    // First check if the word exists in data.json
    const lowerWord = word.toLowerCase()
    if (lowerWord in audioData) {
        return audioData[lowerWord as keyof typeof audioData]
    }

    // If not found in data.json, use S3 fallback
    const cleanWord = lowerWord.replace(/[^a-z0-9]/g, "")
    return `${S3_BUCKET_URL}/${cleanWord}.mp3`
}

function getAudioUrlLocal(word: string, dialect: string): string | null {
    let data: { [key: string]: string } = {}
    if (dialect === 'us') {
        data = audioDataLocalUS as Record<string, string>;
    } else {
        data = audioDataLocalUK as Record<string, string>;
    }
    return data[word] ?? null;
}

interface Word {
    id: string
    word: string
    ipa: string
    meaning: string
    audioUrl: string
    maxReads: string
    showIpa: string
    showWord: string
    showIpaAndWord: string
    progress: string
    readsPerRound: string
    pauseTime: string
    example?: string
}

export default function VocabTrainer() {
    // React Query hooks
    const searchParams = useSearchParams()
    const courseId = searchParams.get("courseId")

    const {
        data: selectedCourse,
        isLoading: courseLoading,
        error: courseError,
        refetch: refetchCourse
    } = useCourse(courseId || "")

    const updateCourseMutation = useUpdateCourse()

    // Zustand store
    const { setError: setGlobalError } = useUIStore()

    // Local state
    const [vocabularyData, setVocabularyData] = useState<Word[]>([])
    const [isTransformingData, setIsTransformingData] = useState(false)
    const [transformError, setTransformError] = useState<string | null>(null)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isPlaying, setIsPlaying] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const [audioError, setAudioError] = useState(false)
    const [isLooping, setIsLooping] = useState(false)
    const [dialect, setDialect] = useState("us")
    const [isDialectChanging, setIsDialectChanging] = useState(false)
    const [checked, setChecked] = useState(true)
    const loopTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Computed values
    const isPageLoading = courseLoading || isTransformingData
    const error = courseError?.message || transformError
    const currentWord = vocabularyData[currentIndex] || null

    // Check if no course selected
    useEffect(() => {
        if (!courseId) {
            setGlobalError("NO_COURSE_SELECTED")
        }
    }, [courseId, setGlobalError])

    // Initialize audio element
    useEffect(() => {
        audioRef.current = new Audio()
        audioRef.current.addEventListener("ended", () => {
            setIsPlaying(false)
        })
        audioRef.current.addEventListener("error", () => {
            setIsPlaying(false)
            setAudioError(true)
        })

        return () => {
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current = null
            }
            if (loopTimeoutRef.current) {
                clearTimeout(loopTimeoutRef.current)
            }
        }
    }, [])

    const isForceStopRef = useRef(true) // ✅ Khởi tạo thành true để không tự phát audio khi vào trang

    // Transform course data to vocabulary data when course is loaded
    useEffect(() => {
        if (!selectedCourse || !selectedCourse.words) {
            setVocabularyData([])
            setIsTransformingData(false)
            return
        }

        const transformCourseData = async () => {
            setIsTransformingData(true)
            setTransformError(null) // Reset error state
            try {
                const transformedData = await Promise.all(
                    selectedCourse.words.map(async (cw: CourseWord) => {
                        let word = null
                        try {
                            if (cw.wordId.includes('l')) {
                                // Sử dụng direct fetch cho level words vì chưa có hook tương ứng
                                const res1 = await fetch(`/api/word/level2/${cw.wordId}`)
                                if (res1.ok) {
                                    word = await res1.json()
                                }
                            } else {
                                // Sử dụng direct fetch cho individual words
                                const res = await fetch(`/api/word/${cw.wordId}`)
                                if (res.ok) {
                                    word = await res.json()
                                }
                            }
                        } catch (wordError) {
                            console.error(`Lỗi khi fetch từ ${cw.wordId}:`, wordError)
                            word = { id: cw.wordId, word: "❓", ipa: "", meaning: "" }
                        }

                        return {
                            id: word?.id || cw.wordId,
                            word: word?.word || "❓",
                            ipa: word?.ipa || "",
                            meaning: word?.meaning || "",
                            audioUrl: getAudioUrlLocal(word?.word || "", dialect) || "",
                            maxReads: String(Number(cw.maxReads) || 3),
                            showIpa: cw.showIpa,
                            showWord: cw.showWord,
                            showIpaAndWord: cw.showIpaAndWord,
                            progress: cw.progress,
                            readsPerRound: cw.readsPerRound,
                            pauseTime: cw.pauseTime,
                        }
                    })
                )

                setVocabularyData(transformedData)
            } catch (error) {
                console.error("Error transforming course data:", error)
                const errorMessage = error instanceof Error ? error.message : 'Không thể tải dữ liệu từ vựng'
                setTransformError(errorMessage)
                setVocabularyData([]) // Clear data on error
            } finally {
                setIsTransformingData(false)
            }
        }

        transformCourseData()
    }, [selectedCourse, dialect, setGlobalError, setIsTransformingData])

    // Update audio URLs when dialect changes
    useEffect(() => {
        if (vocabularyData.length === 0) return

        setIsDialectChanging(true)

        try {
            const updatedData = vocabularyData.map((word: Word) => ({
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

    // Save course progress using React Query mutation
    const onDoneCourse = useCallback(async () => {
        if (!selectedCourse || vocabularyData.length === 0) return

        const updatedWords = selectedCourse.words.map((cw: CourseWord) => {
            const matchedWord = vocabularyData.find((w) => w.id === cw.wordId)
            return {
                ...cw,
                progress: matchedWord?.progress ?? 0,
            }
        })

        const totalProgress = vocabularyData.reduce((sum, word) => sum + Number(word.progress), 0)
        const totalMaxReads = vocabularyData.reduce((sum, word) => sum + Number(word.maxReads), 0)

        let done = 0
        if (selectedCourse.words.every((word: CourseWord) => Number(word.progress) >= Number(word.maxReads))) {
            done = 100
        } else if (totalMaxReads > 0) {
            done = Math.round((totalProgress / totalMaxReads) * 100)
        }

        try {
            await updateCourseMutation.mutateAsync({
                id: selectedCourse.id,
                words: updatedWords.map(w => ({
                    ...w,
                    progress: String(w.progress)
                })),
                done: done.toString(),
            })
            console.log("✅ Đã cập nhật trạng thái done:", done)
        } catch (error) {
            console.error("❌ Lỗi khi cập nhật course:", error)
        }
    }, [selectedCourse, vocabularyData, updateCourseMutation])

    // Function to handle audio playback with auto-advance
    const handleAudioToggle = async () => {
        if (!audioRef.current || !currentWord) return

        if (isLooping) {
            // console.log(`⏹️ Stopping auto-advance sequence`)

            // ✅ Dừng vòng lặp và đặt cờ dừng
            setIsLooping(false)
            setIsPlaying(false)
            isForceStopRef.current = true

            if (loopTimeoutRef.current) {
                clearTimeout(loopTimeoutRef.current)
                loopTimeoutRef.current = null
            }

            audioRef.current.pause()
            audioRef.current.currentTime = 0
            onDoneCourse()
        } else {
            // ✅ Nếu khóa học đã hoàn thành, reset lại progress trước khi bắt đầu
            const isCompleted = vocabularyData.every(word =>
                Number(word.progress || 0) >= Number(word.maxReads || 3)
            );

            if (isCompleted) {
                // Reset tất cả progress về 0 để bắt đầu lại
                setVocabularyData(prev => prev.map(word => ({
                    ...word,
                    progress: "0"
                })));
                setCurrentIndex(0); // Reset về từ đầu tiên
            }

            // console.log(`🚀 Starting auto-advance sequence from word: "${currentWord.word}"`)
            // console.log(`📊 Current read counts:`, word.progress)

            isForceStopRef.current = false
            setIsLooping(true)
            setIsPlaying(true)
            playCurrentWord()
        }
    }

    const readsInCurrentRoundRef = useRef(0)

    const delay = useCallback((ms: number) => new Promise((res) => setTimeout(res, ms)), []);

    const updateProgress = useCallback(async (index: number) => {
        setVocabularyData((prev) => {
            const updated = [...prev];
            const current = updated[index];
            const realProgress = Number(current.progress || 0);
            const maxReads = Number(current.maxReads || 3);

            if (realProgress >= maxReads) {
                // console.log(`⚠️ [SKIP] Không cập nhật "${current.word}" vì đã đạt maxReads`);
                return prev;
            }

            const newProgress = realProgress + 1;
            // console.log(`📝 [CẬP NHẬT PROGRESS] "${current.word}": ${realProgress} ➡️ ${newProgress}`);

            updated[index] = {
                ...current,
                progress: newProgress.toString(),
            };

            return updated;
        });
    }, [setVocabularyData]);

    const [playTrigger, setPlayTrigger] = useState(0);

    const forcePlayCurrentWord = useCallback(() => {
        setPlayTrigger((prev) => prev + 1);
    }, []);

    // Function to find next word that needs to be played
    const findNextWordToPlay = useCallback(() => {
        const totalWords = vocabularyData.length;
        if (totalWords === 0) return;

        const nextIndex = currentIndex + 1;

        for (let i = nextIndex; i < totalWords; i++) {
            const word = vocabularyData[i];
            if (Number(word.progress) < Number(word.maxReads)) {
                // console.log(`➡️ [TÌM TỪ SAU] "${word.word}"`);
                setCurrentIndex(i);
                forcePlayCurrentWord();
                return;
            }
        }

        for (let i = 0; i < currentIndex; i++) {
            const word = vocabularyData[i];
            if (Number(word.progress) < Number(word.maxReads)) {
                // console.log(`🔁 [QUAY LẠI ĐẦU] "${word.word}"`);
                setCurrentIndex(i);
                forcePlayCurrentWord();
                return;
            }
        }

        const current = vocabularyData[currentIndex];
        if (Number(current.progress) >= Number(current.maxReads)) {
            // console.log(`🛑 [DỪNG] Tất cả các từ đã đạt maxReads.`);
            setIsLooping(false);
            setIsPlaying(false);
            isForceStopRef.current = true;
            // ✅ Không reset currentIndex, giữ nguyên vị trí hiện tại
            onDoneCourse()
        } else {
            // console.log(`🔁 [LẶP LẠI HIỆN TẠI] "${current.word}"`);
            forcePlayCurrentWord();
        }
    }, [
        vocabularyData,
        currentIndex,
        setCurrentIndex,
        setIsLooping,
        setIsPlaying,
        isForceStopRef,
        forcePlayCurrentWord,
        onDoneCourse
    ]);

    const onWordEnded = useCallback(async () => {
        const word = vocabularyData[currentIndex];
        const readsPerRound = Number(word.readsPerRound || 1);

        const currentReadsInRound = readsInCurrentRoundRef.current + 1;

        console.log(`🔄 [ON WORD ENDED] "${word.word}" - currentReadsInRound: ${currentReadsInRound}/${readsPerRound} - ${new Date().toISOString()}`);

        if (currentReadsInRound >= readsPerRound) {
            console.log(`✅ [HOÀN VÒNG] "${word.word}" - chuyển tìm từ tiếp theo (delay đã xử lý ở onended) - ${new Date().toISOString()}`);
            readsInCurrentRoundRef.current = 0;
            findNextWordToPlay();
        } else {
            readsInCurrentRoundRef.current = currentReadsInRound;

            const maxReads = Number(word.maxReads);
            const progress = Number(word.progress || 0);

            if (progress < maxReads && !isForceStopRef.current) {
                console.log(`🔁 [LẶP LẠI] "${word.word}" (${progress}/${maxReads}) - Lượt ${currentReadsInRound}/${readsPerRound} - ${new Date().toISOString()}`);
                forcePlayCurrentWord();
            } else {
                console.log(`⛔ [KHÔNG LẶP] "${word.word}" đã đủ progress (${progress}/${maxReads}) - ${new Date().toISOString()}`);
                if (!isForceStopRef.current) {
                    console.log(`🔍 [CHUYỂN] Không còn lượt lặp, tìm từ mới... - ${new Date().toISOString()}`);
                    findNextWordToPlay(); // ✅ Không còn lặp → tìm từ khác
                }
            }
        }
    }, [
        vocabularyData,
        currentIndex,
        readsInCurrentRoundRef,
        findNextWordToPlay,
        forcePlayCurrentWord,
        isForceStopRef
    ]);

    const playCurrentWord = useCallback(
        async (indexToPlay: number = currentIndex) => {
            const wordToPlay = vocabularyData[indexToPlay];
            if (!audioRef.current || !wordToPlay || isForceStopRef.current) return;

            const progress = Number(wordToPlay.progress || 0);
            const maxReads = Number(wordToPlay.maxReads || 3);

            // ✅ Nếu đã maxReads thì KHÔNG phát nữa
            if (progress >= maxReads) {
                // console.log(`⛔ [BỎ QUA PHÁT] "${wordToPlay.word}" đã đạt maxReads (${progress}/${maxReads})`);
                await onWordEnded();
                return;
            }

            console.log(`🎧 [PLAY START] Từ: "${wordToPlay.word}" - Progress: ${progress}/${maxReads} - pauseTime: ${wordToPlay.pauseTime}s - ${new Date().toISOString()}`);

            // ✅ Không delay trước khi phát, chỉ delay sau khi phát xong
            setAudioError(false);

            audioRef.current.src = wordToPlay.audioUrl || "";
            audioRef.current.currentTime = 0;

            audioRef.current.oncanplaythrough = async () => {
                if (isForceStopRef.current) return;
                try {
                    if (!audioRef.current) return;
                    await audioRef.current.play();
                    setIsPlaying(true);
                    console.log(`▶️ [AUDIO PLAYING] "${wordToPlay.word}" - bắt đầu phát audio - ${new Date().toISOString()}`);
                } catch {
                    setAudioError(true);
                    setIsLooping(false);
                }
            };

            audioRef.current.onerror = () => {
                setAudioError(true);
                setIsLooping(false);
            };

            audioRef.current.onloadeddata = () => {
                // Audio loaded, ready to play
            };

            audioRef.current.onended = async () => {
                console.log(`🎵 [AUDIO ENDED] "${wordToPlay.word}" - ${new Date().toISOString()}`)
                if (isForceStopRef.current) return;
                setIsPlaying(false);

                // ✅ Delay sau khi phát xong audio, sử dụng pauseTime của từ hiện tại
                const pauseMs = Number(wordToPlay.pauseTime || 0) * 1000;
                if (pauseMs > 0) {
                    console.log(`⏸️ [DELAY START] "${wordToPlay.word}" - nghỉ ${pauseMs}ms (${wordToPlay.pauseTime}s) - ${new Date().toISOString()}`);
                    const delayStartTime = Date.now();
                    await delay(pauseMs);
                    const delayEndTime = Date.now();
                    const actualDelayMs = delayEndTime - delayStartTime;
                    console.log(`⏸️ [DELAY END] "${wordToPlay.word}" - thực tế nghỉ ${actualDelayMs}ms - ${new Date().toISOString()}`);

                    if (isForceStopRef.current) return; // Kiểm tra lại sau delay
                } else {
                    console.log(`⚡ [NO DELAY] "${wordToPlay.word}" - pauseTime = 0, chuyển ngay`);
                }

                console.log(`📝 [UPDATE START] "${wordToPlay.word}" - bắt đầu update progress - ${new Date().toISOString()}`);
                await updateProgress(indexToPlay);
                console.log(`🔄 [WORD ENDED] "${wordToPlay.word}" - gọi onWordEnded - ${new Date().toISOString()}`);
                await onWordEnded();
            };
        },
        [
            currentIndex,
            vocabularyData,
            delay,
            isForceStopRef,
            setAudioError,
            setIsPlaying,
            setIsLooping,
            updateProgress,
            onWordEnded,
        ]
    );

    //Effect to auto-play when currentIndex changes during looping
    useEffect(() => {
        // ✅ Chỉ phát audio khi đang trong chế độ looping (đã nhấn "Bắt đầu")
        if (!isForceStopRef.current && isLooping) {
            // console.log(`${currentIndex}: `, vocabularyData[currentIndex]?.maxReads)
            // console.log(`${currentIndex}: `, vocabularyData[currentIndex]?.progress)
            playCurrentWord(currentIndex);
        }
    }, [playTrigger, currentIndex, playCurrentWord, isLooping]);

    // Function to retry audio loading
    const handleRetryAudio = () => {
        setAudioError(false)
        setIsLooping(false)
        isForceStopRef.current = false // ✅ Cho phép phát audio khi retry
        if (loopTimeoutRef.current) {
            clearTimeout(loopTimeoutRef.current)
            loopTimeoutRef.current = null
        }
        handleAudioToggle()
    }

    // Function to render vocabulary display based on playback count
    const renderVocabularyDisplay = () => {
        // const index = `${currentIndex + 1}.`;
        const word = currentWord;

        if (!word) {
            return <span className="text-4xl text-gray-400">Đang tải...</span>;
        }

        const readCount = Number(word.progress || 0); // ✅ dùng progress thay vì wordReadCount*

        const ipaRounds = Number(word.showIpa || 0);
        const wordRounds = Number(word.showWord || 0);
        // const bothRounds = Number(word.showIpaAndWord || 0);

        const wordStart = ipaRounds;
        const bothStart = ipaRounds + wordRounds;

        let phase: 1 | 2 | 3 = 1;
        if (readCount <= wordStart) {
            phase = 1; // IPA
        } else if (readCount <= bothStart) {
            phase = 2; // Word
        } else {
            phase = 3; // IPA + Word
        }

        if (phase === 1) {
            return <span className="ipa-text text-[10rem] text-blue-600">{word.ipa}</span>;
        }
        if (phase === 2) {
            return (
                <span className="text-7xl text-gray-900">
                    <span className="ipa-text text-[10rem] text-blue-600">{word.word}</span>
                </span>
            );
        }
        return (
            <span className="flex flex-col ">
                <span className="ipa-text text-[10rem] text-blue-600 text-center">{word.word}</span>{" "}
                <span className="ipa-text text-[10rem] text-blue-600 ml-2">{word.ipa}</span>
            </span>
        );
    };

    const updateCourseWord = (wordId: string, field: keyof CourseWord, value: string) => {
        setVocabularyData((prevWords) => prevWords.map((word) => (word.id === wordId ? { ...word, [field]: value } : word)))
    }

    // // Error handling
    // if (!courseId) {
    //     return (
    //         <ErrorHandler
    //             type="NO_LESSON_SELECTED"
    //             pageType="vocab-trainer"
    //             title="Chưa chọn khóa học"
    //             message="Bạn cần chọn một khóa học để bắt đầu luyện tập từ vựng"
    //             onGoBack={() => window.history.back()}
    //             onGoHome={() => window.location.href = '/'}
    //         />
    //     )
    // }

    if (error) {
        return (
            <ErrorHandler
                type="GENERAL_ERROR"
                pageType="vocab-trainer"
                title="Không thể tải dữ liệu khóa học"
                message="Đã xảy ra lỗi khi tải khóa học và từ vựng. Vui lòng thử lại."
                errorDetails={error}
                onRetry={() => refetchCourse()}
                onGoBack={() => window.history.back()}
                onGoHome={() => window.location.href = '/'}
            />
        )
    }

    // Show loading while course is loading or data is being transformed
    if (isPageLoading) {
        return (
            <Loading
                variant="skeleton"
                skeletonType="vocab-trainer"
            />
        )
    }

    // Show error only if we have finished loading course and there are no words
    if (!isPageLoading && selectedCourse && vocabularyData.length === 0) {
        return (
            <ErrorHandler
                type="NO_DATA_FOUND"
                pageType="vocab-trainer"
                title="Không có từ vựng trong khóa học"
                message="Khóa học này chưa có từ vựng nào. Vui lòng thêm từ vựng hoặc chọn khóa học khác."
                onRetry={() => refetchCourse()}
                onGoBack={() => window.history.back()}
                onGoHome={() => window.location.href = '/'}
            />
        )
    }

    // Show error if course not found but courseId exists
    if (!isPageLoading && courseId && !selectedCourse && !error) {
        return (
            <ErrorHandler
                type="NO_DATA_FOUND"
                pageType="vocab-trainer"
                title="Không tìm thấy khóa học"
                message={`Khóa học với ID "${courseId}" không tồn tại hoặc đã bị xóa.`}
                onRetry={() => refetchCourse()}
                onGoBack={() => window.history.back()}
                onGoHome={() => window.location.href = '/'}
            />
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 bg-white shadow-sm">
                <div className="mx-auto  px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <h1 className="text-2xl font-bold text-gray-900">
                        Vocab Trainer
                        </h1>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {selectedCourse && selectedCourse.name}
                        </h1>
                        <Button
                            onClick={() => window.location.href = '/quanlybaihoc'}
                            className="ml-4 bg-blue-500 text-white"
                        >
                            Quản lý bài học
                        </Button>
                    </div>
                </div>
            </nav>
            {courseId ? (
            <main className="mx-auto min-h-[52rem] px-4 py-8 sm:px-6 lg:px-8 flex flex-col space-y-5">
                {/* Radio Button Controls */}
                <div className="mb-6 flex justify-between">
                    <div className="flex space-x-6">
                        <div className="space-x-2 flex items-center">
                            <Checkbox
                                id="danh-sach-tu"
                                checked={checked}
                                onCheckedChange={(value) => setChecked(!!value)}
                            />
                            <Label htmlFor="danh-sach-tu" className="text-sm font-medium cursor-pointer">
                                danh sách từ
                            </Label>
                        </div>
                        <RadioGroup
                            value={dialect}
                            onValueChange={setDialect}
                            className={cn(
                                "flex flex-row space-x-6",
                                (isLooping || isPlaying) && "opacity-50 pointer-events-none"
                            )}
                            disabled={isLooping || isPlaying}
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="us" id="us" />
                                <Label htmlFor="us" className="text-sm font-medium cursor-pointer">
                                    us
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="uk" id="uk" />
                                <Label htmlFor="uk" className="text-sm font-medium cursor-pointer">
                                    uk
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>
                    {/* Right: Audio Control Button */}
                    <div className="flex-shrink-0">
                        {audioError ? (
                            <div className="flex flex-col items-center">
                                <Button
                                    onClick={handleRetryAudio}
                                    className="px-6 py-2 rounded-full font-medium transition-all duration-200 bg-orange-500 hover:bg-orange-600 text-white"
                                >
                                    Thử lại
                                </Button>
                                <div className="text-xs text-red-500 mt-1 text-center">Không tải được file âm thanh</div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <Button
                                    className={`max-w-[100px] px-6 py-2 rounded-full font-medium transition-all duration-200 ${isPageLoading || isDialectChanging
                                        ? "bg-gray-400 hover:bg-gray-400 text-white cursor-not-allowed"
                                        : isLooping
                                            ? "bg-red-600 hover:bg-red-700 text-white"
                                            : "bg-blue-600 hover:bg-blue-700 text-white"
                                        }`}
                                    onClick={handleAudioToggle}
                                    disabled={isPageLoading || isDialectChanging}
                                >
                                    {isDialectChanging ? "Đang chuyển..." : isLooping
                                        ? "Dừng lại"
                                        : vocabularyData.every(word => Number(word.progress || 0) >= Number(word.maxReads || 3))
                                            ? "Bắt đầu lại"
                                            : "Bắt đầu"
                                    }
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                <Card className="border-none shadow-lg bg-white relative">
                    <div className="absolute h-[50px] w-[50px] flex justify-center items-center">
                        <span
                            className={`p-2 text-lg font-medium ${vocabularyData[currentIndex] && (vocabularyData[currentIndex].progress || 0) >= (vocabularyData[currentIndex].maxReads || 3)
                                ? "text-green-600"
                                : "text-blue-600"
                                }`}
                        >
                            {vocabularyData[currentIndex] ? `${vocabularyData[currentIndex].progress || 0}/${vocabularyData[currentIndex].maxReads || 3}` : "0/0"}
                        </span>
                    </div>
                    <CardContent className="p-6 h-fit">
                        {/* Horizontal Display Row */}
                        <div className="mb-6 flex items-center justify-between bg-gray-50 rounded-lg p-4 h-[30rem]">
                            {/* Center: Vocabulary Display or Flashcard */}
                            <div className="w-full mx-4 md:mx-8 flex justify-center items-center">
                                <div className="">{renderVocabularyDisplay()}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                {/* Vocabulary Table - Only show when "danh sách từ" is selected */}
                {checked && (
                    <div className={cn(
                        "rounded-lg border border-gray-200 overflow-hidden transition-all",
                        (isLooping || isPlaying) && "pointer-events-none opacity-50"
                    )}>

                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50">
                                    <TableHead className="w-12 text-center font-semibold">#</TableHead>
                                    <TableHead className="font-semibold">Từ</TableHead>
                                    <TableHead className="font-semibold">IPA</TableHead>
                                    <TableHead className="font-semibold">khoảng dừng</TableHead>
                                    <TableHead className="font-semibold">Ví dụ</TableHead>
                                    <TableHead className="font-semibold w-20 text-center">Đọc</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {vocabularyData.map((item, index) => (
                                    <TableRow
                                        key={item.id}
                                        className={`hover:bg-gray-100 transition-colors cursor-pointer ${index === currentIndex ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                                            }`}
                                    >
                                        <TableCell onClick={() => {
                                            setCurrentIndex(index)
                                            if (isPlaying && audioRef.current) {
                                                audioRef.current.pause()
                                                audioRef.current.currentTime = 0
                                                setIsPlaying(false)
                                            }
                                        }} className="text-center font-medium text-gray-600">{index + 1}</TableCell>
                                        <TableCell onClick={() => {
                                            setCurrentIndex(index)
                                            if (isPlaying && audioRef.current) {
                                                audioRef.current.pause()
                                                audioRef.current.currentTime = 0
                                                setIsPlaying(false)
                                            }
                                        }} className="font-semibold text-gray-900">{item.word}</TableCell>
                                        <TableCell onClick={() => {
                                            setCurrentIndex(index)
                                            if (isPlaying && audioRef.current) {
                                                audioRef.current.pause()
                                                audioRef.current.currentTime = 0
                                                setIsPlaying(false)
                                            }
                                        }} className="text-gray-600 ipa-text text-sm">{item.ipa}</TableCell>
                                        <TableCell className="text-gray-600 italic flex items-center space-x-2">
                                            <Input
                                                id="pause-time"
                                                type="number"
                                                value={item.pauseTime}
                                                onChange={(e) => updateCourseWord(item.id, "pauseTime", e.target.value)}
                                                placeholder="0"
                                                className="w-1/2 text-sm text-center"
                                                min="0"
                                            />
                                            <span>
                                                giây
                                            </span>
                                        </TableCell>
                                        <TableCell onClick={() => {
                                            setCurrentIndex(index)
                                            if (isPlaying && audioRef.current) {
                                                audioRef.current.pause()
                                                audioRef.current.currentTime = 0
                                                setIsPlaying(false)
                                            }
                                        }} className="text-gray-600 italic">{item.example}</TableCell>
                                        <TableCell onClick={() => {
                                            setCurrentIndex(index)
                                            if (isPlaying && audioRef.current) {
                                                audioRef.current.pause()
                                                audioRef.current.currentTime = 0
                                                setIsPlaying(false)
                                            }
                                        }} className="text-center">
                                            <span
                                                className={`text-sm font-medium ${(item.progress || 0) >= (item.maxReads || 3)
                                                    ? "text-green-600"
                                                    : "text-blue-600"
                                                    }`}
                                            >
                                                {item.progress || 0}/{item.maxReads || 3}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </main> ) : (
                <ErrorHandler
                    type="NO_LESSON_SELECTED"
                    pageType="vocab-trainer"
                    title="Chưa chọn khóa học"
                    message="Bạn cần chọn một khóa học để bắt đầu luyện tập từ vựng"
                    onGoBack={() => window.history.back()}
                    onGoHome={() => window.location.href = '/'}
                    onActionButton={() => window.location.href = '/quanlybaihoc'}
                    labelActionButton="Đi đến Quản lý bài học"
                />
            )}
        </div>
    )
}
