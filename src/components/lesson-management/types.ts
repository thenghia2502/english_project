import { Lesson } from "@/lib/types"

export type SortBy = "date-desc" | "date-asc" | "progress-desc" | "progress-asc"

export interface LessonSortFilterProps {
  sortBy: SortBy
  searchText: string
  onSortChange: (value: string) => void
  onSearchChange: (text: string) => void
  hasResults: boolean
}

export interface LessonCardProps {
  lesson: Lesson
  onDelete: (lessonId: string) => Promise<void>
  onStartLearning: (lesson: Lesson) => void
  onEditLesson: (lesson: Lesson) => void
  formatDate: (dateString: string) => string
}

export interface TopNavigationProps {
  onNavigateToManagement: () => void
}