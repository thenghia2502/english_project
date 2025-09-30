"use client"

import { useState, useEffect, useRef } from "react"
import CurriculumCustomList from '@/components/curriculum-management/CurriculumCustomList'
import { useRouter } from "next/navigation"
import { Unit } from "@/lib/types"
import Loading from "@/components/ui/loading"
import ErrorHandler from "@/components/ui/error-handler"
import { useCurriculumOriginal, useDeleteCurriculumCustom, curriculumKeys } from "@/hooks/use-curriculum"
import { CurriculumPagination } from '@/lib/types'
import { useQueryClient } from '@tanstack/react-query'
import TopNavigation from "./TopNavigation"
import CurriculumFilter from "./CurriculumFilter"
import SearchBar from "./SearchBar"
import CurriculumSection from "./CurriculumSection"

export default function CurriculumManagementPage() {
    // React Query hooks for data fetching
    const PAGE_SIZE = 16
    const isServerPaginated = true // Always use server pagination for custom curriculums
    const [searchQuery, setSearchQuery] = useState("")
    const { data: curriculums = [], isLoading: curriculumsLoading, error: curriculumsError } = useCurriculumOriginal()
    const deleteCurriculumMutation = useDeleteCurriculumCustom()
    // Local state for UI
    const [curriculumCarouselIndex, setCurriculumCarouselIndex] = useState(0)
    const [CCSearchQuery, setCCSearchQuery] = useState("")
    // Allow filtering custom curricula by original curriculum ids (array)
    const [selectedOriginalIds, setSelectedOriginalIds] = useState<string[] | undefined>(undefined)
    // Applied filters (only updated when user clicks "Lọc" button)
    const [appliedOriginalIds, setAppliedOriginalIds] = useState<string[] | undefined>(undefined)
    // fetch custom curricula (moved here so CCSearchQuery exists)
    // Read existing cached data only (do NOT trigger network fetch here) so child remains the only fetcher
    const queryClient = useQueryClient()
    const parentQueryKey = [...curriculumKeys.customLists(), { page: 1, limit: isServerPaginated ? PAGE_SIZE : undefined, searchQuery: CCSearchQuery ? CCSearchQuery : undefined, curriculumOriginalIds: appliedOriginalIds }]
    const curriculumCustomListData = queryClient.getQueryData(parentQueryKey) as CurriculumPagination | undefined
    console.debug('parent (cache): curriculumCustomListData items count =', Array.isArray(curriculumCustomListData?.items) ? curriculumCustomListData!.items.length : 'undefined')
    // use a fallback object for display counts, but pass the raw cached data (may be undefined) to child
    const curriculumCustomList = curriculumCustomListData ?? { items: [], total: 0, page: 1, limit: PAGE_SIZE, totalPages: 1 }
    const router = useRouter()

    // Computed values
    const isLoading = curriculumsLoading
    const error = curriculumsError?.message

    // Default selection: set once when curriculums first load. Use a ref to avoid
    // overriding user changes (e.g., unchecking "select all").
    const _initialSelectionSet = useRef(false)
    useEffect(() => {
        if (!_initialSelectionSet.current && Array.isArray(curriculums) && curriculums.length > 0) {
            const allIds = curriculums.map(c => c.id)
            setSelectedOriginalIds(allIds)
            setAppliedOriginalIds(allIds) // Also set applied filters to show all data initially
            _initialSelectionSet.current = true
        }
    }, [curriculums])

    /**
     * Định dạng chuỗi ngày tháng thành định dạng tiếng Việt
     * @param dateString - Chuỗi ngày tháng ISO
     * @returns Chuỗi ngày tháng định dạng dd/mm/yyyy hoặc "Không rõ"
     */
    function formatDate(dateString: string | Date) {
        if (!dateString) return "Không rõ"
        const date = new Date(dateString);
        const options: Intl.DateTimeFormatOptions = {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
        };
        return date.toLocaleDateString('vi-VN', options);
    }

    /**
     * Xóa một giáo trình khỏi danh sách sử dụng React Query mutation
     * @param curriculumId - ID của giáo trình cần xóa
     */
    const deleteCurriculum = async (curriculumId: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa giáo trình này?")) return

        try {
            await deleteCurriculumMutation.mutateAsync(curriculumId)
            // React Query sẽ tự động invalidate và refetch curriculums
        } catch (error) {
            console.error("Error deleting curriculum:", error)
            alert("Có lỗi khi xóa giáo trình!")
        }
    }

    /**
     * Tính tổng số units (bài học) trong tất cả levels của một giáo trình
     * @param levels - Mảng các level của giáo trình
     * @returns Tổng số units
     */
    const getTotalUnits = (list_unit?: Unit[]) => {
        if (!list_unit || !Array.isArray(list_unit)) return 0
        return list_unit.length
    }

    /**
     * Ước tính tổng số từ vựng trong giáo trình (10 từ mỗi unit)
     * @param levels - Mảng các level của giáo trình
     * @returns Số từ ước tính
     */
    const getTotalWords = (list_unit?: Unit[]) => {
        if (!list_unit || !Array.isArray(list_unit)) return 0
        const totalUnits = getTotalUnits(list_unit)
        return totalUnits * 10 // Estimate 10 words per unit
    }

    /**
     * Reset carousel index khi tìm kiếm thay đổi
     */
    useEffect(() => {
        setCurriculumCarouselIndex(0)
    }, [searchQuery])

    return (
        <div className="min-h-screen bg-gray-100">
            
            {/* Fixed Top Navbar */}
            <TopNavigation />

            {/* ✅ Loading State */}
            {isLoading && (
                <Loading
                    variant="skeleton"
                    skeletonType="quan-ly-giao-trinh"
                />
            )}

            {/* ✅ Error State - Sử dụng ErrorHandler component */}
            {error && !isLoading && (
                <ErrorHandler
                    type="GENERAL_ERROR"
                    pageType="quan-ly-giao-trinh"
                    title="Không thể tải dữ liệu quản lý giáo trình"
                    message="Đã xảy ra lỗi khi tải danh sách giáo trình và bài học. Vui lòng thử lại."
                    errorDetails={error}
                    onRetry={() => window.location.reload()}
                    onGoBack={() => router.push("/")}
                    onGoHome={() => router.push("/")}
                />
            )}

            {/* ✅ Main Content - only show when not loading and no error */}
            {!isLoading && !error && (
                <div className="pt-20 px-6 pb-6">
                    <CurriculumSection 
                        curriculums={curriculums}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        curriculumCarouselIndex={curriculumCarouselIndex}
                        setCurriculumCarouselIndex={setCurriculumCarouselIndex}
                        deleteCurriculum={deleteCurriculum}
                        formatDate={formatDate}
                        getTotalUnits={getTotalUnits}
                        getTotalWords={getTotalWords}
                        routerPush={(path: string) => router.push(path)}
                    />

                    <div className="mx-auto mt-12">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-semibold mb-2 text-black">Các Giáo trình tùy chỉnh ({
                                    curriculumCustomList.total
                                })</h2>
                                <p className="text-gray-600">Quản lý các Giáo trình tùy chỉnh được tạo từ giáo trình</p>
                            </div>

                            <SearchBar 
                                placeholder="Lọc giáo trình trong phần này..."
                                value={CCSearchQuery}
                                onChange={setCCSearchQuery}
                                className="w-80"
                            />
                        </div>

                        <CurriculumFilter 
                            curriculums={curriculums}
                            selectedOriginalIds={selectedOriginalIds}
                            setSelectedOriginalIds={setSelectedOriginalIds}
                            onApplyFilter={() => {
                                setAppliedOriginalIds(selectedOriginalIds)
                            }}
                            onClearFilter={() => {
                                setAppliedOriginalIds(undefined)
                                setSelectedOriginalIds(curriculums.map(c => c.id))
                            }}
                        />

                        <CurriculumCustomList
                            curriculumCustom={curriculumCustomListData}
                            serverPaginated={isServerPaginated}
                            searchQuery={CCSearchQuery}
                            curriculumOriginalIds={appliedOriginalIds}
                            routerPush={(path: string) => router.push(path)}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}