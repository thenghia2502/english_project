"use client"

import SearchBar from "./SearchBar"
import EmptyState from "./EmptyState"
import CurriculumCarousel from '@/components/curriculum-management/CurriculumCarousel'
import { Unit } from "@/lib/types"

interface Curriculum {
    id: string
    name: string
    description?: string
    list_unit?: Unit[]
    created_at?: string
    updated_at?: string
}

interface CurriculumSectionProps {
    curriculums: Curriculum[]
    searchQuery: string
    setSearchQuery: (query: string) => void
    curriculumCarouselIndex: number
    setCurriculumCarouselIndex: (index: number) => void
    deleteCurriculum: (id: string) => Promise<void>
    formatDate: (date: string | Date) => string
    getTotalUnits: (units?: Unit[]) => number
    getTotalWords: (units?: Unit[]) => number
    routerPush: (path: string) => void
}

export default function CurriculumSection({
    curriculums,
    searchQuery,
    setSearchQuery,
    curriculumCarouselIndex,
    setCurriculumCarouselIndex,
    deleteCurriculum,
    formatDate,
    getTotalUnits,
    getTotalWords,
    routerPush
}: CurriculumSectionProps) {
    /**
     * Lọc danh sách giáo trình theo từ khóa tìm kiếm
     */
    const getFilteredCurriculums = (query: string) => {
        if (!query.trim()) return curriculums
        return curriculums.filter(curriculum =>
            curriculum.name.toLowerCase().includes(query.toLowerCase())
        )
    }

    const filteredCurriculums = getFilteredCurriculums(searchQuery)

    return (
        <div className="mx-auto">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold mb-2 text-black">
                        Danh sách giáo trình gốc ({filteredCurriculums.length})
                    </h2>
                    <p className="text-black">Quản lý các giáo trình và chương trình học</p>
                </div>

                <SearchBar
                    placeholder="Tìm kiếm giáo trình theo tên..."
                    value={searchQuery}
                    onChange={setSearchQuery}
                />
            </div>

            {filteredCurriculums.length === 0 ? (
                <EmptyState
                    title="Không tìm thấy giáo trình nào"
                    description={`Không có giáo trình nào khớp với từ khóa "${searchQuery}"`}
                />
            ) : (
                <CurriculumCarousel
                    searchQuery={searchQuery}
                    getFilteredCurriculums={getFilteredCurriculums}
                    curriculumCarouselIndex={curriculumCarouselIndex}
                    setCurriculumCarouselIndex={setCurriculumCarouselIndex}
                    deleteCurriculum={deleteCurriculum}
                    formatDate={formatDate}
                    getTotalUnits={getTotalUnits}
                    getTotalWords={getTotalWords}
                    routerPush={routerPush}
                />
            )}
        </div>
    )
}