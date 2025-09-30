"use client"

import { useCallback, useRef, useEffect } from "react"
import { LessonWord } from '@/lib/types'
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

interface UseAudioManagerProps {
    vocabularyData: LessonWord[]
    currentIndex: number
    dialect: string
    isLooping: boolean
    setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>
    setIsLooping: React.Dispatch<React.SetStateAction<boolean>>
    setAudioError: React.Dispatch<React.SetStateAction<boolean>>
    setCurrentIndex: React.Dispatch<React.SetStateAction<number>>
    setVocabularyData: React.Dispatch<React.SetStateAction<LessonWord[]>>
    onDoneCourse: () => Promise<void>
}

export function useAudioManager({
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
}: UseAudioManagerProps) {
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const loopTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const isForceStopRef = useRef(true)
    const playingIndexRef = useRef<number | null>(null)
    const startingRef = useRef(false)
    const playCurrentWordRef = useRef<((index?: number, knownProgress?: number) => Promise<void>) | null>(null)
    const readsInCurrentRoundRef = useRef(0)

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
    }, [setIsPlaying, setAudioError])

    const delay = useCallback((ms: number) => new Promise((res) => setTimeout(res, ms)), [])

    const updateProgress = useCallback(async (index: number) => {
        let newProgress = 0
        setVocabularyData((prev) => {
            const updated = [...prev]
            const current = updated[index]
            const realProgress = Number(current.progress)
            const maxReads = Number(current.maxRead)

            if (realProgress >= maxReads) {
                newProgress = realProgress
                return prev
            }

            newProgress = realProgress + 1
            updated[index] = {
                ...current,
                progress: newProgress.toString(),
            }

            return updated
        })

        return newProgress
    }, [setVocabularyData])

    const findNextWordToPlay = useCallback(() => {
        const totalWords = vocabularyData.length
        if (totalWords === 0) return

        const nextIndex = currentIndex + 1

        for (let i = nextIndex; i < totalWords; i++) {
            const word = vocabularyData[i]
            if (Number(word.progress) < Number(word.maxRead)) {
                setCurrentIndex(i)
                if (playingIndexRef.current === null) {
                    playCurrentWordRef.current?.(i)
                }
                return
            }
        }

        for (let i = 0; i < currentIndex; i++) {
            const word = vocabularyData[i]
            if (Number(word.progress) < Number(word.maxRead)) {
                setCurrentIndex(i)
                if (playingIndexRef.current === null) {
                    playCurrentWordRef.current?.(i)
                }
                return
            }
        }

        const current = vocabularyData[currentIndex]
        if (!current) {
            if (vocabularyData.length > 0) {
                setCurrentIndex(vocabularyData.length - 1)
            }
            setIsLooping(false)
            setIsPlaying(false)
            isForceStopRef.current = true
            onDoneCourse()
            return
        }

        if (Number(current.progress) >= Number(current.maxRead)) {
            if (vocabularyData.length > 0) {
                setCurrentIndex(Math.min(currentIndex, vocabularyData.length - 1))
            }
            setIsLooping(false)
            setIsPlaying(false)
            isForceStopRef.current = true
            onDoneCourse()
        } else {
            playCurrentWordRef.current?.(currentIndex)
        }
    }, [
        vocabularyData,
        currentIndex,
        setCurrentIndex,
        setIsLooping,
        setIsPlaying,
        onDoneCourse
    ])

    const onWordEnded = useCallback(async (indexParam?: number, updatedProgress?: number) => {
        const idx = typeof indexParam === 'number' ? indexParam : currentIndex
        const word = vocabularyData[idx]
        if (!word) return

        const readsPerRound = Number(word.reads_per_round)
        const currentReadsInRound = readsInCurrentRoundRef.current + 1

        if (currentReadsInRound >= readsPerRound) {
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
            playCurrentWordRef.current?.(idx, progress)
        } else {
            if (!isForceStopRef.current) {
                findNextWordToPlay()
            }
        }
    }, [
        vocabularyData,
        currentIndex,
        findNextWordToPlay
    ])

    const playCurrentWord = useCallback(
        async (indexToPlay: number = currentIndex, knownProgress?: number) => {
            const wordToPlay = vocabularyData[indexToPlay]
            if (!audioRef.current || !wordToPlay || isForceStopRef.current) return

            if (playingIndexRef.current !== null) {
                return
            }
            playingIndexRef.current = indexToPlay

            const progress = typeof knownProgress === 'number' ? knownProgress : Number(wordToPlay.progress)
            const maxReads = Number(wordToPlay.maxRead)

            if (progress === maxReads) {
                await onWordEnded(indexToPlay, progress)
                playingIndexRef.current = null
                return
            }

            setAudioError(false)

            audioRef.current.src = getAudioUrlLocal(wordToPlay.word, dialect) || ""
            audioRef.current.currentTime = 0

            audioRef.current.oncanplaythrough = async () => {
                if (isForceStopRef.current) return
                try {
                    if (!audioRef.current) return
                    await audioRef.current.play()
                    setIsPlaying(true)
                } catch {
                    setAudioError(true)
                    setIsLooping(false)
                }
            }

            audioRef.current.onerror = () => {
                setAudioError(true)
                setIsLooping(false)
            }

            audioRef.current.onended = async () => {
                if (isForceStopRef.current) return
                setIsPlaying(false)

                const pauseMs = (Number(wordToPlay.pause_time) || 3) * 1000
                if (pauseMs > 0) {
                    await delay(pauseMs)
                    if (isForceStopRef.current) return
                }

                const newProgress = await updateProgress(indexToPlay)
                await onWordEnded(indexToPlay, newProgress)
                playingIndexRef.current = null
            }
        },
        [
            currentIndex,
            vocabularyData,
            dialect,
            delay,
            setAudioError,
            setIsPlaying,
            setIsLooping,
            updateProgress,
            onWordEnded,
        ]
    )

    const handleAudioToggle = async () => {
        if (!audioRef.current) return

        if (isLooping) {
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
            const isCompleted = vocabularyData.every(word =>
                Number(word.progress || 0) >= Number(word.maxRead || 3)
            )

            let startIndex = currentIndex
            
            if (isCompleted) {
                // Reset tất cả progress về 0
                setVocabularyData(prev => prev.map(word => ({
                    ...word,
                    progress: "0"
                })))
                // Reset về từ đầu tiên
                setCurrentIndex(0)
                startIndex = 0 // Bắt đầu từ từ đầu tiên
                // Reset reads in current round
                readsInCurrentRoundRef.current = 0
            }

            isForceStopRef.current = false
            setIsLooping(true)

            if (loopTimeoutRef.current) {
                clearTimeout(loopTimeoutRef.current)
                loopTimeoutRef.current = null
            }

            startingRef.current = true
            // Reset lại playing index khi bắt đầu lại
            playingIndexRef.current = null
            
            loopTimeoutRef.current = setTimeout(() => {
                if (!isForceStopRef.current) {
                    // Sử dụng startIndex thay vì currentIndex để đảm bảo đúng vị trí
                    playCurrentWordRef.current?.(startIndex)
                }
                startingRef.current = false
            }, 3000)
        }
    }

    const handleRetryAudio = () => {
        setAudioError(false)
        setIsLooping(false)
        isForceStopRef.current = false
        if (loopTimeoutRef.current) {
            clearTimeout(loopTimeoutRef.current)
            loopTimeoutRef.current = null
        }
        handleAudioToggle()
    }

    // Expose playCurrentWord via ref
    useEffect(() => {
        playCurrentWordRef.current = playCurrentWord
    }, [playCurrentWord])

    // Auto-play when currentIndex changes during looping
    useEffect(() => {
        if (startingRef.current) return
        if (!isForceStopRef.current && isLooping) {
            if (playingIndexRef.current !== null) return
            playCurrentWord(currentIndex)
        }
    }, [currentIndex, playCurrentWord, isLooping])

    return {
        playCurrentWord,
        handleAudioToggle,
        handleRetryAudio,
        updateProgress,
        onWordEnded,
        findNextWordToPlay
    }
}