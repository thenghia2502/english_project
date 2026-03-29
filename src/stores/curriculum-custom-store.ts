import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { Curriculum, Level, Unit, CurriculumPagination } from '@/lib/types'

interface CurriculumCustomState {
  // Data
  curriculums: Curriculum[]
  selectedCurriculum: Curriculum | null
  selectedLevel: Level | null
  selectedUnits: Unit[]
  
  // Pagination
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  
  // Cache for optimization
  cache: Record<string, Curriculum>
  
  // Loading states
  isLoading: boolean
  error: string | null
  
  // Filters
  searchQuery: string
  curriculumOriginalIds: string[]
  
  // Actions
  setCurriculums: (curriculums: Curriculum[]) => void
  setPagination: (pagination: CurriculumPagination) => void
  setSelectedCurriculum: (curriculum: Curriculum | null) => void
  setSelectedLevel: (level: Level | null) => void
  setSelectedUnits: (units: Unit[]) => void
  addToCache: (curriculum: Curriculum) => void
  getFromCache: (id: string) => Curriculum | null
  updateCurriculum: (id: string, updates: Partial<Curriculum>) => void
  deleteCurriculum: (id: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setSearchQuery: (query: string) => void
  setCurriculumOriginalIds: (ids: string[]) => void
  reset: () => void
}

const initialState = {
  curriculums: [],
  selectedCurriculum: null,
  selectedLevel: null,
  selectedUnits: [],
  pagination: {
    page: 1,
    limit: 16,
    total: 0,
    totalPages: 1,
  },
  cache: {},
  isLoading: false,
  error: null,
  searchQuery: '',
  curriculumOriginalIds: [],
}

export const useCurriculumCustomStore = create<CurriculumCustomState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        setCurriculums: (curriculums: Curriculum[]) => 
          set({ 
            curriculums,
            isLoading: false,
            error: null 
          }, false, 'setCurriculums'),

        setPagination: (paginationData: CurriculumPagination) => 
          set({ 
            curriculums: paginationData.data,
            pagination: {
              page: paginationData.page,
              limit: paginationData.limit,
              total: paginationData.total,
              totalPages: paginationData.totalPages,
            },
            isLoading: false,
            error: null 
          }, false, 'setPagination'),

        setSelectedCurriculum: (curriculum: Curriculum | null) => 
          set({ 
            selectedCurriculum: curriculum,
            selectedLevel: null, // Reset level when curriculum changes
            selectedUnits: [] // Reset units when curriculum changes
          }, false, 'setSelectedCurriculum'),
        
        setSelectedLevel: (level: Level | null) => 
          set({ 
            selectedLevel: level,
            selectedUnits: []
          }, false, 'setSelectedLevel'),
        
        setSelectedUnits: (units: Unit[]) => 
          set({ selectedUnits: units }, false, 'setSelectedUnits'),
        
        addToCache: (curriculum: Curriculum) => {
          const { cache } = get()
          set({ 
            cache: { 
              ...cache, 
              [curriculum.id]: curriculum 
            }
          }, false, 'addToCache')
        },
        
        getFromCache: (id: string) => {
          const { cache } = get()
          return cache[id] || null
        },

        updateCurriculum: (id: string, updates: Partial<Curriculum>) => {
          const { curriculums, cache, selectedCurriculum } = get()
          
          const updatedCurriculums = curriculums.map(curr => 
            curr.id === id ? { ...curr, ...updates } : curr
          )

          const updatedCache = cache[id] 
            ? { ...cache, [id]: { ...cache[id], ...updates } }
            : cache

          const updatedSelected = selectedCurriculum?.id === id 
            ? { ...selectedCurriculum, ...updates }
            : selectedCurriculum

          set({ 
            curriculums: updatedCurriculums,
            cache: updatedCache,
            selectedCurriculum: updatedSelected
          }, false, 'updateCurriculum')
        },

        deleteCurriculum: (id: string) => {
          const { curriculums, cache, selectedCurriculum, pagination } = get()
          
          const updatedCurriculums = curriculums.filter(curr => curr.id !== id)
          // Remove item from cache
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [id]: _, ...updatedCache } = cache
          const updatedSelected = selectedCurriculum?.id === id ? null : selectedCurriculum

          set({ 
            curriculums: updatedCurriculums,
            cache: updatedCache,
            selectedCurriculum: updatedSelected,
            pagination: {
              ...pagination,
              total: Math.max(0, pagination.total - 1)
            }
          }, false, 'deleteCurriculum')
        },

        setLoading: (isLoading: boolean) => 
          set({ isLoading }, false, 'setLoading'),

        setError: (error: string | null) => 
          set({ error, isLoading: false }, false, 'setError'),

        setSearchQuery: (searchQuery: string) => 
          set({ searchQuery }, false, 'setSearchQuery'),

        setCurriculumOriginalIds: (curriculumOriginalIds: string[]) => 
          set({ curriculumOriginalIds }, false, 'setCurriculumOriginalIds'),
        
        reset: () => 
          set(initialState, false, 'reset'),
      }),
      {
        name: 'curriculum-custom-store',
        partialize: (state) => ({
          cache: state.cache,
          searchQuery: state.searchQuery,
          curriculumOriginalIds: state.curriculumOriginalIds,
          // Don't persist selected states to avoid stale data
        }),
      }
    ),
    {
      name: 'curriculum-custom-store',
    }
  )
)