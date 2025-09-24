import { create } from 'zustand'

export type CourseWord = {
  id: string
  word: string
  meaning?: string
}

type LessonStore = {
  selectedLessonId: string | null
  selectedCurriculumId: string | null
  courseWords: CourseWord[]
  setSelectedLesson: (id: string | null) => void
  setSelectedCurriculum: (id: string | null) => void
  setCourseWords: (words: CourseWord[]) => void
  addCourseWord: (word: CourseWord) => void
  removeCourseWord: (id: string) => void
  clearCourseWords: () => void
}

type SetState<T> = (partial: Partial<T> | ((state: T) => Partial<T>)) => void

export const useLessonStore = create<LessonStore>((set: SetState<LessonStore>) => ({
  selectedLessonId: null,
  selectedCurriculumId: null,
  courseWords: [],
  setSelectedLesson: (id: string | null) => set({ selectedLessonId: id }),
  setSelectedCurriculum: (id: string | null) => set({ selectedCurriculumId: id }),
  setCourseWords: (words: CourseWord[]) => set({ courseWords: words }),
  addCourseWord: (word: CourseWord) => set((state: LessonStore) => ({ courseWords: [...state.courseWords, word] })),
  removeCourseWord: (id: string) => set((state: LessonStore) => ({ courseWords: state.courseWords.filter((w: CourseWord) => w.id !== id) })),
  clearCourseWords: () => set({ courseWords: [] }),
}))

export default useLessonStore
