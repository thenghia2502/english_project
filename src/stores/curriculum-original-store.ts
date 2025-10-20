import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { Curriculum, Level, Unit, CurriculumPagination } from '@/lib/types'

interface CurriculumOriginalState {
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
  
  // Actions
  setCurriculums: (curriculums: Curriculum[]) => void
  setPagination: (pagination: CurriculumPagination) => void
  setSelectedCurriculum: (curriculum: Curriculum | null) => void
  setSelectedLevel: (level: Level | null) => void
  setSelectedUnits: (units: Unit[]) => void
  addToCache: (curriculum: Curriculum) => void
  getFromCache: (id: string) => Curriculum | null
  updateCurriculum: (id: string, updates: Partial<Curriculum>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setSearchQuery: (query: string) => void
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
}

export const useCurriculumOriginalStore = create<CurriculumOriginalState>()(
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
            curriculums: paginationData.items,
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
            selectedUnits: [] // Reset units, will be populated separately
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

        setLoading: (isLoading: boolean) => 
          set({ isLoading }, false, 'setLoading'),

        setError: (error: string | null) => 
          set({ error, isLoading: false }, false, 'setError'),

        setSearchQuery: (searchQuery: string) => 
          set({ searchQuery }, false, 'setSearchQuery'),
        
        reset: () => 
          set(initialState, false, 'reset'),
      }),
      {
        name: 'curriculum-original-store',
        partialize: (state) => ({
          cache: state.cache,
          searchQuery: state.searchQuery,
          // Don't persist selected states to avoid stale data
        }),
      }
    ),
    {
      name: 'curriculum-original-store',
    }
  )
)