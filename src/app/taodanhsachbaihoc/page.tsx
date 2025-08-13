"use client"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { FormValues, Unit } from "@/lib/types"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState, useRef, startTransition } from "react"
import { useForm } from "react-hook-form"
import Loading from "@/components/ui/loading"
import ErrorHandler from "@/components/ui/error-handler"
import { useCurriculums, useCurriculum, useCreateLesson, useUpdateLesson } from "@/hooks"
import { useUIStore } from "@/stores"

export default function TaoDanhSachTu() {
    // Local state - khởi tạo trước
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isEditMode, setIsEditMode] = useState(false)
    const [editDataLoaded, setEditDataLoaded] = useState(false) // 🔧 Track edit data loading
    const [editingLessonId, setEditingLessonId] = useState<string | null>(null)
    const [baiList, setBaiList] = useState<Unit[]>([])
    const originalSelectedRef = useRef<string[]>([]) // 🔧 Ref to avoid re-renders
    const isInitialized = useRef(false)
    const isConverting = useRef(false) // 🔧 Prevent re-conversion during state updates
    
    // Pagination state for lesson list
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 24 // 4 columns x 6 rows
    
    const router = useRouter()
    const searchParams = useSearchParams()
    const form = useForm<FormValues>({
        defaultValues: {
            name: "",
            curriculum: "",
            level: "",
            selectedBai: [],
        }
    })
    
    // 🔧 Watch curriculum changes để tránh re-render liên tục
    const watchedCurriculum = form.watch('curriculum')
    
    // React Query hooks
    const { data: curriculums = [], isLoading: curriculumsLoading, error: curriculumsError } = useCurriculums()
    const { data: curriculum, isLoading: curriculumLoading } = useCurriculum(watchedCurriculum)
    
    const createLessonMutation = useCreateLesson()
    const updateLessonMutation = useUpdateLesson()
    
    // Zustand stores
    const { setError } = useUIStore()
    
    // Computed values
    const isLoading = curriculumsLoading || curriculumLoading
    const error = curriculumsError?.message
    
    // Pagination calculations
    const totalItems = baiList.length
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentItems = baiList.slice(startIndex, endIndex)
    
    // Reset pagination when baiList changes
    useEffect(() => {
        setCurrentPage(1)
    }, [baiList.length])
    
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            isConverting.current = false
        }
    }, [])
    
    // Handle edit mode from URL params - simplified version using React Query
    useEffect(() => {
        const modeFromUrl = searchParams.get('mode')
        
        if (modeFromUrl === 'edit') {
            setIsEditMode(true)
            
            // Check sessionStorage for edit data
            const storedData = sessionStorage.getItem('editLessonData')
            if (storedData) {
                try {
                    const editData = JSON.parse(storedData)
                    
                    // 🔧 Lấy ID từ sessionStorage thay vì URL
                    setEditingLessonId(editData.id || null)
                    
                    // 🔧 exercises từ sessionStorage là array của names, cần lưu để convert sau
                    const editValues = {
                        name: editData.name || '',
                        curriculum: editData.curriculum || '',
                        level: editData.level || '',
                        selectedBai: editData.exercises || [] // Tạm thời lưu names, sẽ convert thành IDs sau
                    }
                    
                    // 🔧 Store initial selected items for edit mode comparison
                    originalSelectedRef.current = editData.exercises || [] // 🔧 Store in ref
                    
                    // 🔧 Use form.reset only, avoid setFormValues to prevent loop
                    form.reset(editValues, { keepDirty: false, keepTouched: false })
                    
                    // 🔧 Use setTimeout to ensure state is fully updated before setting flag
                    setTimeout(() => {
                        setEditDataLoaded(true) // Mark edit data as loaded after state update
                    }, 0)
                    
                    // sessionStorage.removeItem('editLessonData')
                } catch {
                    setError("Có lỗi khi tải dữ liệu chỉnh sửa")
                }
            }
        } else {
            setEditDataLoaded(false) // 🔧 Reset flag for create mode
            originalSelectedRef.current = [] // 🔧 Reset ref
            isConverting.current = false // 🔧 Reset conversion flag
        }
    }, [searchParams, form, setError]) // 🔧 Removed formValues to prevent infinite loop

    // Auto-set default curriculum when curriculums are loaded (for create mode only)
    useEffect(() => {
        if (curriculums.length === 0 || isEditMode || isInitialized.current) return
        
        // Set default curriculum for create mode
        form.setValue('curriculum', curriculums[0].id, { shouldDirty: false, shouldTouch: false })
        isInitialized.current = true
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [curriculums, isEditMode]) // 🔧 Removed form dependency to prevent infinite loop

    // Auto-set level when curriculum details are loaded
    useEffect(() => {
        if (!curriculum?.levels) return
        
        // 🔧 Trong edit mode, chỉ chạy sau khi edit data đã loaded
        if (isEditMode && !editDataLoaded) {
            return
        }
        
        const currentLevel = form.getValues('level') // 🔧 Get from form instead of state
        
        if (isEditMode) {
            // ✅ Edit mode: Verify that the level from edit data exists in curriculum
            if (currentLevel && curriculum.levels.length > 0) {
                const levelExists = curriculum.levels.find(l => l.id === currentLevel)
                if (!levelExists) {
                    const firstLevelId = curriculum.levels[0].id
                    form.setValue('level', firstLevelId, { shouldDirty: false, shouldTouch: false })
                }
            } else if (!currentLevel && curriculum.levels.length > 0) {
                // Fallback: nếu edit data không có level, set default
                const firstLevelId = curriculum.levels[0].id
                form.setValue('level', firstLevelId, { shouldDirty: false, shouldTouch: false })
            }
        } else {
            // Create mode - set level đầu tiên nếu chưa có level nào
            if (!currentLevel && curriculum.levels.length > 0) {
                const firstLevelId = curriculum.levels[0].id
                form.setValue('level', firstLevelId, { shouldDirty: false, shouldTouch: false })
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps  
    }, [curriculum, isEditMode, editDataLoaded]) // 🔧 Removed form dependency to prevent infinite loop

    // Update baiList when curriculum data and level change
    useEffect(() => {
        const currentFormValues = form.getValues() // 🔧 Get current form values inside effect
        
        if (curriculum?.levels && currentFormValues.level) {
            // 🔧 Trong edit mode, chỉ chạy sau khi edit data đã loaded
            if (isEditMode && !editDataLoaded) {
                return
            }
            
            const selectedLevel = curriculum.levels.find(l => l.id === currentFormValues.level)
            const newBaiList = selectedLevel?.units || []
            setBaiList(newBaiList)
        } else {
            setBaiList([])
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [curriculum, isEditMode, editDataLoaded]) // 🔧 Removed form dependency to prevent infinite loop

    // Separate effect for handling edit mode conversion - runs only once when ready
    useEffect(() => {
        if (isEditMode && editDataLoaded && baiList.length > 0 && !isConverting.current) {
            const currentSelectedBai = form.getValues('selectedBai') || []
            
            if (currentSelectedBai.length > 0) {
                // Check if any item needs conversion from name to ID
                const needsConversion = currentSelectedBai.some((item: string) => {
                    return baiList.find(unit => unit.name === item) !== undefined
                })
                
                if (needsConversion) {
                    isConverting.current = true
                    
                    const convertedIds = currentSelectedBai.map((nameOrId: string) => {
                        const unitByName = baiList.find(unit => unit.name === nameOrId)
                        return unitByName ? unitByName.id : nameOrId
                    })
                    
                    // Update form and state
                    form.setValue('selectedBai', convertedIds, { shouldDirty: false, shouldTouch: false })
                    originalSelectedRef.current = convertedIds // 🔧 Update ref
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditMode, editDataLoaded, baiList.length, form]) // Only dependencies that matter for this conversion

    const onSubmit = useCallback(async (data: FormValues) => {
        try {
            setIsSubmitting(true)
            
            // Validation
            if (!data.name.trim()) {
                alert("Vui lòng nhập tên giáo trình tùy")
                return
            }
            
            if (!data.curriculum || !data.level) {
                alert("Vui lòng chọn giáo trình gốc và trình độ")
                return
            }
            
            if (data.selectedBai.length === 0) {
                alert("Vui lòng chọn ít nhất một bài học")
                return
            }
            
            if (isEditMode && editingLessonId) {
                // Chế độ sửa - Sử dụng React Query mutation
                const exerciseNames = data.selectedBai.map(unitId => {
                    const unit = baiList.find(u => u.id === unitId)
                    return unit ? unit.name : unitId
                })
                
                const updateData = {
                    id: editingLessonId,
                    name: data.name.trim(),
                    id_curriculum: data.curriculum,
                    id_level: data.level,
                    list_exercise: exerciseNames,
                }
                
                await updateLessonMutation.mutateAsync(updateData)
                alert("Cập nhật danh sách từ thành công!")
            } else {
                // Chế độ tạo mới - Sử dụng React Query mutation
                const exerciseNames = data.selectedBai.map(unitId => {
                    const unit = baiList.find(u => u.id === unitId)
                    return unit ? unit.name : unitId
                })
                
                const newData = {
                    id: crypto.randomUUID(),
                    name: data.name.trim(),
                    id_curriculum: data.curriculum,
                    id_level: data.level,
                    list_exercise: exerciseNames,
                }
                
                await createLessonMutation.mutateAsync(newData)
                alert("Tạo danh sách từ thành công!")
            }
            
            // ✅ Chuyển hướng đến trang quản lý giáo trình sau khi tạo/cập nhật thành công
            router.push("/quanlygiaotrinh")
            
        } catch (error) {
            console.error("Error:", error)
            const errorMessage = isEditMode ? "Có lỗi xảy ra khi cập nhật danh sách từ. Vui lòng thử lại!" : "Có lỗi xảy ra khi tạo danh sách từ. Vui lòng thử lại!"
            alert(errorMessage)
        } finally {
            setIsSubmitting(false)
        }
    }, [router, isEditMode, editingLessonId, baiList, createLessonMutation, updateLessonMutation])

    return (
        <div className="min-h-screen bg-gray-100 overflow-x-hidden">
            {/* Fixed Top Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-bold text-gray-900">
                            {isEditMode ? "Sửa giáo trình tùy chỉnh" : "Tạo giáo trình tùy chỉnh"}
                        </h1>
                        <Button className="bg-blue-500 text-white cursor-pointer" onClick={() => router.push("/quanlykhoahoc")} variant="outline">
                            Quản lý bài học
                        </Button>
                    </div>
                </div>
            </nav>
            
            {/* ✅ Loading State - Sử dụng skeleton */}
            {isLoading && (
                <Loading
                    variant="skeleton"
                    skeletonType="tao-danh-sach-bai-hoc"
                />
            )}

            {/* ✅ Error State - Sử dụng ErrorHandler */}
            {error && !isLoading && (
                <ErrorHandler
                    type="GENERAL_ERROR"
                    pageType="tao-danh-sach-bai-hoc"
                    title="Không thể tải dữ liệu tạo danh sách bài học"
                    message="Đã xảy ra lỗi khi tải dữ liệu giáo trình. Vui lòng thử lại."
                    errorDetails={error}
                    onRetry={() => window.location.reload()}
                    onGoBack={() => router.push("/quanlygiaotrinh")}
                    onGoHome={() => router.push("/")}
                />
            )}

            {/* Main Content - only show when not loading and no error */}
            {!isLoading && !error && (
            <main className="pt-16 pb-6 h-screen flex justify-center items-start bg-gray-100 px-4">
                <div className="bg-white rounded-lg shadow-md w-full py-3 px-6 mt-6 mb-3  flex flex-col">
                    {/* Header with title and edit mode warning */}
                    <div className="mb-3">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            {isEditMode ? 'Chỉnh sửa danh sách bài học' : 'Tạo danh sách bài học mới'}
                        </h1>
                        {isEditMode && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <p className="text-amber-800 text-sm">
                                    ⚠️ <strong>Chế độ chỉnh sửa:</strong> Bạn chỉ có thể thêm bài học mới và không thể thay đổi tên, giáo trình, trình độ hoặc bỏ bài học đã chọn.
                                </p>
                            </div>
                        )}
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 flex flex-col h-full">
                            <div className="flex-none space-y-3">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-base font-medium">
                                                Tên giáo trình tùy:
                                                {isEditMode && <span className="text-gray-500 ml-2">(không thể sửa)</span>}
                                            </FormLabel>
                                            <FormControl>
                                                <Input 
                                                    {...field} 
                                                    placeholder="Nhập tên giáo trình tùy..."
                                                    className="w-full"
                                                    disabled={isEditMode} // 🔧 Disable trong edit mode
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="flex gap-4">
                                    {/* Chọn giáo trình */}
                                    <FormField
                                        control={form.control}
                                        name="curriculum"
                                        render={({ field }) => {
                                            const selectedCurriculum = curriculums.find(c => c.id === field.value)
                                            return (
                                                <FormItem className="flex-1">
                                                    <FormLabel className="text-base font-medium">
                                                        Giáo trình gốc:
                                                        {isEditMode && <span className="text-gray-500 ml-2">(không thể sửa)</span>}
                                                    </FormLabel>
                                                    <FormControl>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button 
                                                                    variant="outline" 
                                                                    className="w-full justify-between"
                                                                    disabled={isEditMode} // 🔧 Disable trong edit mode
                                                                >
                                                                    {selectedCurriculum?.title || "Chọn giáo trình gốc"}
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            {!isEditMode && ( // 🔧 Chỉ show content khi không phải edit mode
                                                                <DropdownMenuContent align="start" className="w-full bg-white">
                                                                    {curriculums.map((cur) => (
                                                                        <DropdownMenuItem
                                                                            key={cur.id}
                                                                            onSelect={() => {
                                                                                field.onChange(cur.id)

                                                                                // ✅ Reset baiList và form khi đổi curriculum
                                                                                setBaiList([])
                                                                                form.setValue('level', '', { shouldDirty: false, shouldTouch: false })
                                                                                form.setValue('selectedBai', [], { shouldDirty: false, shouldTouch: false })
                                                                            }}
                                                                        >
                                                                            {cur.title}
                                                                        </DropdownMenuItem>
                                                                    ))}
                                                                </DropdownMenuContent>
                                                            )}
                                                        </DropdownMenu>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )
                                        }}
                                    />

                                    {/* Chọn level */}
                                    <FormField
                                        control={form.control}
                                        name="level"
                                        render={({ field }) => {
                                            const selectedLevel = curriculum?.levels?.find(l => l.id === field.value)
                                            return (
                                                <FormItem className="flex-1">
                                                    <FormLabel className="text-base font-medium">
                                                        Trình độ
                                                        {isEditMode && <span className="text-gray-500 ml-2">(không thể sửa)</span>}
                                                    </FormLabel>
                                                    <FormControl>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button 
                                                                    variant="outline" 
                                                                    className="w-full justify-between"
                                                                    disabled={isEditMode} // 🔧 Disable trong edit mode
                                                                >
                                                                    {selectedLevel?.name || "Chọn trình độ"}
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            {!isEditMode && ( // 🔧 Chỉ show content khi không phải edit mode
                                                                <DropdownMenuContent align="start" className="w-full bg-white">
                                                                    {curriculum?.levels?.map((level) => (
                                                                        <DropdownMenuItem
                                                                            key={level.id}
                                                                            onSelect={() => {
                                                                                field.onChange(level.id)

                                                                                // ✅ Cập nhật baiList khi chọn level mới
                                                                                const selectedLevel = curriculum?.levels?.find(l => l.id === level.id)
                                                                                const newBaiList = selectedLevel?.units || []
                                                                                setBaiList(newBaiList)

                                                                                // ✅ Reset selectedBai khi đổi level
                                                                                form.setValue('selectedBai', [], { shouldDirty: false, shouldTouch: false })
                                                                            }}
                                                                        >
                                                                            {level.name}
                                                                        </DropdownMenuItem>
                                                                    ))}
                                                                </DropdownMenuContent>
                                                            )}
                                                        </DropdownMenu>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Danh sách bài học dạng lưới - Flex grow để chiếm không gian còn lại */}
                            <div className="flex-1 border rounded-md p-4 min-h-0 flex flex-col">
                                <div className="flex-none mb-4">
                                    <p className="text-base font-medium">Chọn bài học ({baiList.length} bài)</p>
                                    {isEditMode && (
                                        <p className="text-sm text-blue-600 mt-1">
                                            📝 Chế độ chỉnh sửa: Chỉ có thể thêm bài học mới, không thể bỏ bài học đã chọn
                                        </p>
                                    )}
                                </div>
                                {baiList.length === 0 ? (
                                    <div className="flex-1 flex items-center justify-center text-gray-500">
                                        <p>Vui lòng chọn giáo trình gốc và trình độ để xem danh sách bài học</p>
                                    </div>
                                ) : (
                                    <div className="flex-1 min-h-0 flex flex-col">
                                        {/* Lesson grid - fixed height without scroll */}
                                        <div className="grid grid-cols-4 grid-rows-6 gap-3 h-[24rem]">
                                            {currentItems.map((bai) => (
                                                <FormField
                                                    key={bai.id}
                                                    control={form.control}
                                                    name="selectedBai"
                                                    render={({ field }) => {
                                                        const value: string[] = Array.isArray(field.value) ? field.value : []
                                                        
                                                        // 🔧 Fix: So sánh cả ID và name để handle trường hợp edit mode
                                                        const isChecked = value.includes(bai.id)
                                                        // 🔧 Use ref to avoid re-render issues
                                                        const isOriginallySelected = isEditMode && (
                                                            originalSelectedRef.current.includes(bai.id) || 
                                                            originalSelectedRef.current.includes(bai.name)
                                                        )

                                                        const handleChange = (checked: boolean) => {
                                                            // 🔧 Trong edit mode, không cho bỏ tích các bài đã chọn ban đầu
                                                            if (isEditMode && !checked && isOriginallySelected) {
                                                                return
                                                            }
                                                            
                                                            // 🔧 Prevent unnecessary updates if value is the same
                                                            const currentlyChecked = value.includes(bai.id)
                                                            if (checked === currentlyChecked) {
                                                                return
                                                            }
                                                            
                                                            // 🔧 Use startTransition to mark as non-urgent update
                                                            startTransition(() => {
                                                                const newValue = checked 
                                                                    ? [...value, bai.id]
                                                                    : value.filter((v) => v !== bai.id)
                                                                
                                                                field.onChange(newValue)
                                                            })
                                                        }

                                                        // Handle click on the entire FormItem
                                                        const handleItemClick = (e: React.MouseEvent) => {
                                                            // 🔧 Don't handle if click came from checkbox
                                                            if ((e.target as HTMLElement).closest('input[type="checkbox"]')) {
                                                                return
                                                            }
                                                            
                                                            if (isEditMode && isOriginallySelected && isChecked) {
                                                                return
                                                            }
                                                            
                                                            e.preventDefault()
                                                            e.stopPropagation()
                                                            handleChange(!isChecked)
                                                        }

                                                        return (
                                                            <FormItem 
                                                                className={`flex items-center rounded-md p-3 transition-colors border border-gray-200 ${
                                                                    isEditMode && isOriginallySelected 
                                                                        ? 'bg-blue-100 border-blue-300 cursor-default' // 🔧 Style khác cho bài đã chọn ban đầu trong edit mode
                                                                        : 'hover:bg-blue-50 cursor-pointer'
                                                                }`}
                                                                onClick={handleItemClick} // 🔧 Add click handler for entire item
                                                            >
                                                                <FormControl>
                                                                    <Checkbox
                                                                        checked={isChecked}
                                                                        onCheckedChange={(checked) => {
                                                                            // 🔧 Only handle if explicitly boolean
                                                                            if (typeof checked === 'boolean') {
                                                                                handleChange(checked)
                                                                            }
                                                                        }}
                                                                        className="mb-0 mr-0"
                                                                        disabled={isEditMode && isOriginallySelected}
                                                                    />
                                                                </FormControl>
                                                                <FormLabel 
                                                                    className={`flex-1 ml-3 mb-0 text-sm font-medium ${
                                                                        isEditMode && isOriginallySelected 
                                                                            ? 'cursor-default text-blue-700' 
                                                                            : 'cursor-pointer'
                                                                    }`}
                                                                >
                                                                    {bai.name}
                                                                    {isEditMode && isOriginallySelected && (
                                                                        <span className="text-xs text-blue-600 ml-2">(đã chọn trước đó)</span>
                                                                    )}
                                                                </FormLabel>
                                                            </FormItem>
                                                        )
                                                    }}
                                                />
                                            ))}
                                        </div>
                                        
                                        {/* Pagination Controls */}
                                        {totalPages > 1 && (
                                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
                                                <div className="text-sm text-gray-500">
                                                    Hiển thị {startIndex + 1}-{Math.min(endIndex, totalItems)} của {totalItems} bài học
                                                </div>
                                                
                                                <div className="flex items-center space-x-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                        disabled={currentPage === 1}
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        ←
                                                    </Button>
                                                    
                                                    <div className="flex items-center space-x-1">
                                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                                            <Button
                                                                key={page}
                                                                type="button"
                                                                variant="default"
                                                                size="sm"
                                                                onClick={() => setCurrentPage(page)}
                                                                className={`h-8 w-8 p-0 ${
                                                                    currentPage === page 
                                                                        ? 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600' 
                                                                        : ''
                                                                }`}
                                                            >
                                                                {page}
                                                            </Button>
                                                        ))}
                                                    </div>
                                                    
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                        disabled={currentPage === totalPages}
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        →
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Nút gửi - Fixed ở dưới */}
                            <div className="flex-none flex justify-end pt-4 border-t bg-white">
                                <Button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    className="bg-green-400 hover:bg-green-500 text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting 
                                        ? (isEditMode ? "Đang cập nhật..." : "Đang tạo...") 
                                        : (isEditMode ? "Cập nhật danh sách" : "Tạo danh sách")
                                    }
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </main>
            )}

        </div>
    )
}