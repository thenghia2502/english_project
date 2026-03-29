import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { Course, Lesson, CourseWord } from '@/lib/types'

interface CourseState {
  // Data
  courses: Course[]
  lessons: Lesson[]
  selectedCourse: Course | null
  selectedLesson: Lesson | null
  
  // Form data
  currentCourseForm: {
    name: string
    lessonListId: string
    words: CourseWord[]
  }
  
  // Cache
  courseCache: Record<string, Course>
  lessonCache: Record<string, Lesson>
  
  // Actions
  setCourses: (courses: Course[]) => void
  setLessons: (lessons: Lesson[]) => void
  setSelectedCourse: (course: Course | null) => void
  setSelectedLesson: (lesson: Lesson | null) => void
  updateCourseForm: (updates: Partial<CourseState['currentCourseForm']>) => void
  resetCourseForm: () => void
  addCourse: (course: Course) => void
  updateCourse: (id: string, updates: Partial<Course>) => void
  deleteCourse: (id: string) => void
  addLesson: (lesson: Lesson) => void
  updateLesson: (id: string, updates: Partial<Lesson>) => void
  deleteLesson: (id: string) => void
  addToCache: (type: 'course' | 'lesson', item: Course | Lesson) => void
  getFromCache: (type: 'course' | 'lesson', id: string) => Course | Lesson | null
  reset: () => void
}

const initialCourseForm = {
  name: '',
  lessonListId: '',
  words: [],
}

const initialState = {
  courses: [],
  lessons: [],
  selectedCourse: null,
  selectedLesson: null,
  currentCourseForm: initialCourseForm,
  courseCache: {},
  lessonCache: {},
}

export const useCourseStore = create<CourseState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        setCourses: (courses: Course[]) => 
          set({ courses }, false, 'setCourses'),
        
        setLessons: (lessons: Lesson[]) => 
          set({ lessons }, false, 'setLessons'),
        
        setSelectedCourse: (course: Course | null) => 
          set({ selectedCourse: course }, false, 'setSelectedCourse'),
        
        setSelectedLesson: (lesson: Lesson | null) => 
          set({ selectedLesson: lesson }, false, 'setSelectedLesson'),
        
        updateCourseForm: (updates: Partial<CourseState['currentCourseForm']>) => {
          const { currentCourseForm } = get()
          set({ 
            currentCourseForm: { ...currentCourseForm, ...updates }
          }, false, 'updateCourseForm')
        },
        
        resetCourseForm: () => 
          set({ currentCourseForm: initialCourseForm }, false, 'resetCourseForm'),
        
        addCourse: (course: Course) => {
          const { courses, courseCache } = get()
          set({ 
            courses: [...courses, course],
            courseCache: { ...courseCache, [course.id]: course }
          }, false, 'addCourse')
        },
        
        updateCourse: (id: string, updates: Partial<Course>) => {
          const { courses, courseCache, selectedCourse } = get()
          
          const updatedCourses = courses.map(course => 
            course.id === id ? { ...course, ...updates } : course
          )
          
          const updatedCache = courseCache[id] 
            ? { ...courseCache, [id]: { ...courseCache[id], ...updates } }
            : courseCache
          
          const updatedSelected = selectedCourse?.id === id 
            ? { ...selectedCourse, ...updates }
            : selectedCourse
          
          set({ 
            courses: updatedCourses,
            courseCache: updatedCache,
            selectedCourse: updatedSelected
          }, false, 'updateCourse')
        },
        
        deleteCourse: (id: string) => {
          const { courses, courseCache, selectedCourse } = get()
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [id]: _, ...restCache } = courseCache
          
          set({ 
            courses: courses.filter(course => course.id !== id),
            courseCache: restCache,
            selectedCourse: selectedCourse?.id === id ? null : selectedCourse
          }, false, 'deleteCourse')
        },
        
        addLesson: (lesson: Lesson) => {
          const { lessons, lessonCache } = get()
          set({ 
            lessons: [...lessons, lesson],
            lessonCache: { ...lessonCache, [lesson.id]: lesson }
          }, false, 'addLesson')
        },
        
        updateLesson: (id: string, updates: Partial<Lesson>) => {
          const { lessons, lessonCache, selectedLesson } = get()
          
          const updatedLessons = lessons.map(lesson => 
            lesson.id === id ? { ...lesson, ...updates } : lesson
          )
          
          const updatedCache = lessonCache[id] 
            ? { ...lessonCache, [id]: { ...lessonCache[id], ...updates } }
            : lessonCache
          
          const updatedSelected = selectedLesson?.id === id 
            ? { ...selectedLesson, ...updates }
            : selectedLesson
          
          set({ 
            lessons: updatedLessons,
            lessonCache: updatedCache,
            selectedLesson: updatedSelected
          }, false, 'updateLesson')
        },
        
        deleteLesson: (id: string) => {
          const { lessons, lessonCache, selectedLesson } = get()
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [id]: _, ...restCache } = lessonCache
          
          set({ 
            lessons: lessons.filter(lesson => lesson.id !== id),
            lessonCache: restCache,
            selectedLesson: selectedLesson?.id === id ? null : selectedLesson
          }, false, 'deleteLesson')
        },
        
        addToCache: (type: 'course' | 'lesson', item: Course | Lesson) => {
          const state = get()
          if (type === 'course') {
            set({ 
              courseCache: { ...state.courseCache, [item.id]: item as Course }
            }, false, 'addToCourseCache')
          } else {
            set({ 
              lessonCache: { ...state.lessonCache, [item.id]: item as Lesson }
            }, false, 'addToLessonCache')
          }
        },
        
        getFromCache: (type: 'course' | 'lesson', id: string) => {
          const state = get()
          if (type === 'course') {
            return state.courseCache[id] || null
          } else {
            return state.lessonCache[id] || null
          }
        },
        
        reset: () => 
          set(initialState, false, 'reset'),
      }),
      {
        name: 'course-store',
        partialize: (state) => ({
          courseCache: state.courseCache,
          lessonCache: state.lessonCache,
          // Don't persist selected states or form data
        }),
      }
    ),
    {
      name: 'course-store',
    }
  )
)
