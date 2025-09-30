"use client"

import { LessonWord } from '@/lib/types'

interface VocabDisplayProps {
    currentWord: LessonWord | null
}

export default function VocabDisplay({ currentWord }: VocabDisplayProps) {
    if (!currentWord) {
        return <span className="text-4xl text-gray-400">Đang tải...</span>
    }

    const readCount = Number(currentWord.progress)
    const ipaRounds = Number(currentWord.show_ipa)
    const wordRounds = Number(currentWord.show_word)

    const wordStart = ipaRounds
    const bothStart = ipaRounds + wordRounds

    let phase: 1 | 2 | 3 = 1
    if (readCount <= wordStart) {
        phase = 1 // IPA
    } else if (readCount <= bothStart) {
        phase = 2 // Word
    } else {
        phase = 3 // IPA + Word
    }

    if (phase === 1) {
        return <span className="ipa-text text-[10rem] text-blue-600">{currentWord.ipa}</span>
    }
    
    if (phase === 2) {
        return (
            <span className="text-7xl text-gray-900">
                <span className="ipa-text text-[10rem] text-blue-600">{currentWord.word}</span>
            </span>
        )
    }
    
    return (
        <span className="flex flex-col">
            <span className="ipa-text text-[10rem] text-blue-600 text-center">{currentWord.word}</span>
            <span className="ipa-text text-[10rem] text-blue-600 ml-2">{currentWord.ipa}</span>
        </span>
    )
}