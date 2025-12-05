export interface Word {
    word_id: string
    word_text: string
    word_meaning: string
    word_ipa?: string
    selected?: boolean
    done?: boolean
    word_popularity?: number
    belong?: string
    word_parent_id?: string
    lesson_ids?: string[]
    lesson_names?: string[]
    children?: Word[]
}

export interface Lesson {
    lesson_id: string
    lesson_name: string
    lesson_words: LessonWord[]
    lesson_order: number
    lesson_created_at: string
    lesson_updated_at: string
    estimatedTime?: string
    lesson_progress: string
    curriculum: {
        curriculum_name: string
    }
    curriculum_custom_id: string
    units?: {
        level: {
            level_id: string
            level_name: string
            level_code: string
        }
        words: {
            word_id: string
            word: string
            word_meaning: string
        }[]
        unit_id: string
        unit_title: string
    }[],
    unit_ids?: string[]
}

export interface LessonWord {
    word_id: string,
    word: string,
    word_meaning: string,
    word_ipa?: string,
    word_pause_time: string
    word_max_read: string
    word_show_ipa: string
    word_show_word: string
    word_show_ipa_and_word: string
    word_reads_per_round: string
    word_progress: string
    word_popularity: number
    word_parent_id: string
    example?: string
    audioUrl?: string
}

export interface UpdateLessonPayload {
    lesson_id: string
    lesson_name: string
    lesson_order?: number
    unit_ids: string[]
    words: {
        word_id: string
        word_progress: number
        word_pause_time: number
    }[]
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
    unit_id: string
    unit_name: string
    unit_title?: string
    words: {
        original: {
            word_id: string;
            word_text: string;
            word_meaning?: string;
            word_ipa?: string;
            word_popularity?: number;
            word_parent_id?: string | null;
            children?: {
                word_id: string;
                word_text?: string;
                word?: string;
                word_meaning?: string;
                word_ipa?: string;
                word_popularity?: number;
                lesson_ids?: string[];
                lesson_names?: string[];
            }[]
        }[]
        custom: {
            word_id: string;
            word_text: string;
            word_meaning?: string;
            word_ipa?: string;
            word_popularity?: number;
            word_parent_id?: string | null;
            children?: {
                word_id: string;
            word_text?: string;
            word?: string;
            word_meaning?: string;
            word_ipa?: string;
            word_popularity?: number;
            lesson_ids?: string[];
            lesson_names?: string[];
            }[]
        }[]
    }
}

export interface Level {
    // id: string
    // name: string
    // description?: string
    // units?: Array<{
    //     id: string
    //     name: string
    //     content?: string
    // }>
    level_id: string
    level_name: string
    level_code: string
    level_description?: string
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
    levels: {
        level_id: string
        level_name: string
        level_code: string
        level_description?: string
    }[]
    units: {
        unit_title: string
        unit_id: string
        unit_name: string
        unit_description?: string
        unit_order?: number
        level_id: string
        level_name: string
        level_code: string
        level_description?: string
        words: {
            word_id: string
            word: string
            word_meaning: string
            word_ipa?: string
            word_parent_id?: string
            word_popularity?: number
        }[]
    }[]
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