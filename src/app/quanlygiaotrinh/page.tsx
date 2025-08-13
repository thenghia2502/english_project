"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { BookOpen, Trash2, GraduationCap, ChevronLeft, ChevronRight, Search, Play, Pen } from "lucide-react"
import { useRouter } from "next/navigation";
import { Level, Curriculum } from "@/types"
import Loading from "@/components/ui/loading"
import ErrorHandler from "@/components/ui/error-handler"
import { useCurriculums, useDeleteCurriculum } from "@/hooks/use-curriculum"
import { useLessons, useDeleteLesson } from "@/hooks/use-lessons"

export default function QuanLyGiaoTrinh() {
    // React Query hooks for data fetching
    const { data: curriculums = [], isLoading: curriculumsLoading, error: curriculumsError } = useCurriculums()
    const { data: lessonLists = [], isLoading: lessonsLoading, error: lessonsError } = useLessons('names')
    const deleteCurriculumMutation = useDeleteCurriculum()
    const deleteLessonMutation = useDeleteLesson()

    // Local state for UI
    const [carouselIndices, setCarouselIndices] = useState<{ [key: string]: number }>({})
    const [curriculumCarouselIndex, setCurriculumCarouselIndex] = useState(0)
    const [searchQuery, setSearchQuery] = useState("")
    const [lessonSectionSearchQuery, setLessonSectionSearchQuery] = useState("")
    const [curriculumSearchQueries, setCurriculumSearchQueries] = useState<{ [key: string]: string }>({})
    const router = useRouter()

    // Computed values
    const isLoading = curriculumsLoading || lessonsLoading
    const error = curriculumsError?.message || lessonsError?.message

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
    const getTotalUnits = (levels?: Level[]) => {
        if (!levels || !Array.isArray(levels)) return 0
        return levels.reduce((total, level) => {
            const units = level.units || []
            return total + units.length
        }, 0)
    }

    /**
     * Ước tính tổng số từ vựng trong giáo trình (10 từ mỗi unit)
     * @param levels - Mảng các level của giáo trình
     * @returns Số từ ước tính
     */
    const getTotalWords = (levels?: Level[]) => {
        if (!levels || !Array.isArray(levels)) return 0
        // This would need to be implemented based on your word counting logic
        // For now, we'll estimate based on units
        const totalUnits = getTotalUnits(levels)
        return totalUnits * 10 // Estimate 10 words per unit
    }

    /**
     * Xóa một Giáo trình tùy chỉnh sử dụng React Query mutation
     * @param lessonId - ID của Giáo trình tùy chỉnh cần xóa
     */
    const deleteLessonList = async (lessonId: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa Giáo trình tùy chỉnh này?")) return

        try {
            await deleteLessonMutation.mutateAsync(lessonId)
            // React Query sẽ tự động invalidate và refetch lessons
        } catch (error) {
            console.error("Error deleting lesson:", error)
            alert("Có lỗi khi xóa Giáo trình tùy chỉnh!")
        }
    }

    /**
     * Lấy từ khóa tìm kiếm cho một curriculum cụ thể
     * @param curriculumId - ID của giáo trình
     * @returns Từ khóa tìm kiếm hoặc chuỗi rỗng
     */
    const getCurriculumSearchQuery = (curriculumId: string) => {
        return curriculumSearchQueries[curriculumId] || ""
    }

    /**
     * Cập nhật từ khóa tìm kiếm cho một curriculum cụ thể
     * @param curriculumId - ID của giáo trình
     * @param query - Từ khóa tìm kiếm mới
     */
    const setCurriculumSearchQuery = (curriculumId: string, query: string) => {
        setCurriculumSearchQueries(prev => ({
            ...prev,
            [curriculumId]: query
        }))
    }

    /**
     * Lọc Giáo trình tùy chỉnh theo curriculum ID và từ khóa tìm kiếm
     * @param curriculumId - ID của giáo trình
     * @param searchQuery - Từ khóa tìm kiếm (tùy chọn)
     * @returns Mảng các Giáo trình tùy chỉnh thuộc về giáo trình đó và phù hợp với từ khóa
     */
    const getLessonsByCurriculumAndSearch = (curriculumId: string, searchQuery?: string) => {
        let lessons = lessonLists.filter(lesson => lesson.id_curriculum === curriculumId)

        if (searchQuery && searchQuery.trim()) {
            lessons = lessons.filter(lesson =>
                lesson.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
        }

        return lessons
    }

    /**
     * Lấy tên level dựa trên curriculum ID và level ID
     * @param curriculumId - ID của giáo trình
     * @param levelId - ID của level
     * @returns Tên của level hoặc "Không rõ trình độ"
     */
    const getLevelName = (curriculumId: string, levelId: string) => {
        const curriculum = curriculums.find((c: Curriculum) => c.id === curriculumId)
        const level = curriculum?.levels?.find((l: Level) => l.id === levelId)
        return level?.name || "Không rõ trình độ"
    }

    /**
     * Lọc danh sách giáo trình theo từ khóa tìm kiếm
     * @param query - Từ khóa tìm kiếm
     * @returns Mảng các giáo trình phù hợp với từ khóa
     */
    const getFilteredCurriculums = (query: string) => {
        if (!query.trim()) return curriculums
        return curriculums.filter(curriculum =>
            curriculum.title.toLowerCase().includes(query.toLowerCase())
        )
    }

    // === CAROUSEL FUNCTIONS ===
    /**
     * Lấy index hiện tại của carousel cho một curriculum cụ thể
     * @param curriculumId - ID của giáo trình
     * @returns Index hiện tại hoặc 0 nếu chưa có
     */
    const getCarouselIndex = (curriculumId: string) => {
        return carouselIndices[curriculumId] || 0
    }

    /**
     * Cập nhật index carousel cho một curriculum cụ thể
     * @param curriculumId - ID của giáo trình
     * @param index - Index mới cần set
     */
    const setCarouselIndex = (curriculumId: string, index: number) => {
        setCarouselIndices(prev => ({
            ...prev,
            [curriculumId]: index
        }))
    }

    /**
     * Chuyển đến trang tiếp theo của carousel lesson list
     * Mỗi trang hiển thị 8 items (2 hàng x 4 cột)
     * @param curriculumId - ID của giáo trình
     * @param totalItems - Tổng số items trong danh sách
     */
    const nextSlide = (curriculumId: string, totalItems: number) => {
        const currentPage = Math.floor(getCarouselIndex(curriculumId) / 8)
        const totalPages = Math.ceil(totalItems / 8)
        const nextPage = Math.min(currentPage + 1, totalPages - 1)
        setCarouselIndex(curriculumId, nextPage * 8)
    }

    /**
     * Chuyển đến trang trước đó của carousel lesson list
     * @param curriculumId - ID của giáo trình
     */
    const prevSlide = (curriculumId: string) => {
        const currentPage = Math.floor(getCarouselIndex(curriculumId) / 8)
        const prevPage = Math.max(0, currentPage - 1)
        setCarouselIndex(curriculumId, prevPage * 8)
    }

    /**
     * Chuyển đến trang tiếp theo của carousel curriculum
     * Mỗi trang hiển thị 3 items (1 hàng x 3 cột)
     */
    const nextCurriculumSlide = () => {
        const filteredCurriculums = getFilteredCurriculums(searchQuery)
        const itemsPerPage = 3 // 1 hàng x 3 cột cho curriculum
        const maxIndex = Math.max(0, filteredCurriculums.length - itemsPerPage)
        const nextIndex = Math.min(curriculumCarouselIndex + itemsPerPage, maxIndex)
        setCurriculumCarouselIndex(nextIndex)
    }

    /**
     * Chuyển đến trang trước đó của carousel curriculum
     */
    const prevCurriculumSlide = () => {
        const itemsPerPage = 3
        const prevIndex = Math.max(0, curriculumCarouselIndex - itemsPerPage)
        setCurriculumCarouselIndex(prevIndex)
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
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-bold text-gray-900">Quản lý giáo trình</h1>
                        <Button onClick={() => router.push("/taodanhsachbaihoc")} className="bg-blue-600 hover:bg-blue-700 text-white">
                            Tạo giáo trình tùy chỉnh
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
                                <h2 className="text-2xl font-semibold mb-2">Danh sách giáo trình gốc ({getFilteredCurriculums(searchQuery).length})</h2>
                                <p className="text-gray-600">Quản lý các giáo trình và chương trình học</p>
                            </div>

                            {/* Search Bar */}
                            <div className="relative w-80">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    type="text"
                                    placeholder="Tìm kiếm giáo trình theo tên..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                            /* Curriculum Carousel */
                            <div className="relative">
                                <div className="overflow-hidden">
                                    <div
                                        className="flex transition-transform duration-300 ease-in-out"
                                        style={{
                                            transform: `translateX(-${Math.floor(curriculumCarouselIndex / 3) * 100}%)`
                                        }}
                                    >
                                        {Array.from({ length: Math.ceil(getFilteredCurriculums(searchQuery).length / 3) }).map((_, pageIndex) => (
                                            <div
                                                key={pageIndex}
                                                className="w-full flex-shrink-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                                            >
                                                {getFilteredCurriculums(searchQuery).slice(pageIndex * 3, (pageIndex + 1) * 3).map((curriculum) => (
                                                    <Card
                                                        key={curriculum.id}
                                                        className="bg-white shadow-sm border border-gray-200 hover:shadow-md hover:bg-blue-50 transition-all cursor-pointer"
                                                    >
                                                        <CardHeader className="pb-4">
                                                            <div className="flex items-start justify-between">
                                                                <CardTitle className="h-[3rem] text-lg font-semibold text-gray-900 line-clamp-2">
                                                                    {curriculum.title}
                                                                </CardTitle>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        deleteCurriculum(curriculum.id)
                                                                    }}
                                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </CardHeader>
                                                        <CardContent className="pt-0">
                                                            <div className="space-y-4">
                                                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                                                    <div className="flex items-center gap-1">
                                                                        <GraduationCap className="w-4 h-4" />
                                                                        <span>{curriculum.levels?.length || 0} trình độ</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        <BookOpen className="w-4 h-4" />
                                                                        <span>{getTotalUnits(curriculum.levels)} bài học</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        <span>~{getTotalWords(curriculum.levels)} từ</span>
                                                                    </div>
                                                                </div>

                                                                {curriculum.description && (
                                                                    <p className="text-sm text-gray-600 line-clamp-2">
                                                                        {curriculum.description}
                                                                    </p>
                                                                )}

                                                                <div className="space-y-2">
                                                                    <p className="text-sm font-medium text-gray-700">Các trình độ:</p>
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {curriculum.levels && curriculum.levels.length > 0 ? (
                                                                            <>
                                                                                {curriculum.levels.slice(0, 3).map((level) => (
                                                                                    <Badge
                                                                                        key={level.id}
                                                                                        variant="outline"
                                                                                        className="text-xs"
                                                                                        title={`${level.name} - ${level.units?.length || 0} bài học`}
                                                                                    >
                                                                                        {level.name} ({level.units?.length || 0})
                                                                                    </Badge>
                                                                                ))}
                                                                                {curriculum.levels.length > 3 && (
                                                                                    <Badge variant="outline" className="text-xs">
                                                                                        +{curriculum.levels.length - 3} trình độ nữa
                                                                                    </Badge>
                                                                                )}
                                                                            </>
                                                                        ) : (
                                                                            <Badge variant="outline" className="text-xs text-gray-400">
                                                                                Chưa có trình độ nào
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center justify-between text-sm">
                                                                    <span className="text-gray-600">Tạo lúc:</span>
                                                                    <span className="text-gray-500">{formatDate(curriculum.createdAt || new Date().toISOString())}</span>
                                                                </div>

                                                                <div className="flex items-center gap-2 pt-2">
                                                                    
                                                                    <Button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            router.push(`/taodanhsachbaihoc?curriculum=${curriculum.id}`)
                                                                        }}
                                                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                                                        size="sm"
                                                                    >
                                                                        <BookOpen className="w-4 h-4 mr-2" />
                                                                        Tạo giáo trình tùy chỉnh
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Navigation buttons */}
                                {getFilteredCurriculums(searchQuery).length > 3 && (
                                    <>
                                        {Math.floor(curriculumCarouselIndex / 3) > 0 && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white shadow-md hover:bg-gray-50"
                                                onClick={prevCurriculumSlide}
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </Button>
                                        )}

                                        {Math.floor(curriculumCarouselIndex / 3) < Math.ceil(getFilteredCurriculums(searchQuery).length / 3) - 1 && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white shadow-md hover:bg-gray-50"
                                                onClick={nextCurriculumSlide}
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </>
                                )}

                                {/* Dots indicator */}
                                {getFilteredCurriculums(searchQuery).length > 3 && (
                                    <div className="flex justify-center mt-4 gap-2">
                                        {Array.from({ length: Math.ceil(getFilteredCurriculums(searchQuery).length / 3) }).map((_, index) => (
                                            <button
                                                key={index}
                                                className={`w-2 h-2 rounded-full transition-colors ${Math.floor(curriculumCarouselIndex / 3) === index
                                                    ? 'bg-blue-600'
                                                    : 'bg-gray-300'
                                                    }`}
                                                onClick={() => setCurriculumCarouselIndex(index * 3)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Lesson Lists Section */}
                    <div className="mx-auto mt-12">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-semibold mb-2">Các Giáo trình tùy chỉnh ({
                                    curriculums.reduce((total, curriculum) => {
                                        // Lọc theo lessonSectionSearchQuery nếu có
                                        if (lessonSectionSearchQuery.trim()) {
                                            const matchesCurriculum = curriculum.title.toLowerCase().includes(lessonSectionSearchQuery.toLowerCase())
                                            if (!matchesCurriculum) return total
                                        }
                                        const effectiveSearchQuery = getCurriculumSearchQuery(curriculum.id)
                                        return total + getLessonsByCurriculumAndSearch(curriculum.id, effectiveSearchQuery).length
                                    }, 0)
                                })</h2>
                                <p className="text-gray-600">Quản lý các Giáo trình tùy chỉnh được tạo từ giáo trình</p>
                            </div>

                            {/* Global Curriculum Search Bar for Lesson Section */}
                            <div className="relative w-80">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    type="text"
                                    placeholder="Lọc giáo trình trong phần này..."
                                    value={lessonSectionSearchQuery}
                                    onChange={(e) => {
                                        setLessonSectionSearchQuery(e.target.value)
                                    }}
                                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Group lessons by curriculum - lọc theo lessonSectionSearchQuery */}
                        {curriculums.filter(curriculum => {
                            // Lọc curriculum theo lessonSectionSearchQuery nếu có
                            if (lessonSectionSearchQuery.trim()) {
                                return curriculum.title.toLowerCase().includes(lessonSectionSearchQuery.toLowerCase())
                            }
                            return true
                        }).map((curriculum) => {
                            const effectiveSearchQuery = getCurriculumSearchQuery(curriculum.id)
                            const curriculumLessons = getLessonsByCurriculumAndSearch(curriculum.id, effectiveSearchQuery)

                            // Show curriculum if it has lessons OR if there's an active search for this curriculum
                            if (curriculumLessons.length === 0 && !effectiveSearchQuery.trim()) return null

                            return (
                                <div key={curriculum.id} className="mb-8">
                                    <div className="mb-4 flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                                {curriculum.title}
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                {curriculumLessons.length} Giáo trình tùy chỉnh đã được tạo
                                                {effectiveSearchQuery.trim() && (
                                                    <span className="text-blue-600 ml-1">
                                                        (đã lọc)
                                                    </span>
                                                )}
                                            </p>
                                        </div>

                                        {/* Individual Curriculum Search Bar */}
                                        <div className="relative w-64">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                            <Input
                                                type="text"
                                                placeholder={`Tìm trong ${curriculum.title}...`}
                                                value={getCurriculumSearchQuery(curriculum.id)}
                                                onChange={(e) => setCurriculumSearchQuery(curriculum.id, e.target.value)}
                                                className="pl-10 pr-4 py-1.5 w-full text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    {/* Show empty state for individual curriculum search */}
                                    {curriculumLessons.length === 0 && effectiveSearchQuery.trim() ? (
                                        <div className="relative">
                                            <Card className="bg-white border border-gray-200 shadow-sm w-full">
                                                <CardContent className="p-8 text-center flex flex-col justify-center" style={{ minHeight: '400px' }}>
                                                    <BookOpen className="mx-auto h-8 w-8 text-gray-400 mb-3" />
                                                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                                                        Không tìm thấy bài học nào trong {curriculum.title}
                                                    </h4>
                                                    <p className="text-xs text-gray-600">
                                                        Không có bài học nào khớp với từ khóa &ldquo;{effectiveSearchQuery}&rdquo;
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            {/* Carousel Container */}
                                            <div className="overflow-hidden">
                                                <div
                                                    className="flex transition-transform duration-300 ease-in-out"
                                                    style={{
                                                        transform: curriculumLessons.length > 8
                                                            ? `translateX(-${Math.floor(getCarouselIndex(curriculum.id) / 8) * 100}%)`
                                                            : 'translateX(0%)'
                                                    }}
                                                >
                                                    {/* Create pages of 8 items (2 rows x 4 cols) or single row for < 5 items */}
                                                    {Array.from({ length: Math.ceil(curriculumLessons.length / 8) }).map((_, pageIndex) => (
                                                        <div
                                                            key={pageIndex}
                                                            className={`w-full flex-shrink-0 grid grid-cols-4 gap-4 ${curriculumLessons.length < 5
                                                                ? 'grid-rows-1'
                                                                : ''
                                                                }`}
                                                            style={curriculumLessons.length < 5
                                                                ? {}
                                                                : { gridTemplateRows: 'repeat(2, 1fr)' }
                                                            }
                                                        >
                                                            {curriculumLessons.slice(pageIndex * 8, (pageIndex + 1) * 8).map((lesson) => (
                                                                <Card
                                                                    key={lesson.id}
                                                                    className="bg-white shadow-sm border border-gray-200 hover:shadow-md hover:bg-blue-50 transition-all cursor-pointer h-full"
                                                                    onClick={() => {
                                                                        // Có thể chuyển đến trang xem chi tiết hoặc để trống
                                                                        console.log("View lesson details:", lesson.id)
                                                                    }}
                                                                >
                                                                    <CardHeader className="pb-3">
                                                                        <div className="flex items-start justify-between">
                                                                            <CardTitle className="h-[3rem] text-base font-semibold text-gray-900">
                                                                                {lesson.name}
                                                                            </CardTitle>
                                                                            <div className="flex items-center gap-1">
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation()
                                                                                        deleteLessonList(lesson.id)
                                                                                    }}
                                                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1"
                                                                                    title="Xóa Giáo trình tùy chỉnh"
                                                                                >
                                                                                    <Trash2 className="w-3 h-3" />
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    </CardHeader>
                                                                    <CardContent className="pt-0">
                                                                        <div className="space-y-3">
                                                                            {/* Level Info */}
                                                                            <div className="flex items-center gap-2">
                                                                                <Badge variant="outline" className="text-xs">
                                                                                    {getLevelName(lesson.id_curriculum, lesson.id_level)}
                                                                                </Badge>
                                                                            </div>

                                                                            {/* Exercise Count */}
                                                                            <div className="flex items-center gap-1 text-sm text-gray-600">
                                                                                <BookOpen className="w-4 h-4" />
                                                                                <span>{lesson.list_exercise.length} bài tập</span>
                                                                            </div>

                                                                            {/* Exercise Preview */}
                                                                            <div className="flex space-x-1 h-[3rem] ">
                                                                                <p className="text-xs font-medium text-gray-700">Các bài tập:</p>
                                                                                <div className="text-xs text-gray-600">
                                                                                    {lesson.list_exercise.slice(0, 2).map((exercise, index) => (
                                                                                        <div key={index} className="truncate">• {exercise}</div>
                                                                                    ))}
                                                                                    {lesson.list_exercise.length > 2 && (
                                                                                        <div className="text-gray-400">
                                                                                            +{lesson.list_exercise.length - 2} bài tập khác
                                                                                        </div>
                                                                                    )}
                                                                                </div>

                                                                            </div>
                                                                            <div className="flex justify-between items-center gap-2 mt-4">
                                                                                <Button

                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation()
                                                                                        router.push(`/taobaihoc?id=${lesson.id}`)
                                                                                    }}
                                                                                    className="flex-1 text-white bg-green-600 hover:bg-green-700 p-1"
                                                                                    title="Tạo bài học mới"
                                                                                >
                                                                                    <Play className="w-3 h-3" />
                                                                                    Tạo bài học
                                                                                </Button>
                                                                                <Button

                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation()

                                                                                        // Lưu dữ liệu edit vào sessionStorage
                                                                                        const editData = {
                                                                                            id: lesson.id,
                                                                                            curriculum: lesson.id_curriculum,
                                                                                            level: lesson.id_level,
                                                                                            name: lesson.name,
                                                                                            exercises: lesson.list_exercise // Đây là names từ API format=names
                                                                                        }
                                                                                        console.log('Saving edit data to sessionStorage:', editData)
                                                                                        sessionStorage.setItem('editLessonData', JSON.stringify(editData))

                                                                                        // Verify data was saved
                                                                                        const savedData = sessionStorage.getItem('editLessonData')
                                                                                        console.log('Verified saved data:', savedData)

                                                                                        // Chuyển đến trang edit với URL đơn giản
                                                                                        router.push(`/taodanhsachbaihoc?mode=edit`)
                                                                                    }}
                                                                                    className="flex-1 text-white bg-blue-600 hover:bg-blue-700 p-1"
                                                                                    title="Chỉnh sửa Giáo trình tùy chỉnh"
                                                                                >
                                                                                    <Pen className="w-3 h-3" />
                                                                                    Chỉnh sửa
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    </CardContent>
                                                                </Card>
                                                            ))}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Navigation Buttons */}
                                            {curriculumLessons.length > 8 && (
                                                <>
                                                    {/* Previous Button - Ẩn ở trang đầu */}
                                                    {Math.floor(getCarouselIndex(curriculum.id) / 8) > 0 && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white shadow-md hover:bg-gray-50"
                                                            onClick={() => prevSlide(curriculum.id)}
                                                        >
                                                            <ChevronLeft className="w-4 h-4" />
                                                        </Button>
                                                    )}

                                                    {/* Next Button - Ẩn ở trang cuối */}
                                                    {Math.floor(getCarouselIndex(curriculum.id) / 8) < Math.ceil(curriculumLessons.length / 8) - 1 && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white shadow-md hover:bg-gray-50"
                                                            onClick={() => nextSlide(curriculum.id, curriculumLessons.length)}
                                                        >
                                                            <ChevronRight className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </>
                                            )}

                                            {/* Dots Indicator */}
                                            {curriculumLessons.length > 8 && (
                                                <div className="flex justify-center mt-4 gap-2">
                                                    {Array.from({ length: Math.ceil(curriculumLessons.length / 8) }).map((_, index) => (
                                                        <button
                                                            key={index}
                                                            className={`w-2 h-2 rounded-full transition-colors ${Math.floor(getCarouselIndex(curriculum.id) / 8) === index
                                                                ? 'bg-blue-600'
                                                                : 'bg-gray-300'
                                                                }`}
                                                            onClick={() => setCarouselIndex(curriculum.id, index * 8)}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}

                        {/* Empty State for Lesson Lists */}
                        {(() => {
                            // Lọc curriculums theo lessonSectionSearchQuery
                            const filteredCurriculumsForLessons = curriculums.filter(curriculum => {
                                if (lessonSectionSearchQuery.trim()) {
                                    return curriculum.title.toLowerCase().includes(lessonSectionSearchQuery.toLowerCase())
                                }
                                return true
                            })

                            const hasAnyLessons = filteredCurriculumsForLessons.some(curriculum => {
                                const effectiveSearchQuery = getCurriculumSearchQuery(curriculum.id)
                                return getLessonsByCurriculumAndSearch(curriculum.id, effectiveSearchQuery).length > 0
                            })

                            if (lessonLists.length === 0) {
                                return (
                                    <Card className="bg-white border border-gray-200 shadow-sm">
                                        <CardContent className="p-12 text-center flex flex-col justify-center" style={{ minHeight: '400px' }}>
                                            <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                                Chưa có Giáo trình tùy chỉnh nào
                                            </h3>
                                            <p className="text-gray-600 mb-6">
                                                Tạo Giáo trình tùy chỉnh từ các giáo trình ở trên
                                            </p>
                                            <Button
                                                onClick={() => router.push("/taodanhsachtu")}
                                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                            >
                                                Tạo Giáo trình tùy chỉnh mới
                                            </Button>
                                        </CardContent>
                                    </Card>
                                )
                            }

                            // Chỉ hiển thị thông báo empty state khi tìm kiếm giáo trình (lessonSectionSearchQuery)
                            // Không hiển thị khi chỉ tìm kiếm bài học trong curriculum riêng lẻ
                            if (!hasAnyLessons && lessonSectionSearchQuery.trim()) {
                                return (
                                    <Card className="bg-white border border-gray-200 shadow-sm">
                                        <CardContent className="p-12 text-center flex flex-col justify-center" style={{ minHeight: '400px' }}>
                                            <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                                Không tìm thấy giáo trình nào
                                            </h3>
                                            <p className="text-gray-600 mb-6">
                                                Không có giáo trình nào khớp với từ khóa &ldquo;{lessonSectionSearchQuery}&rdquo;
                                            </p>
                                        </CardContent>
                                    </Card>
                                )
                            }

                            return null
                        })()}
                    </div>
                </div>
            )}
        </div>
    )
}
