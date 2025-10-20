export interface Word {
    id: string
    word: string
    meaning: string
    ipa: string
    selected: boolean
    done: boolean
    popularity: number
    belong: string
    parent_id?: string
    lesson_ids?: string[]
    lesson_names?: string[]
}

export interface Lesson {
    id: string
    name: string
    words: LessonWord[]
    created_at: string
    updated_at: string
    estimatedTime: string
    done: string
    curriculum_custom_id: string
}

export interface LessonWord {
    "id": string,
    "word": string,
    "meaning": string,
    "ipa": string,
    "pause_time": string
    maxRead: string
    show_ipa: string
    show_word: string
    show_ipa_and_word: string
    reads_per_round: string
    progress: string
    example?: string
    audioUrl?: string
}
export interface CourseWord {
    id: string
    pauseTime: string
    maxReads: string
    showIpa: string
    showWord: string
    showIpaAndWord: string
    readsPerRound: string
    progress: string
}

export interface Course {
    id: string
    name: string
    words: CourseWord[]
    createdAt: string
    estimatedTime: string
    done: string
    lessonListId: string
}

export type FormValues = {
    name: string
    curriculum: string
    levelId: string
    listSelectedUnit: string[] // hoặc number[]
}

export type Unit = {
    id: string
    name: string
    list_word: Word[]
}

export interface Level {
    id: string
    name: string
    description?: string
    units?: Array<{
        id: string
        name: string
        content?: string
    }>
}

export interface LevelShort {
    id: string
    name: string
}

export interface Curriculum {
    id: string
    name: string
    description?: string
    list_level?: Level[]
    list_unit?: Unit[]
    created_at?: string
    updated_at?: string
}

export interface LessonList {
    id: string
    name: string
    id_curriculum: string
    id_level: string
    list_exercise: string[]
}

export interface CurriculumPagination {
    items: Curriculum[]
    total: number
    page: number
    limit: number
    totalPages: number
}