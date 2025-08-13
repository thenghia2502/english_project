import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface UIState {
  // Loading states
  isLoading: boolean
  isSubmitting: boolean
  
  // Error handling
  error: string | null
  
  // Page navigation
  currentPage: number
  itemsPerPage: number
  
  // Selection states
  selectedItems: string[]
  
  // Modal/Dialog states
  isModalOpen: boolean
  modalType: string | null
  
  // Form states
  isDirty: boolean
  
  // Actions
  setLoading: (loading: boolean) => void
  setSubmitting: (submitting: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  setCurrentPage: (page: number) => void
  setItemsPerPage: (items: number) => void
  setSelectedItems: (items: string[]) => void
  toggleItemSelection: (itemId: string) => void
  clearSelection: () => void
  openModal: (type: string) => void
  closeModal: () => void
  setDirty: (dirty: boolean) => void
  reset: () => void
}

const initialState = {
  isLoading: false,
  isSubmitting: false,
  error: null,
  currentPage: 1,
  itemsPerPage: 10,
  selectedItems: [],
  isModalOpen: false,
  modalType: null,
  isDirty: false,
}

export const useUIStore = create<UIState>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      setLoading: (loading: boolean) => 
        set({ isLoading: loading }, false, 'setLoading'),
      
      setSubmitting: (submitting: boolean) => 
        set({ isSubmitting: submitting }, false, 'setSubmitting'),
      
      setError: (error: string | null) => 
        set({ error }, false, 'setError'),
      
      clearError: () => 
        set({ error: null }, false, 'clearError'),
      
      setCurrentPage: (page: number) => 
        set({ currentPage: page }, false, 'setCurrentPage'),
      
      setItemsPerPage: (items: number) => 
        set({ itemsPerPage: items, currentPage: 1 }, false, 'setItemsPerPage'),
      
      setSelectedItems: (items: string[]) => 
        set({ selectedItems: items }, false, 'setSelectedItems'),
      
      toggleItemSelection: (itemId: string) => {
        const { selectedItems } = get()
        const newSelection = selectedItems.includes(itemId)
          ? selectedItems.filter(id => id !== itemId)
          : [...selectedItems, itemId]
        set({ selectedItems: newSelection }, false, 'toggleItemSelection')
      },
      
      clearSelection: () => 
        set({ selectedItems: [] }, false, 'clearSelection'),
      
      openModal: (type: string) => 
        set({ isModalOpen: true, modalType: type }, false, 'openModal'),
      
      closeModal: () => 
        set({ isModalOpen: false, modalType: null }, false, 'closeModal'),
      
      setDirty: (dirty: boolean) => 
        set({ isDirty: dirty }, false, 'setDirty'),
      
      reset: () => 
        set(initialState, false, 'reset'),
    }),
    {
      name: 'ui-store',
    }
  )
)
