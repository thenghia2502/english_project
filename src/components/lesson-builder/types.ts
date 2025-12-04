"use client"

import { LessonWord, Word } from "@/lib/types"

interface LocalWord extends Word {
    selected: boolean
    done: boolean
    word_popularity?: number
    belong?: string
    word_ipa?: string
}

interface LessonWithWords {
    id: string
    title: string
    words: LocalWord[]
}

export interface LessonBuilderHookReturn {
    // Selection logic
    getSelectedCount: () => number
    transferSelectedWords: () => void
    
    // Word management
    updateLessonWord: (wordId: string, field: keyof LessonWord, value: string) => void
    updateMaxReadsLessonWord: (wordId: string, value: string) => void
    removeLessonWord: (wordId: string) => void
    
    // Lesson operations
    handleCreateLesson: () => Promise<void>
    handleUpdateLesson: () => Promise<void>
    
    // Utilities
    calculateEstimatedTime: () => string
}

export interface LessonBuilderState {
    // Data states
    data: { [key: string]: LocalWord[] }
    lessonsFiltered: LessonWithWords[]
    lessonWords: LessonWord[]
    
    // UI states
    courseName: string
    selectedUnitIds: string[]
    expandedChildGroups: Set<string>
    
    // Flags
    isEditMode: boolean
    mounted: boolean
}

export interface Unit {
    id: string
    name: string
    list_word?: Word[]
}

export type { LocalWord, LessonWithWords }