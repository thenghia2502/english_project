// Core entities
export interface Word {
  id: string
  word: string
  pronunciation?: string
  meaning?: string
  audioUrl?: string
  example?: string
  level?: string
  category?: string
}

export interface Lesson {
  id: string
  name: string
  title?: string  // For compatibility with lesson API
  words?: Word[]  // For lesson content
  id_curriculum: string
  id_level: string
  list_exercise: string[]
  createdAt?: string
  updatedAt?: string
}

export interface Course {
  id: string
  name: string
  estimatedTime: string
  words: CourseWord[]
  done: string
  lessonListId: string
  createdAt: string
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

export interface Unit {
  id: string
  name: string
  description?: string
  level?: string
  exercises?: Exercise[]
}

export interface Exercise {
  id: string
  name: string
  type: string
  content?: string
  unitId: string
}

export interface Level {
  id: string
  name: string
  description?: string
  curriculumId: string
  units?: Unit[]
}

export interface Curriculum {
  id: string
  title: string
  description?: string
  levels?: Level[]
  createdAt?: string
  updatedAt?: string
}

// Form types
export interface FormValues {
  name: string
  curriculum: string
  level: string
  selectedBai: string[]
}

export interface CourseFormValues {
  name: string
  lessonListId?: string
  words: CourseWord[]
}

// API Response types
export interface ApiResponse<T> {
  data: T
  message?: string
  status: 'success' | 'error'
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Error types
export interface ApiError {
  message: string
  status?: number
  details?: string
}

// Loading states
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

// Audio types
export interface AudioData {
  [key: string]: string
}

// Store states
export interface UIState {
  isLoading: boolean
  error: string | null
  selectedItems: string[]
  currentPage: number
  itemsPerPage: number
}

export interface FormState {
  isSubmitting: boolean
  isDirty: boolean
  errors: Record<string, string>
}
