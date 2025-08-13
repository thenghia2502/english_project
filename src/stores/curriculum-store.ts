import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { Curriculum, Level, Unit } from '@/types'

interface CurriculumState {
  // Data
  curriculums: Curriculum[]
  selectedCurriculum: Curriculum | null
  selectedLevel: Level | null
  selectedUnits: Unit[]
  
  // Cache for optimization
  curriculumCache: Record<string, Curriculum>
  
  // Actions
  setCurriculums: (curriculums: Curriculum[]) => void
  setSelectedCurriculum: (curriculum: Curriculum | null) => void
  setSelectedLevel: (level: Level | null) => void
  setSelectedUnits: (units: Unit[]) => void
  addCurriculumToCache: (curriculum: Curriculum) => void
  getCurriculumFromCache: (id: string) => Curriculum | null
  updateCurriculum: (id: string, updates: Partial<Curriculum>) => void
  reset: () => void
}

const initialState = {
  curriculums: [],
  selectedCurriculum: null,
  selectedLevel: null,
  selectedUnits: [],
  curriculumCache: {},
}

export const useCurriculumStore = create<CurriculumState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        setCurriculums: (curriculums: Curriculum[]) => 
          set({ curriculums }, false, 'setCurriculums'),
        
        setSelectedCurriculum: (curriculum: Curriculum | null) => 
          set({ 
            selectedCurriculum: curriculum,
            selectedLevel: null, // Reset level when curriculum changes
            selectedUnits: [] // Reset units when curriculum changes
          }, false, 'setSelectedCurriculum'),
        
        setSelectedLevel: (level: Level | null) => 
          set({ 
            selectedLevel: level,
            selectedUnits: level?.units || []
          }, false, 'setSelectedLevel'),
        
        setSelectedUnits: (units: Unit[]) => 
          set({ selectedUnits: units }, false, 'setSelectedUnits'),
        
        addCurriculumToCache: (curriculum: Curriculum) => {
          const { curriculumCache } = get()
          set({ 
            curriculumCache: { 
              ...curriculumCache, 
              [curriculum.id]: curriculum 
            }
          }, false, 'addCurriculumToCache')
        },
        
        getCurriculumFromCache: (id: string) => {
          const { curriculumCache } = get()
          return curriculumCache[id] || null
        },
        
        updateCurriculum: (id: string, updates: Partial<Curriculum>) => {
          const { curriculums, curriculumCache, selectedCurriculum } = get()
          
          // Update in main list
          const updatedCurriculums = curriculums.map(curr => 
            curr.id === id ? { ...curr, ...updates } : curr
          )
          
          // Update in cache
          const updatedCache = curriculumCache[id] 
            ? { ...curriculumCache, [id]: { ...curriculumCache[id], ...updates } }
            : curriculumCache
          
          // Update selected if it's the same one
          const updatedSelected = selectedCurriculum?.id === id 
            ? { ...selectedCurriculum, ...updates }
            : selectedCurriculum
          
          set({ 
            curriculums: updatedCurriculums,
            curriculumCache: updatedCache,
            selectedCurriculum: updatedSelected
          }, false, 'updateCurriculum')
        },
        
        reset: () => 
          set(initialState, false, 'reset'),
      }),
      {
        name: 'curriculum-store',
        partialize: (state) => ({
          curriculumCache: state.curriculumCache,
          // Don't persist selected states to avoid stale data
        }),
      }
    ),
    {
      name: 'curriculum-store',
    }
  )
)
