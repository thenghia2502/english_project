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
import { useLessonById, useUpdateLesson } from "@/hooks"
import { LessonWord } from '@/lib/types'
import { useUIStore } from "@/stores"
import { cn } from "@/lib/utils"
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
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const [audioError, setAudioError] = useState(false)
    const [isLooping, setIsLooping] = useState(false)
    const [dialect, setDialect] = useState("us")
    const [isDialectChanging, setIsDialectChanging] = useState(false)
    const [checked, setChecked] = useState(true)
    const loopTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Computed values
    const isPageLoading = lessonLoading || isTransformingData
    const error = lessonError?.message || transformError
    const currentWord = vocabularyData[currentIndex] || null
    const lastShownWordRef = useRef<LessonWord | null>(null)

    // Check if no lesson selected
    useEffect(() => {
        if (!lessonId) {
            setGlobalError("NO_LESSON_SELECTED")
        }
    }, [lessonId, setGlobalError])

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
    const playingIndexRef = useRef<number | null>(null)
    const startingRef = useRef(false)
    const playCurrentWordRef = useRef<((index?: number, knownProgress?: number) => Promise<void>) | null>(null)
    const updatingLessonRef = useRef(false)

    // Transform course data to vocabulary data when course is loaded
    useEffect(() => {
        // If there's no lesson or words is not an array, clear only when we're not performing
        // an update. When updatingLessonRef.current is true we keep local data to avoid
        // transient empty UI while the server roundtrip completes.
        if (!selectedLesson || !Array.isArray(selectedLesson.words)) {
            if (!updatingLessonRef.current) {
                setVocabularyData([])
                setIsTransformingData(false)
            }
            return
        }

        // If server replied with an empty words array while we're updating, keep local
        // vocabularyData until the update finishes to avoid showing undefined.
        if (Array.isArray(selectedLesson.words) && selectedLesson.words.length === 0 && updatingLessonRef.current) {
            return
        }

        const transformCourseData = () => {
            setIsTransformingData(true)
            setTransformError(null) // Reset error state
            try {

                const transformedData = (selectedLesson.words).map((cw) => {
                    const id = String(cw.id ?? '')
                    const wordText = String((cw.word))
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
                console.log("Transformed course data:", transformedData)
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
    }, [dialect, setGlobalError, setIsTransformingData, selectedLesson])

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
            // Build words payload from the canonical vocabularyData (clean, typed values)

            const wordsPayload: LessonWord[] = (vocabularyData).map((w) => ({
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

            // Debug: log pauseTime values before sending
            console.log('onDoneCourse - wordsPayload pauseTimes:', wordsPayload.map(w => ({ id: w.id, pause_time: w.pause_time })));

            // mark updating so transform effect won't clear our local list
            updatingLessonRef.current = true
            // Update the lesson record (send full lesson-like payload)
            const result = await updateLessonMutation.mutateAsync({
                ...selectedLesson,
                words: wordsPayload,
                done: String(done),
            })

            // If the mutation returned the updated lesson with words, immediately update
            // local vocabularyData so the UI doesn't briefly show undefined while refetch
            // happens.
            try {
                if (result && Array.isArray(result.words) && result.words.length > 0) {
                    const transformedData = (result.words).map((cw) => {
                        const id = String(cw.id ?? '')
                        const wordText = String((cw.word))
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
                }
            } catch (e) {
                // non-fatal; keep current vocabularyData if transform fails
                console.error('Error applying mutation result to local data:', e)
            }

        } catch (error) {
            console.error("❌ Lỗi khi cập nhật lesson:", error)
        } finally {
            updatingLessonRef.current = false
        }
    }, [selectedLesson, vocabularyData, updateLessonMutation, dialect])

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
            playingIndexRef.current = null
            onDoneCourse()
        } else {
            // ✅ Nếu khóa học đã hoàn thành, reset lại progress trước khi bắt đầu
            const isCompleted = vocabularyData.every(word =>
                Number(word.progress || 0) >= Number(word.maxRead || 3)
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
            // Don't set isPlaying true yet; wait until audio actually starts

            // clear any existing timeout
            if (loopTimeoutRef.current) {
                clearTimeout(loopTimeoutRef.current)
                loopTimeoutRef.current = null
            }

            // Start after an initial 3 second delay
            startingRef.current = true
            loopTimeoutRef.current = setTimeout(() => {
                if (!isForceStopRef.current) {
                    // trigger the play flow via ref-based play function
                    playCurrentWordRef.current?.(currentIndex)
                }
                startingRef.current = false
            }, 3000)
        }
    }

    const readsInCurrentRoundRef = useRef(0)
    const lastUpdatedProgressRef = useRef<{ index: number; progress: number } | null>(null)

    const delay = useCallback((ms: number) => new Promise((res) => setTimeout(res, ms)), []);

    const updateProgress = useCallback(async (index: number) => {
        let newProgress = 0
        setVocabularyData((prev) => {
            const updated = [...prev];
            const current = updated[index];
            const realProgress = Number(current.progress);
            const maxReads = Number(current.maxRead);

            if (realProgress >= maxReads) {
                // nothing to update
                newProgress = realProgress
                lastUpdatedProgressRef.current = { index, progress: newProgress }
                return prev;
            }

            newProgress = realProgress + 1;
            updated[index] = {
                ...current,
                progress: newProgress.toString(),
            };

            lastUpdatedProgressRef.current = { index, progress: newProgress }
            return updated;
        });

        return newProgress
    }, [setVocabularyData]);

    // playTrigger/forcePlayCurrentWord removed: we trigger playback
    // by calling playCurrentWord directly or by changing currentIndex.

    // Function to find next word that needs to be played
    const findNextWordToPlay = useCallback(() => {
        const totalWords = vocabularyData.length;
        if (totalWords === 0) return;

        const nextIndex = currentIndex + 1;

        for (let i = nextIndex; i < totalWords; i++) {
            const word = vocabularyData[i];
            if (Number(word.progress) < Number(word.maxRead)) {
                // console.log(`➡️ [TÌM TỪ SAU] "${word.word}"`);
                setCurrentIndex(i);
                // trigger playback for the selected index, but only if no play is active
                if (playingIndexRef.current === null) {
                    playCurrentWordRef.current?.(i);
                }
                return;
            }
        }

        for (let i = 0; i < currentIndex; i++) {
            const word = vocabularyData[i];
            if (Number(word.progress) < Number(word.maxRead)) {
                // console.log(`🔁 [QUAY LẠI ĐẦU] "${word.word}"`);
                setCurrentIndex(i);
                if (playingIndexRef.current === null) {
                    playCurrentWordRef.current?.(i);
                }
                return;
            }
        }

        const current = vocabularyData[currentIndex];
        if (!current) {
            // If currentIndex is out of range, clamp to last index
            if (vocabularyData.length > 0) {
                setCurrentIndex(vocabularyData.length - 1);
            }
            setIsLooping(false);
            setIsPlaying(false);
            isForceStopRef.current = true;
            onDoneCourse();
            return;
        }

        if (Number(current.progress) >= Number(current.maxRead)) {
            // console.log(`🛑 [DỪNG] Tất cả các từ đã đạt maxReads.`);
            // Ensure we display the last word (keep currentIndex in bounds)
            if (vocabularyData.length > 0) {
                setCurrentIndex(Math.min(currentIndex, vocabularyData.length - 1));
            }
            setIsLooping(false);
            setIsPlaying(false);
            isForceStopRef.current = true;
            console.log('index:', currentIndex);
            // ✅ Không reset currentIndex, giữ nguyên vị trí hiện tại
            onDoneCourse()
        } else {
            playCurrentWordRef.current?.(currentIndex);
        }
    }, [
        vocabularyData,
        currentIndex,
        setCurrentIndex,
        setIsLooping,
        setIsPlaying,
        isForceStopRef,
        onDoneCourse
    ]);

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

    // Keep a reference to the last non-null word so the UI can continue showing it
    // if vocabularyData temporarily becomes empty (e.g. during refetch).
    useEffect(() => {
        if (currentWord) {
            lastShownWordRef.current = currentWord
        }
    }, [currentWord])

    const onWordEnded = useCallback(async (indexParam?: number, updatedProgress?: number) => {
        const idx = typeof indexParam === 'number' ? indexParam : currentIndex
        const word = vocabularyData[idx]
        if (!word) return

        const readsPerRound = Number(word.reads_per_round)
        const currentReadsInRound = readsInCurrentRoundRef.current + 1

        console.log(`🔄 [ON WORD ENDED] "${word.word}" - currentReadsInRound: ${currentReadsInRound}/${readsPerRound} - ${new Date().toISOString()}`)

        if (currentReadsInRound >= readsPerRound) {
            console.log(`✅ [HOÀN VÒNG] "${word.word}" - chuyển tìm từ tiếp theo (delay đã xử lý ở onended) - ${new Date().toISOString()}`)
            readsInCurrentRoundRef.current = 0
            findNextWordToPlay()
            return
        }

        readsInCurrentRoundRef.current = currentReadsInRound

        const maxReads = Number(word.maxRead)
        const progress = typeof updatedProgress === 'number'
            ? updatedProgress
            : Number(word.progress || 0)

        if (progress < maxReads && !isForceStopRef.current) {
            console.log(`🔁 [LẶP LẠI] "${word.word}" (${progress}/${maxReads}) - Lượt ${currentReadsInRound}/${readsPerRound} - ${new Date().toISOString()}`)
            // pass the known freshest progress into playCurrentWord to avoid stale reads
            playCurrentWordRef.current?.(idx, progress)
        } else {
            console.log(`⛔ [KHÔNG LẶP] "${word.word}" đã đủ progress (${progress}/${maxReads}) - ${new Date().toISOString()}`)
            if (!isForceStopRef.current) {
                console.log(`🔍 [CHUYỂN] Không còn lượt lặp, tìm từ mới... - ${new Date().toISOString()}`)
                findNextWordToPlay()
            }
        }
    }, [
        vocabularyData,
        currentIndex,
        readsInCurrentRoundRef,
        findNextWordToPlay,
        isForceStopRef
    ])

    const playCurrentWord = useCallback(
        async (indexToPlay: number = currentIndex, knownProgress?: number) => {
            const wordToPlay = vocabularyData[indexToPlay];
            if (!audioRef.current || !wordToPlay || isForceStopRef.current) return;

            // Prevent overlapping/reentrant plays: if any play is active, don't start another
            if (playingIndexRef.current !== null) {
                return
            }
            playingIndexRef.current = indexToPlay

            const progress = typeof knownProgress === 'number' ? knownProgress : Number(wordToPlay.progress);
            const maxReads = Number(wordToPlay.maxRead);

            // ✅ Nếu đã maxReads thì KHÔNG phát nữa
            if (progress === maxReads) {
                // If already at max reads, treat as ended but keep playingIndexRef set until
                // onWordEnded completes to avoid another play being started concurrently.
                await onWordEnded(indexToPlay, progress);
                playingIndexRef.current = null;
                return;
            }

            console.log(`🎧 [PLAY START] Từ: "${wordToPlay.word}" - Progress: ${progress}/${maxReads} - pauseTime: ${wordToPlay.pause_time}s - ${new Date().toISOString()}`);

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

                // ✅ Delay sau khi phát xong audio, sử dụng pause_time của từ hiện tại
                // Default to 3 seconds pause if pause_time is missing or zero
                const pauseMs = (Number(wordToPlay.pause_time) || 3) * 1000;
                if (pauseMs > 0) {
                    console.log(`⏸️ [DELAY START] "${wordToPlay.word}" - nghỉ ${pauseMs}ms (${wordToPlay.pause_time}s) - ${new Date().toISOString()}`);
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
                const newProgress = await updateProgress(indexToPlay);
                console.log(`🔄 [WORD ENDED] "${wordToPlay.word}" - gọi onWordEnded - ${new Date().toISOString()}`);
                // Keep playingIndexRef set while onWordEnded runs to prevent re-entrant plays.
                await onWordEnded(indexToPlay, newProgress);
                playingIndexRef.current = null;
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

    // expose playCurrentWord via ref so other callbacks can call it without
    // adding it to many dependency arrays
    useEffect(() => {
        playCurrentWordRef.current = playCurrentWord;
    }, [playCurrentWord]);

    //Effect to auto-play when currentIndex changes during looping
    useEffect(() => {
        // ✅ Chỉ phát audio khi đang trong chế độ looping (đã nhấn "Bắt đầu")
        if (startingRef.current) return // during initial wait, don't auto-play
        if (!isForceStopRef.current && isLooping) {
            // don't auto-start if another play is currently active
            if (playingIndexRef.current !== null) return
            // console.log(`${currentIndex}: `, vocabularyData[currentIndex]?.maxReads)
            // console.log(`${currentIndex}: `, vocabularyData[currentIndex]?.progress)
            playCurrentWord(currentIndex);
        }
    }, [currentIndex, playCurrentWord, isLooping]);

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
        // const word = currentWord || lastShownWordRef.current;
        const word = vocabularyData[currentIndex]
        if (!word) {
            return <span className="text-4xl text-gray-400">Đang tải...</span>;
        }
        console.log('word:', word);
        const readCount = Number(word.progress); // ✅ dùng progress thay vì wordReadCount*

        const ipaRounds = Number(word.show_ipa);
        const wordRounds = Number(word.show_word);
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

    const updateCourseWord = (wordId: string, field: keyof { id: string, word: string, ipa: string, meaning: string, maxRead: string, show_ipa: boolean, show_word: boolean, show_ipa_and_word: boolean, progress: number, reads_per_round: string, pause_time: string }, value: string) => {
        setVocabularyData((prevWords) => {
            const updated = prevWords.map((word) => (word.id === wordId ? { ...word, [field]: value } : word))
            // Debug: log the change for the specific word
            try {
                const before = prevWords.find(w => w.id === wordId)
                const after = updated.find(w => w.id === wordId)
                console.log('updateCourseWord:', { wordId, field, value, before, after })
            } catch {
                // ignore logging errors
            }
            return updated
        })
    }

    // // Error handling
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

    // Show error if course not found but courseId exists
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
            {/* Top Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 bg-white shadow-sm">
                <div className="mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <h1 className="text-2xl font-bold text-gray-900">
                            Vocab Trainer
                        </h1>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {selectedLesson && selectedLesson.name}
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
            {lessonId ? (
                <main className="mx-auto min-h-[52rem] px-4 py-8 sm:px-6 lg:pb-8 lg:pt-16 flex flex-col space-y-5">
                    {/* Radio Button Controls */}
                    <div className="my-3 flex justify-between">
                        <div className="flex space-x-6">
                            <div className="space-x-2 flex items-center text-gray-900">
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
                                    "flex flex-row space-x-6 text-gray-900",
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
                                            : vocabularyData.every(word => Number(word.progress) >= Number(word.maxRead))
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
                            {(() => {
                                const badgeWord = currentWord || lastShownWordRef.current
                                const progress = badgeWord ? Number(badgeWord.progress || 0) : 0
                                const maxRead = badgeWord ? Number(badgeWord.maxRead || 3) : 0
                                const colorClass = badgeWord && progress >= maxRead ? "text-green-600" : "text-blue-600"
                                return (
                                    <span className={`p-2 text-lg font-medium ${colorClass}`}>
                                        {badgeWord ? `${badgeWord.progress}/${badgeWord.maxRead}` : "0/0"}
                                    </span>
                                )
                            })()}
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

                            <Table className="text-gray-900">
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
                                                    value={item.pause_time}
                                                    onChange={(e) => updateCourseWord(item.id, "pause_time", e.target.value)}
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
                                                    className={`text-sm font-medium ${(item.progress || 0) >= (item.maxRead || 3)
                                                        ? "text-green-600"
                                                        : "text-blue-600"
                                                        }`}
                                                >
                                                    {item.progress || 0}/{item.maxRead || 3}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </main>) : (
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
