"use client"

import { useState, useRef, useEffect } from "react"
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
// S3 Configuration - fallback if not found in data.json
const S3_BUCKET_URL = "https://your-vocab-bucket.s3.amazonaws.com/audio"
import data2 from "@/app/taobaihoc/data2.json"
import { cn } from "@/lib/utils"
import { CourseWord, Lesson, Word } from "@/lib/types"
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
    const [selectedCourse, setSelectedCourse] = useState<any>(null)
    const [vocabularyData, setVocabularyData] = useState<any[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isPlaying, setIsPlaying] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    // const maxPlayCount = 100
    const [audioLoading, setAudioLoading] = useState(false)
    const [audioError, setAudioError] = useState(false)
    const [isLooping, setIsLooping] = useState(false)
    const loopTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    // Track read counts for each word
    const currentWord = vocabularyData[currentIndex]
    // Initialize audio element
    useEffect(() => {
        audioRef.current = new Audio()
        audioRef.current.addEventListener("ended", () => {
            setIsPlaying(false)
        })
        audioRef.current.addEventListener("error", () => {
            console.error("Audio playback error")
            setIsPlaying(false)
            setAudioError(true)
            setAudioLoading(false)
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

    const isForceStopRef = useRef(false)

    // Function to handle audio playback with auto-advance
    const handleAudioToggle = async () => {
        if (!audioRef.current || !currentWord) return

        if (isLooping) {
            console.log(`⏹️ Stopping auto-advance sequence`)

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
            console.log(`🚀 Starting auto-advance sequence from word: "${currentWord.word}"`)
            // console.log(`📊 Current read counts:`, word.progress)

            isForceStopRef.current = false
            setIsLooping(true)
            setIsPlaying(true)
            playCurrentWord()
        }
    }

    const readsInCurrentRoundRef = useRef(0)

    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

    const playCurrentWord = async (indexToPlay: number = currentIndex) => {
        const wordToPlay = vocabularyData[indexToPlay];
        if (!audioRef.current || !wordToPlay || isForceStopRef.current) return;

        const progress = Number(wordToPlay.progress || 0);
        const maxReads = Number(wordToPlay.maxReads || 3);

        // ✅ Nếu đã maxReads thì KHÔNG phát nữa
        if (progress >= maxReads) {
            console.log(`⛔ [BỎ QUA PHÁT] "${wordToPlay.word}" đã đạt maxReads (${progress}/${maxReads})`);
            await onWordEnded();
            return;
        }

        console.log(`🎧 [PLAY] Từ: "${wordToPlay.word}" - Progress: ${progress}/${maxReads}`);

        const pauseMs = Number(wordToPlay.pauseTime || 0) * 1000;
        // const readsPerRound = Number(wordToPlay.readsPerRound || 1);

        await delay(pauseMs);
        if (isForceStopRef.current) return;

        setAudioLoading(true);
        setAudioError(false);

        audioRef.current.src = wordToPlay.audioUrl || "";
        audioRef.current.currentTime = 0;

        audioRef.current.oncanplaythrough = async () => {
            if (isForceStopRef.current) return;
            try {
                if (!audioRef.current) return;
                await audioRef.current.play();
                setIsPlaying(true);
                // setPlayCount((prev) => Math.min(prev + 1, maxPlayCount));
                console.log(`▶️ [ĐANG PHÁT] "${wordToPlay.word}"`);
            } catch (error) {
                setAudioError(true);
                setIsLooping(false);
            } finally {
                setAudioLoading(false);
            }
        };

        audioRef.current.onerror = () => {
            setAudioLoading(false);
            setAudioError(true);
            setIsLooping(false);
        };

        audioRef.current.onloadeddata = () => {
            setAudioLoading(false);
        };

        audioRef.current.onended = async () => {
            if (isForceStopRef.current) return;
            setIsPlaying(false);

            await updateProgress(indexToPlay);
            await onWordEnded();
        };
    };

    const updateProgress = async (index: number) => {
        setVocabularyData((prev) => {
            const updated = [...prev];
            const current = updated[index];
            const realProgress = Number(current.progress || 0);
            const maxReads = Number(current.maxReads || 3);

            if (realProgress >= maxReads) {
                console.log(`⚠️ [SKIP] Không cập nhật "${current.word}" vì đã đạt maxReads`);
                return prev;
            }

            const newProgress = realProgress + 1;
            console.log(`📝 [CẬP NHẬT PROGRESS] "${current.word}": ${realProgress} ➡️ ${newProgress}`);

            updated[index] = {
                ...current,
                progress: newProgress,
            };

            // ✅ Cập nhật UI tracking
            // setWordReadCountAfter((prevAfter) => {
            //     const updatedAfter = [...prevAfter];
            //     updatedAfter[index] = (updatedAfter[index] || 0) + 1;
            //     return updatedAfter;
            // });

            return updated;
        });
    };

    const onWordEnded = async () => {
        const word = vocabularyData[currentIndex];
        const readsPerRound = Number(word.readsPerRound || 1);
        const pauseMs = Number(word.pauseTime || 0) * 1000;

        const currentReadsInRound = readsInCurrentRoundRef.current + 1;

        if (currentReadsInRound >= readsPerRound) {
            console.log(`🔄 [HOÀN VÒNG] "${word.word}" - nghỉ ${pauseMs}ms rồi tìm từ tiếp theo`);
            readsInCurrentRoundRef.current = 0;
            await delay(pauseMs);
            findNextWordToPlay();
        } else {
            readsInCurrentRoundRef.current = currentReadsInRound;

            const maxReads = Number(word.maxReads);
            const progress = Number(word.progress || 0);

            if (progress < maxReads && !isForceStopRef.current) {
                console.log(`🔁 [LẶP LẠI] "${word.word}" (${progress}/${maxReads}) - Lượt ${currentReadsInRound}/${readsPerRound}`);
                forcePlayCurrentWord();
            } else {
                console.log(`⛔ [KHÔNG LẶP] "${word.word}" đã đủ progress`);
                if (!isForceStopRef.current) {
                    console.log(`🔍 [CHUYỂN] Không còn lượt lặp, tìm từ mới...`);
                    findNextWordToPlay(); // ✅ Không còn lặp → tìm từ khác
                }
            }
        }
    };


    // Function to find next word that needs to be played
    const findNextWordToPlay = () => {
        const totalWords = vocabularyData.length;
        if (totalWords === 0) return;

        const nextIndex = currentIndex + 1;

        for (let i = nextIndex; i < totalWords; i++) {
            const word = vocabularyData[i];
            if (Number(word.progress) < Number(word.maxReads)) {
                console.log(`➡️ [TÌM TỪ SAU] "${word.word}"`);
                setCurrentIndex(i);
                forcePlayCurrentWord();
                return;
            }
        }

        for (let i = 0; i < currentIndex; i++) {
            const word = vocabularyData[i];
            if (Number(word.progress) < Number(word.maxReads)) {
                console.log(`🔁 [QUAY LẠI ĐẦU] "${word.word}"`);
                setCurrentIndex(i);
                forcePlayCurrentWord();
                return;
            }
        }

        const current = vocabularyData[currentIndex];
        if (Number(current.progress) >= Number(current.maxReads)) {
            console.log(`🛑 [DỪNG] Tất cả các từ đã đạt maxReads.`);
            setIsLooping(false);
            setIsPlaying(false);
            isForceStopRef.current = true;
            setCurrentIndex(0);
            onDoneCourse()
        } else {
            console.log(`🔁 [LẶP LẠI HIỆN TẠI] "${current.word}"`);
            forcePlayCurrentWord();
        }
    };

    const onDoneCourse = async () => {
        if (!selectedCourse || vocabularyData.length === 0) return
        console.log('vd: ', vocabularyData)

        const sc = selectedCourse.words.map((cw: CourseWord) => {
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
        console.log('sc: ', sc)
        // ✅ Gửi PATCH request để cập nhật trạng thái done của course
        try {
            const res = await fetch("/api/courses/done", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: selectedCourse.id,
                    words: sc,
                    done,
                }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            console.log("✅ Đã cập nhật trạng thái done:", done)
        } catch (error) {
            console.error("❌ Lỗi khi cập nhật course:", error)
        }
    }

    const [playTrigger, setPlayTrigger] = useState(0);

    const forcePlayCurrentWord = () => {
        setPlayTrigger((prev) => prev + 1);
    };

    //Effect to auto-play when currentIndex changes during looping
    useEffect(() => {
        if (!isForceStopRef.current) {
            // console.log(`${currentIndex}: `, vocabularyData[currentIndex]?.maxReads)
            // console.log(`${currentIndex}: `, vocabularyData[currentIndex]?.progress)
            playCurrentWord(currentIndex);
        }
    }, [playTrigger]);

    // Function to retry audio loading
    const handleRetryAudio = () => {
        setAudioError(false)
        setIsLooping(false)
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

    // const [showName, setShowName] = useState('')
    // const [showExample, setShowExample] = useState('')
    // const handleShowNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    //     setShowName(e.target.checked ? e.target.value : '');
    // };

    // const handleShowExampleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    //     setShowExample(e.target.checked ? e.target.value : '');
    // };

    const updateCourseWord = (wordId: string, field: keyof CourseWord, value: string) => {
        // setCourseWords((prevWords) => prevWords.map((word) => (word.id === wordId ? { ...word, [field]: value } : word)))
        setVocabularyData((prevWords) => prevWords.map((word) => (word.id === wordId ? { ...word, [field]: value } : word)))
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
    const [checked, setChecked] = useState(false)
    const searchParams = useSearchParams()
    const courseId = searchParams.get("courseId")

    useEffect(() => {
        if (!courseId) return

        const fetchCourse = async () => {
            try {
                const res = await fetch(`/api/courses/${courseId}`)
                if (!res.ok) {
                    console.error("Không lấy được khóa học")
                    return
                }
                const course = await res.json()
                setSelectedCourse(course)

                // ✅ Convert course.words → vocabularyData
                const transformedData = await Promise.all(
                    course.words.map(async (cw: CourseWord) => {
                        const res = await fetch(`/api/word/${cw.wordId}`)
                        let word = null
                        if (res.ok) {
                            word = await res.json()
                            console.log('word: ', word)
                        }
                        const res1 = await fetch(`/api/word/level2/${cw.wordId}`)
                        let w2 = null
                        if (res1.ok) {
                            w2 = await res1.json()
                            console.log('w2: ', w2)
                        }
                        return {
                            id: word?.id || w2?.id,
                            word: word?.word || w2?.word || "❓",
                            ipa: word?.ipa || w2?.ipa || "",
                            meaning: word?.meaning || w2?.meaning || "",
                            audioUrl: getAudioUrlLocal(word?.word || w2?.word || "", dialect),
                            maxReads: Number(cw.maxReads) || 3,
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
                // setWordReadCounts(new Array(transformedData.length).fill(0))
                // setWordReadCountBefore(new Array(transformedData.length).fill(0))
                // setWordReadCountAfter(new Array(transformedData.length).fill(0))

            } catch (error) {
                console.error("Lỗi khi fetch khóa học:", error)
            }
        }

        fetchCourse()
    }, [courseId])

    const [dialect, setDialect] = useState("us")

    useEffect(() => {
        if (vocabularyData.length === 0) return

        const updatedData = vocabularyData.map(word => ({
            ...word,
            audioUrl: getAudioUrlLocal(word.word, dialect)
        }))

        setVocabularyData(updatedData)
    }, [dialect])

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Navigation */}
            <nav className="border-b border-gray-200 bg-white shadow-sm">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-center">
                        <h1 className="text-2xl font-bold text-gray-900">
                            {selectedCourse ? selectedCourse.name : "Vocab Trainer"}
                        </h1>
                    </div>
                </div>
            </nav>

            {vocabularyData.length > 0 ? (
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
                            <RadioGroup value={dialect} onValueChange={setDialect} className="flex flex-row space-x-6">
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
                                        className="px-6 py-2 rounded-full font-medium transition-all duration-200 bg-orange-500 h over:bg-orange-600 text-white"
                                    >
                                        Thử lại
                                    </Button>
                                    <div className="text-xs text-red-500 mt-1 text-center">Không tải được file âm thanh</div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <Button
                                        className={`max-w-[100px] px-6 py-2 rounded-full font-medium transition-all duration-200 ${isLooping
                                            ? "bg-red-600 hover:bg-red-700 text-white"
                                            : "bg-blue-600 hover:bg-blue-700 text-white"
                                            }`}
                                        onClick={handleAudioToggle}
                                        disabled={audioLoading}
                                    >
                                        {isLooping ? "Dừng lại" : "Bắt đầu"}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    <Card className="shadow-lg bg-white flex-1 relative">
                        <div className="absolute h-[50px] w-[50px] flex justify-center items-center">
                            <span
                                className={`p-2 text-lg font-medium ${(vocabularyData[currentIndex].progress || 0) >= (vocabularyData[currentIndex].maxReads || 3)
                                    ? "text-green-600"
                                    : "text-blue-600"
                                    }`}
                            >
                                {vocabularyData[currentIndex].progress || 0}/{vocabularyData[currentIndex].maxReads || 3}
                            </span>
                        </div>
                        <CardContent className="p-6 min-h-full">
                            {/* Horizontal Display Row */}
                            <div className="h-[46rem] mb-6 flex items-center justify-between bg-gray-50 rounded-lg p-4 min-h-[120px]">
                                {/* Center: Vocabulary Display or Flashcard */}
                                <div className="h-full w-full mx-4 md:mx-8 flex justify-center items-center">
                                    <div className="">{renderVocabularyDisplay()}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    {/* Vocabulary Table - Only show when "danh sách từ" is selected */}
                    {checked && (
                        <div className={cn(
                            "rounded-lg border border-gray-200 overflow-hidden transition-all",
                            !isForceStopRef.current && "pointer-events-none opacity-50"
                        )}>

                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead className="w-12 text-center font-semibold">#</TableHead>
                                        <TableHead className="font-semibold">Từ</TableHead>
                                        <TableHead className="font-semibold">IPA</TableHead>
                                        {/* <TableHead className="font-semibold">Nghĩa</TableHead> */}
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
                                            }} className="text-center font-medium text-gray-600">{item.id}</TableCell>
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
                                            {/* <TableCell className="text-gray-700">{item.meaning}</TableCell> */}
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
                </main>
            ) : (
                <div className="mx-auto px-4 py-8 sm:px-6 lg:px-8">
                    <Card className="shadow-lg bg-white">
                        <CardContent className="p-12 text-center">
                            <div className="text-gray-400">
                                <div className="text-5xl mb-4">📚</div>
                                <p className="text-lg font-medium mb-2 text-gray-600">Chưa có khóa học nào được chọn</p>
                                <p className="text-sm text-gray-500 mb-6">Vui lòng chọn một khóa học để bắt đầu học</p>
                                <Button
                                    onClick={() => (window.location.href = "/quanlykhoahoc")}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    Chọn khóa học
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
