import { FormValues, Unit, Curriculum, Level } from "@/lib/types"
import { Control } from "react-hook-form"

export type LevelShort = Level

export interface TopNavigationProps {
  isEditMode: boolean
  onNavigateToLessonManagement: () => void
}

export interface FormHeaderProps {
  isEditMode: boolean
}

export interface CurriculumSelectorProps {
  control: Control<FormValues>
  curriculums: Curriculum[]
  selectedCurriculum: Curriculum | undefined
  onCurriculumChange: () => void
  isEditMode: boolean
}

export interface LevelSelectorProps {
  control: Control<FormValues>
  levels: LevelShort[]
  selectedLevel: LevelShort | undefined
  onLevelChange: (levelId: string) => void
  isEditMode: boolean
}

export interface LessonGridProps {
  control: Control<FormValues>
  baiList: Unit[]
  currentItems: Unit[]
  originalSelectedRef: { current: string[] }
  isEditMode: boolean
  onItemChange: () => void
}

export interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  totalItems: number
  startIndex: number
  endIndex: number
  onPageChange: (page: number) => void
}

export interface SubmitButtonProps {
  isSubmitting: boolean
  isEditMode: boolean
}

export interface LessonSelectionSectionProps {
  control: Control<FormValues>
  baiList: Unit[]
  currentItems: Unit[]
  currentPage: number
  totalPages: number
  totalItems: number
  startIndex: number
  endIndex: number
  originalSelectedRef: { current: string[] }
  isEditMode: boolean
  onPageChange: (page: number) => void
  onItemChange: () => void
}