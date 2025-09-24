"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card"
// Badge is used inside child components
import { Input } from "@/components/ui/input"
import { BookOpen, Search } from "lucide-react"
import CurriculumCarousel from '@/components/quanlygiaotrinh/CurriculumCarousel'
import CurriculumCustomList from '@/components/quanlygiaotrinh/CurriculumCustomList'
import { useRouter } from "next/navigation";
import { Unit } from "@/lib/types"
import Loading from "@/components/ui/loading"
import ErrorHandler from "@/components/ui/error-handler"
import { useCurriculumOriginal, useDeleteCurriculumCustom, curriculumKeys } from "@/hooks/use-curriculum"
import { CurriculumPagination } from '@/lib/types'
import { useQueryClient } from '@tanstack/react-query'
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export default function QuanLyGiaoTrinh() {
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
     * Xóa một Giáo trình tùy chỉnh sử dụng React Query mutation
     * @param lessonId - ID của Giáo trình tùy chỉnh cần xóa
     */
    // Note: lesson-specific operations removed — curriculum-level delete handled via deleteCurriculum

    /**
     * Lấy từ khóa tìm kiếm cho một curriculum cụ thể
     * @param curriculumId - ID của giáo trình
     * @returns Từ khóa tìm kiếm hoặc chuỗi rỗng
     */
    // Per-curriculum search state removed — handled inside child if needed

    /**
     * Lọc Giáo trình tùy chỉnh theo curriculum ID và từ khóa tìm kiếm
     * @param curriculumId - ID của giáo trình
     * @param searchQuery - Từ khóa tìm kiếm (tùy chọn)
     * @returns Mảng các Giáo trình tùy chỉnh thuộc về giáo trình đó và phù hợp với từ khóa
     */
    // lessons list retrieval removed — page no longer manages lesson lists

    /**
     * Lấy tên level dựa trên curriculum ID và level ID
     * @param curriculumId - ID của giáo trình
     * @param levelId - ID của level
     * @returns Tên của level hoặc "Không rõ trình độ"
     */
    // Level name lookup moved to child components if needed

    /**
     * Lọc danh sách giáo trình theo từ khóa tìm kiếm
     * @param query - Từ khóa tìm kiếm
     * @returns Mảng các giáo trình phù hợp với từ khóa
     */
    const getFilteredCurriculums = (query: string) => {
        if (!query.trim()) return curriculums
        return curriculums.filter(curriculum =>
            curriculum.name.toLowerCase().includes(query.toLowerCase())
        )
    }

    // === CAROUSEL FUNCTIONS ===
    /**
     * Lấy index hiện tại của carousel cho một curriculum cụ thể
     * @param curriculumId - ID của giáo trình
     * @returns Index hiện tại hoặc 0 nếu chưa có
     */
    // Per-curriculum carousel state removed; child components manage their internal indexes

    /**
     * Chuyển đến trang tiếp theo của carousel lesson list
     * Mỗi trang hiển thị 8 items (2 hàng x 4 cột)
     * @param curriculumId - ID của giáo trình
     * @param totalItems - Tổng số items trong danh sách
     */
    // Lesson-carousel helpers removed; carousel control handled in child components

    /**
     * Chuyển đến trang tiếp theo của carousel curriculum
     * Mỗi trang hiển thị 3 items (1 hàng x 3 cột)
     */
    // Curriculum carousel paging is handled by the CurriculumCarousel component

    /**
     * Reset carousel index khi tìm kiếm thay đổi
     */
    useEffect(() => {
        setCurriculumCarouselIndex(0)
    }, [searchQuery])

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Fixed Top Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-bold text-black">Quản lý giáo trình</h1>
                        <Button onClick={() => router.push("/quanlybaihoc")} className="bg-blue-600 hover:bg-blue-700 text-white">
                            Quản lý bài học
                        </Button>
                    </div>
                </div>
            </nav>

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
                    <div className="mx-auto">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-semibold mb-2 text-black">Danh sách giáo trình gốc ({getFilteredCurriculums(searchQuery).length})</h2>
                                <p className="text-black">Quản lý các giáo trình và chương trình học</p>
                            </div>

                            {/* Search Bar */}
                            <div className="relative w-80">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-700 w-4 h-4" />
                                <Input
                                    type="text"
                                    placeholder="Tìm kiếm giáo trình theo tên..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="text-black pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* ✅ Empty State for Curriculums - Sử dụng ErrorHandler */}
                        {getFilteredCurriculums(searchQuery).length === 0 ? (
                            /*<ErrorHandler
                                type="NO_DATA_FOUND"
                                pageType="quan-ly-giao-trinh"
                                title={searchQuery.trim() ? "Không tìm thấy giáo trình nào" : "Chưa có giáo trình nào"}
                                message={searchQuery.trim()
                                    ? `Không có giáo trình nào khớp với từ khóa "${searchQuery}"`
                                    : "Bắt đầu bằng cách tạo giáo trình đầu tiên của bạn"
                                }
                                onRetry={() => window.location.reload()}
                                onGoBack={() => router.push("/")}
                                onGoHome={() => router.push("/")}
                            />*/
                            <div className="relative">
                                <Card className="box-border bg-white border border-gray-200 shadow-sm w-full flex " style={{ minHeight: '332px' }}>
                                    <CardContent className="p-0 text-center flex flex-col justify-center flex-1" >
                                        <BookOpen className="mx-auto h-8 w-8 text-gray-400 mb-3" />
                                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                                            Không tìm thấy giáo trình nào
                                        </h4>
                                        <p className="text-xs text-gray-600">
                                            Không có giáo trình nào khớp với từ khóa &ldquo;{searchQuery}&rdquo;
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
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
                                routerPush={(path: string) => router.push(path)}
                            />
                        )}
                    </div>

                    {/* Lesson Lists Section */}
                    <div className="mx-auto mt-12">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-semibold mb-2 text-black">Các Giáo trình tùy chỉnh ({
                                    curriculumCustomList.total
                                })</h2>
                                <p className="text-gray-600">Quản lý các Giáo trình tùy chỉnh được tạo từ giáo trình</p>
                            </div>

                            {/* Global Curriculum Search Bar for Lesson Section */}
                            <div className="relative w-80">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    type="text"
                                    placeholder="Lọc giáo trình trong phần này..."
                                    value={CCSearchQuery}
                                    onChange={(e) => {
                                        setCCSearchQuery(e.target.value)
                                    }}
                                    className="text-black pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                
                            </div>


                        </div>
                        <div className="bg-white p-6 rounded-xl mb-6 border border-gray-200 shadow-sm text-gray-900">
                            <div className="flex items-center justify-between mb-4">
                                <Label htmlFor="select-all" className="flex items-center space-x-2">
                                        <Checkbox id="select-all" checked={Array.isArray(selectedOriginalIds) && selectedOriginalIds.length === curriculums.length} 
                                        onCheckedChange={(checked) => {
                                            const isChecked = checked === true
                                            setSelectedOriginalIds(isChecked ? curriculums.map(c => c.id) : undefined)
                                        }} />
                                        <span className="text-sm font-medium">Chọn tất cả ({curriculums.length})</span>
                                    </Label>
                                    <div className="text-sm text-gray-600">{curriculums.length} mục</div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {curriculums.length === 0 ? (
                                    <div className="col-span-full text-sm text-gray-500">Không có giáo trình</div>
                                ) : curriculums.map(co => (
                                    <div key={co.id} className="p-3 border border-gray-300 rounded-md hover:shadow-sm bg-white">
                                        <Label htmlFor={`select-${co.id}`} className="flex items-center space-x-3">
                                            <Checkbox id={`select-${co.id}`} checked={Array.isArray(selectedOriginalIds) ? selectedOriginalIds.includes(co.id) : false} onCheckedChange={(checked) => {
                                                const isChecked = checked === true
                                                setSelectedOriginalIds(prev => {
                                                    const prevArr = Array.isArray(prev) ? prev : []
                                                    if (isChecked) {
                                                        return Array.from(new Set([...prevArr, co.id]))
                                                    }
                                                    return prevArr.filter(x => x !== co.id)
                                                })
                                            }} />
                                            <div>
                                                <div className="text-sm font-semibold text-gray-900">{co.name}</div>
                                                {co.description && <div className="text-xs text-gray-500 mt-1 line-clamp-2">{co.description}</div>}
                                            </div>
                                        </Label>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white w-[7.5rem]" onClick={() => {
                                    setAppliedOriginalIds(selectedOriginalIds)
                                }}>Lọc</Button>
                                <Button variant="outline" className="mt-4 w-[7.5rem]" onClick={() => {
                                    setAppliedOriginalIds(undefined)
                                    setSelectedOriginalIds(curriculums.map(c => c.id))
                                }}>Xóa bộ lọc</Button>
                            </div>
                        </div>
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