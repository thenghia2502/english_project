export interface Word {
    id: string
    word: string
    meaning: string
    ipa: string
    selected: boolean
    done: boolean
    popularity: number
    belong: string
}

export interface Lesson {
    id: string
    title: string
    words: Word[]
}
export interface CourseWord {
    wordId: string
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
}

export type FormValues = {
    name: string
    curriculum: string
    level: string
    selectedBai: string[] // hoặc number[]
}

export type Unit = {
    id: string
    name: string
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

export interface Curriculum {
    id: string
    title: string
    description?: string
    levels?: Level[]
    createdAt?: string
}

export interface LessonList {
    id: string
    name: string
    id_curriculum: string
    id_level: string
    list_exercise: string[]
}