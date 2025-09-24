import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { Curriculum, Level, Unit } from '@/types'

interface CurriculumState {
  // Data
  originalCurriculums: Curriculum[]
  customCurriculums: Curriculum[]
  selectedCurriculum: Curriculum | null
  selectedLevel: Level | null
  selectedUnits: Unit[]
  
  // Cache for optimization
  curriculumCache: Record<string, Curriculum>
  
  // Actions
  setOriginalCurriculums: (curriculums: Curriculum[]) => void
  setCustomCurriculums: (curriculums: Curriculum[]) => void
  setSelectedCurriculum: (curriculum: Curriculum | null) => void
  setSelectedLevel: (level: Level | null) => void
  setSelectedUnits: (units: Unit[]) => void
  addCurriculumToCache: (curriculum: Curriculum) => void
  getCurriculumFromCache: (id: string) => Curriculum | null
  updateOriginalCurriculum: (id: string, updates: Partial<Curriculum>) => void
  updateCustomCurriculum: (id: string, updates: Partial<Curriculum>) => void
  reset: () => void
}

const initialState = {
  originalCurriculums: [],
  customCurriculums: [],
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
        
        setOriginalCurriculums: (curriculums: Curriculum[]) => 
          set({ originalCurriculums: curriculums }, false, 'setOriginalCurriculums'),

        setCustomCurriculums: (curriculums: Curriculum[]) =>
          set({ customCurriculums: curriculums }, false, 'setCustomCurriculums'),
        
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
        updateOriginalCurriculum: (id: string, updates: Partial<Curriculum>) => {
          const { originalCurriculums, curriculumCache, selectedCurriculum } = get()
          
          const updatedOriginal = originalCurriculums.map(curr => 
            curr.id === id ? { ...curr, ...updates } : curr
          )

          const updatedCache = curriculumCache[id] 
            ? { ...curriculumCache, [id]: { ...curriculumCache[id], ...updates } }
            : curriculumCache

          const updatedSelected = selectedCurriculum?.id === id 
            ? { ...selectedCurriculum, ...updates }
            : selectedCurriculum

          set({ 
            originalCurriculums: updatedOriginal,
            curriculumCache: updatedCache,
            selectedCurriculum: updatedSelected
          }, false, 'updateOriginalCurriculum')
        },

        updateCustomCurriculum: (id: string, updates: Partial<Curriculum>) => {
          const { customCurriculums, curriculumCache, selectedCurriculum } = get()

          const updatedCustom = customCurriculums.map(curr => 
            curr.id === id ? { ...curr, ...updates } : curr
          )

          const updatedCache = curriculumCache[id] 
            ? { ...curriculumCache, [id]: { ...curriculumCache[id], ...updates } }
            : curriculumCache

          const updatedSelected = selectedCurriculum?.id === id 
            ? { ...selectedCurriculum, ...updates }
            : selectedCurriculum

          set({ 
            customCurriculums: updatedCustom,
            curriculumCache: updatedCache,
            selectedCurriculum: updatedSelected
          }, false, 'updateCustomCurriculum')
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
