import { useState, useMemo, useEffect, useRef } from 'react'
import { useCurriculumOriginal, useCurriculumCustomList, useDeleteCurriculumCustom } from '@/hooks/use-curriculum'
import { useRouter } from 'next/navigation'
import { Unit } from '@/lib/types'

interface Curriculum {
    id: string
    name: string
    description?: string
    list_unit?: Unit[]
    created_at?: string
    updated_at?: string
}

export function useCurriculumManagement() {
    // Search states
    const [originalSearchTerm, setOriginalSearchTerm] = useState("")
    const [customSearchTerm, setCustomSearchTerm] = useState("")
    
    // Filter states
    const [selectedOriginalIds, setSelectedOriginalIds] = useState<string[] | undefined>(undefined)
    const [filteredCurriculums, setFilteredCurriculums] = useState<Curriculum[]>([])
    const [appliedOriginalIds, setAppliedOriginalIds] = useState<string[] | undefined>(undefined)
    
    // Fetch data using existing hooks
    const { data: curriculums = [] } = useCurriculumOriginal()
    const { data: customCurriculumsData, isLoading: isLoadingCustom } = useCurriculumCustomList(
        1, // page
        16, // limit
        customSearchTerm || undefined,
        appliedOriginalIds
    )
    const deleteCurriculumMutation = useDeleteCurriculumCustom()
    const router = useRouter()

    // Initialize filters with all curriculums selected
    const _initialSelectionSet = useRef(false)
    useEffect(() => {
        if (!_initialSelectionSet.current && Array.isArray(curriculums) && curriculums.length > 0) {
            const allIds = curriculums.map(c => c.id)
            setSelectedOriginalIds(allIds)
            setAppliedOriginalIds(allIds)
            _initialSelectionSet.current = true
        }
    }, [curriculums])

    // Get custom curriculums data
    const customCurriculums = useMemo(() => {
        return customCurriculumsData?.items ?? []
    }, [customCurriculumsData])

    // Filter original curriculums based on search
    const searchFilteredOriginal = useMemo(() => {
        if (!originalSearchTerm.trim()) return curriculums
        
        const searchLower = originalSearchTerm.toLowerCase()
        return curriculums.filter(curriculum =>
            curriculum.name.toLowerCase().includes(searchLower) ||
            curriculum.description?.toLowerCase().includes(searchLower)
        )
    }, [originalSearchTerm, curriculums])

    // Filter custom curriculums based on search (already filtered by the hook)
    const searchFilteredCustom = useMemo(() => {
        return customCurriculums
    }, [customCurriculums])

    // Filter actions
    const handleApplyFilter = () => {
        if (!selectedOriginalIds || selectedOriginalIds.length === 0) {
            setFilteredCurriculums([])
            setAppliedOriginalIds(undefined)
            return
        }

        const filtered = curriculums.filter(curriculum =>
            selectedOriginalIds.includes(curriculum.id)
        )
        setFilteredCurriculums(filtered)
        setAppliedOriginalIds(selectedOriginalIds)
    }

    const handleClearFilter = () => {
        setSelectedOriginalIds(curriculums.map(c => c.id))
        setFilteredCurriculums([])
        setAppliedOriginalIds(curriculums.map(c => c.id))
    }

    // Custom curriculum actions
    const handleViewCurriculum = (id: string) => {
        router.push(`/quanlygiaotrinh/${id}`)
    }

    const handleDeleteCurriculum = async (id: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa giáo trình này?")) return

        try {
            await deleteCurriculumMutation.mutateAsync(id)
        } catch (error) {
            console.error("Error deleting curriculum:", error)
            alert("Có lỗi khi xóa giáo trình!")
        }
    }

    const handleLoadMore = () => {
        // For now, we don't implement infinite loading since the existing hook uses pagination
        console.log('Load more clicked - would need to implement pagination logic')
    }

    return {
        // Search states
        originalSearchTerm,
        setOriginalSearchTerm,
        customSearchTerm,
        setCustomSearchTerm,
        
        // Filter states
        selectedOriginalIds,
        setSelectedOriginalIds,
        filteredCurriculums,
        
        // Data
        originalCurriculums: searchFilteredOriginal,
        customCurriculums: searchFilteredCustom,
        
        // Loading states
        isLoadingCustom,
        isFetchingNextPage: false, // Not using infinite query
        hasNextPage: false, // Not using infinite query
        
        // Actions
        handleApplyFilter,
        handleClearFilter,
        handleViewCurriculum,
        handleDeleteCurriculum,
        handleLoadMore
    }
}