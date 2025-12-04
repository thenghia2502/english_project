export interface Curriculum {
    id: string
    curriculum_name: string
    description?: string
}

export interface CustomCurriculumItem {
    id: string
    name: string
    description?: string
    courseTitle?: string
    created_at?: string
    updated_at?: string
}

export interface CurriculumFilterProps {
    curriculums: Curriculum[]
    selectedOriginalIds: string[] | undefined
    setSelectedOriginalIds: React.Dispatch<React.SetStateAction<string[] | undefined>>
    onApplyFilter: () => void
    onClearFilter: () => void
}

export interface CustomCurriculumListProps {
    customCurriculums: CustomCurriculumItem[]
    isLoading: boolean
    hasNextPage: boolean
    onLoadMore: () => void
    onViewCurriculum: (id: string) => void
    onDeleteCurriculum: (id: string) => void
}

export interface CurriculumSectionProps {
    title: string
    searchTerm: string
    onSearchChange: (value: string) => void
    curriculums: Curriculum[]
    emptyMessage?: string
}

export interface EmptyStateProps {
    icon: React.ComponentType<{ className?: string }>
    title: string
    description: string
}

export interface SearchBarProps {
    placeholder: string
    value: string
    onChange: (value: string) => void
    className?: string
}