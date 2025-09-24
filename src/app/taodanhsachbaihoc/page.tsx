"use client"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { FormValues, Unit } from "@/lib/types"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState, useRef, startTransition } from "react"
import { useForm, type Control } from "react-hook-form"
import Loading from "@/components/ui/loading"
import ErrorHandler from "@/components/ui/error-handler"
import { useCurriculumOriginal, useCreateCurriculumCustom, useUpdateCurriculumCustom, useCurriculumOriginalById, useCurriculumCustomById } from "@/hooks"
type LevelShort = { id: string; name?: string; units?: Unit[] }

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
            levelId: "",
            listSelectedUnit: [],
        }
    })

    // 🔧 Watch curriculum changes để tránh re-render liên tục
    const watchedCurriculum = form.watch('curriculum')

    // React Query hooks
    const { data: curriculum, isLoading: curriculumLoading } = useCurriculumOriginalById(watchedCurriculum)
    const { data: curriculums = [], isLoading: curriculumsLoading, error: curriculumsError } = useCurriculumOriginal()
    const createLessonMutation = useCreateCurriculumCustom()
    const updateLessonMutation = useUpdateCurriculumCustom()

    // Zustand stores
    // setError not used here after switching from sessionStorage
    // const { setError } = useUIStore()

    // Computed values
    const isLoading = curriculumLoading || curriculumsLoading
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
    // Edit mode: read id from URL and fetch custom curriculum
    const modeFromUrl = searchParams.get('mode')
    const editIdFromUrl = searchParams.get('id')
    // Fallback: sometimes the id may be under other param names (curriculum, curriculum_id)
    const fallbackCurriculumId = searchParams.get('curriculum_custom')
    const editId = editIdFromUrl ?? fallbackCurriculumId ?? undefined
    const { data: customCurriculum } = useCurriculumCustomById(editId ?? '')

    useEffect(() => {
        if (modeFromUrl === 'edit') {
            setIsEditMode(true)
            // Reset conversion flag and ref
            originalSelectedRef.current = []
            isConverting.current = false

            // When custom curriculum loads, populate the form
            if (customCurriculum) {
                // The custom curriculum payload links to the original via curriculum_original_id
                // Use that original id in the form so useCurriculumOriginalById loads levels/units
                type CustomPayload = {
                    id?: string; 
                    curriculum_original_id?: string; 
                    level_id?: string; 
                    list_unit?: {
                        "id": string,
                        "name": string,
                        "level_id": string,
                        "level_name": string,
                        "list_work": unknown[]
                    }[]; name?: string
                }
                const payload = customCurriculum as unknown as CustomPayload

                const originalCurriculumId = payload.curriculum_original_id || payload.id || ''

                setEditingLessonId(customCurriculum.id || null)

                // Determine the level: prefer explicit level_id stored on the custom record
                const preferredLevelId = payload.level_id || ((customCurriculum.list_level && customCurriculum.list_level[0]?.id) || '')

                const selectedUnitIds = (payload.list_unit || []).map((u) => typeof u === 'string' ? u : (u).id)

                const editValues = {
                    name: payload.name || '',
                    // IMPORTANT: set curriculum to the ORIGINAL curriculum id so that
                    // useCurriculumOriginalById(watchedCurriculum) will fetch the original curriculum
                    curriculum: originalCurriculumId,
                    levelId: preferredLevelId,
                    listSelectedUnit: selectedUnitIds,
                }

                // Store initial selected items for comparison (ids)
                originalSelectedRef.current = selectedUnitIds

                form.reset(editValues, { keepDirty: false, keepTouched: false })
                setEditDataLoaded(true)
            }
        } else {
            setIsEditMode(false)
            setEditDataLoaded(false)
            originalSelectedRef.current = []
            isInitialized.current = false // Reset initialization flag for create mode
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [modeFromUrl, editIdFromUrl, customCurriculum])

    // Auto-set default curriculum when curriculums are loaded (for create mode only)
    useEffect(() => {
        console.log('🔧 Curriculum initialization effect:', { 
            isEditMode, 
            isInitialized: isInitialized.current, 
            curriculums: curriculums?.length,
            paramCurriculum: searchParams.get('curriculum')
        })
        
        if (isEditMode) return
        
        // Always process curriculum from URL params, even if initialized
        const paramCurriculum = searchParams.get('curriculum')
        const currentCurriculum = form.getValues('curriculum')
        
        // Skip if already initialized with the same curriculum
        if (isInitialized.current && paramCurriculum === currentCurriculum) return

        // Set curriculum for create mode (from URL param or default)
        if (curriculums && curriculums.length > 0) {
            console.log('🔧 Setting curriculum from URL param:', paramCurriculum)
            if (paramCurriculum) {
                const found = curriculums.find(c => c.id === paramCurriculum)
                if (found) {
                    console.log('🔧 Found matching curriculum:', found.id)
                    form.setValue('curriculum', found.id, { shouldDirty: false, shouldTouch: false })
                } else {
                    console.log('🔧 Curriculum not found, using first:', curriculums[0].id)
                    form.setValue('curriculum', curriculums[0].id, { shouldDirty: false, shouldTouch: false })
                }
            } else if (!isInitialized.current) {
                // Only set default if never initialized
                console.log('🔧 No URL param, using first curriculum:', curriculums[0].id)
                form.setValue('curriculum', curriculums[0].id, { shouldDirty: false, shouldTouch: false })
            }
        }
        isInitialized.current = true
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditMode, curriculums, searchParams]) // 🔧 Add searchParams dependency to re-run when URL changes

    // Auto-set level when curriculum details are loaded
    useEffect(() => {
        type LevelShort = { id: string; name?: string; units?: Unit[] }
        const levels = (curriculum?.list_level as LevelShort[] | undefined) || (curriculum?.list_level as LevelShort[] | undefined) || []
        if (!curriculum) return
        if (!levels) return

        // 🔧 Trong edit mode, chỉ chạy sau khi edit data đã loaded
        if (isEditMode && !editDataLoaded) {
            return
        }

        const currentLevel = form.getValues('levelId') // 🔧 Get from form instead of state

        if (isEditMode) {
            // ✅ Edit mode: Verify that the level from edit data exists in curriculum
            if (currentLevel && levels.length > 0) {
                const levelExists = levels.find((l: LevelShort) => l.id === currentLevel)
                if (!levelExists) {
                    const firstLevelId = levels[0].id
                    form.setValue('levelId', firstLevelId, { shouldDirty: false, shouldTouch: false })
                }
            } else if (!currentLevel && levels.length > 0) {
                // Fallback: nếu edit data không có level, set default
                const firstLevelId = levels[0].id
                form.setValue('levelId', firstLevelId, { shouldDirty: false, shouldTouch: false })
            }
        } else {
            // Create mode - set level đầu tiên nếu chưa có level nào
            if (!currentLevel && levels.length > 0) {
                const firstLevelId = levels[0].id
                form.setValue('levelId', firstLevelId, { shouldDirty: false, shouldTouch: false })
                // Guard list_unit and support both possible unit-level keys (level_id or level)
                const units: Unit[] = curriculums[0]?.list_unit ?? []
                const newBaiList = units.filter((unit) => {
                    const u = unit as unknown as { level_id?: string; level?: string }
                    const levelIdFromUnit = u.level_id ?? u.level
                    return levelIdFromUnit === firstLevelId
                })
                setBaiList(newBaiList)
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps  
    }, [curriculum, isEditMode, editDataLoaded]) // 🔧 Removed form dependency to prevent infinite loop

    // Update baiList when curriculum data and level change
    useEffect(() => {
        const currentFormValues = form.getValues() // 🔧 Get current form values inside effect

        if (!curriculum) {
            setBaiList([])
            return
        }

        const levelsForUnits = (curriculum?.list_level as LevelShort[] | undefined) || (curriculum?.list_level as LevelShort[] | undefined) || []
        if (levelsForUnits && levelsForUnits.length > 0 && currentFormValues.levelId) {
            // 🔧 Trong edit mode, chỉ chạy sau khi edit data đã loaded
            if (isEditMode && !editDataLoaded) {
                return
            }
            const selectedLevel = levelsForUnits.find((l) => l.id === currentFormValues.levelId)
            const newBaiList = selectedLevel?.units || []
            setBaiList(newBaiList)
        } else {
            setBaiList([])
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [curriculum, isEditMode, editDataLoaded]) // 🔧 Removed form dependency to prevent infinite loop

    // Defensive effect: ensure baiList populates once curriculum arrives
    useEffect(() => {
        if (!curriculum) return
        if (isEditMode && !editDataLoaded) return

        // If levelId is already set, but baiList is empty, try to populate from units
        const levelId = form.getValues('levelId')
        const units: Unit[] = curriculum?.list_unit ?? []

        const filterUnitsByLevel = (lvlId: string | undefined) => {
            if (!lvlId) return [] as Unit[]
            return units.filter((unit) => {
                const u = unit as unknown as { level_id?: string; level?: string }
                const levelIdFromUnit = u.level_id ?? u.level
                return levelIdFromUnit === lvlId
            })
        }

        if (levelId) {
            const found = filterUnitsByLevel(levelId)
            if (found.length > 0 && baiList.length === 0) {
                setBaiList(found)
            }
            return
        }

        // No levelId set yet: pick first level (if present) or use units as fallback
        const levels = ((curriculum?.list_level as LevelShort[] | undefined) || [])
        if (levels.length > 0) {
            const firstLevelId = levels[0].id
            form.setValue('levelId', firstLevelId, { shouldDirty: false, shouldTouch: false })
            const found = filterUnitsByLevel(firstLevelId)
            setBaiList(found)
            return
        }

        // If no levels available, but units exist, show all units
        if (units.length > 0 && baiList.length === 0) {
            setBaiList(units)
        }
    }, [curriculum, isEditMode, editDataLoaded, form, baiList.length])

    // Separate effect for handling edit mode conversion - runs only once when ready
    useEffect(() => {
        if (isEditMode && editDataLoaded && baiList.length > 0 && !isConverting.current) {
            const currentSelectedBai = form.getValues('listSelectedUnit') || []

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
                    form.setValue('listSelectedUnit', convertedIds, { shouldDirty: false, shouldTouch: false })
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

            if (!data.curriculum || !data.levelId) {
                alert("Vui lòng chọn giáo trình gốc và trình độ")
                return
            }

            if (data.listSelectedUnit.length === 0) {
                alert("Vui lòng chọn ít nhất một bài học")
                return
            }

            if (isEditMode && editingLessonId) {
                // Chế độ sửa - Sử dụng React Query mutation

                const updateData = {
                    id: editingLessonId,
                    name: data.name.trim(),
                    description: '',
                    curriculum_original_id: data.curriculum,
                    level_id: data.levelId,
                    list_unit: data.listSelectedUnit,
                }

                console.debug('updatePayload:', updateData)
                if (!updateData) throw new Error('updateData is undefined')
                await updateLessonMutation.mutateAsync(updateData)
                alert("Cập nhật danh sách từ thành công!")
            } else {
                // Chế độ tạo mới - Sử dụng React Query mutation
                // For create, backend expects list_unit as array of unit ids (string[])
                type CreateCurriculumPayload = {
                    name: string
                    curriculum_original_id: string
                    description: string
                    level_id: string
                    list_unit: string[]
                }

                const newData: CreateCurriculumPayload = {
                    name: data.name.trim(),
                    curriculum_original_id: data.curriculum,
                    description: '',
                    level_id: data.levelId,
                    list_unit: data.listSelectedUnit
                }

                console.debug('create payload:', newData)
                if (!newData) throw new Error('newData is undefined')

                // Defensive guard: ensure the mutation hook is initialized and has mutateAsync
                if (!createLessonMutation || typeof createLessonMutation.mutateAsync !== 'function') {
                    console.error('createLessonMutation is not available', { createLessonMutation })
                    throw new Error('Tạo không thành công: create mutation chưa sẵn sàng')
                }

                // Call the create mutation with the id-array payload
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
        console.log("Form submitted with data:", data)
    }, [router, isEditMode, editingLessonId, createLessonMutation, updateLessonMutation])

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
                            {/* {isEditMode && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <p className="text-amber-800 text-sm">
                                    ⚠️ <strong>Chế độ chỉnh sửa:</strong> Bạn chỉ có thể thêm bài học mới và không thể thay đổi tên, giáo trình, trình độ hoặc bỏ bài học đã chọn.
                                </p>
                            </div>
                        )} */}
                        </div>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 flex flex-col h-full">
                                <div className="flex-none space-y-3">
                                    <FormField
                                        control={form.control as unknown as Control<FormValues>}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-base font-medium text-gray-900">
                                                    Tên giáo trình tùy:
                                                    {/* {isEditMode && <span className="text-gray-500 ml-2">(không thể sửa)</span>} */}
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="Nhập tên giáo trình tùy..."
                                                        className="w-full text-gray-900"
                                                    // disabled={isEditMode} // 🔧 Disable trong edit mode
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="flex gap-4">
                                        {/* Chọn giáo trình */}
                                        <FormField
                                            control={form.control as unknown as Control<FormValues>}
                                            name="curriculum"
                                            render={({ field }) => {
                                                const selectedCurriculum = curriculums.find(c => c.id === field.value)
                                                return (
                                                    <FormItem className="flex-1">
                                                        <FormLabel className="text-base font-medium text-gray-900">
                                                            Giáo trình gốc:
                                                            {/* {isEditMode && <span className="text-gray-500 ml-2">(không thể sửa)</span>} */}
                                                        </FormLabel>
                                                        <FormControl>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button
                                                                        variant="outline"
                                                                        className="w-full justify-between text-gray-900"
                                                                    // disabled={isEditMode} // 🔧 Disable trong edit mode
                                                                    >
                                                                        {selectedCurriculum?.name || "Chọn giáo trình gốc"}
                                                                    </Button>
                                                                </DropdownMenuTrigger>

                                                                <DropdownMenuContent align="start" className="w-full bg-white text-gray-900">
                                                                    {curriculums.map((cur) => (
                                                                        <DropdownMenuItem
                                                                            key={cur.id}
                                                                            onSelect={() => {
                                                                                field.onChange(cur.id)

                                                                                // ✅ Reset baiList và form khi đổi curriculum
                                                                                setBaiList([])
                                                                                form.setValue('levelId', '', { shouldDirty: false, shouldTouch: false })
                                                                                form.setValue('listSelectedUnit', [], { shouldDirty: false, shouldTouch: false })
                                                                            }}
                                                                        >
                                                                            {cur.name}
                                                                        </DropdownMenuItem>
                                                                    ))}
                                                                </DropdownMenuContent>

                                                            </DropdownMenu>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )
                                            }}
                                        />

                                        {/* Chọn level */}
                                        <FormField
                                            control={form.control as unknown as Control<FormValues>}
                                            name="levelId"
                                            render={({ field }) => {
                                                const selectedLevel = field.value === 'all' ? { name: 'Tất cả' } : (((curriculum?.list_level as LevelShort[] | undefined) || []).find((l) => l.id === field.value) as LevelShort | undefined)
                                                return (
                                                    <FormItem className="flex-1">
                                                        <FormLabel className="text-base font-medium text-gray-900">
                                                            Trình độ
                                                            {/* {isEditMode && <span className="text-gray-500 ml-2">(không thể sửa)</span>} */}
                                                        </FormLabel>
                                                        <FormControl>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button
                                                                        variant="outline"
                                                                        className="w-full justify-between text-gray-900"
                                                                    // disabled={isEditMode} // 🔧 Disable trong edit mode
                                                                    >
                                                                        {selectedLevel?.name || "Chọn trình độ"}
                                                                    </Button>
                                                                </DropdownMenuTrigger>

                                                                <DropdownMenuContent align="start" className="w-full bg-white text-gray-900">
                                                                    <DropdownMenuItem
                                                                        key={'all-levels'}
                                                                        onSelect={() => {
                                                                            const currentSelected = form.getValues('listSelectedUnit') || []
                                                                            const proceed = currentSelected.length === 0 || window.confirm('Thay đổi trình độ sẽ xóa các bài học đã chọn. Bạn có muốn tiếp tục?')
                                                                            if (!proceed) return
                                                                            field.onChange('all')
                                                                            // ✅ Cập nhật baiList khi chọn level mới
                                                                            // Guard list_unit and handle both possible key names for level on unit
                                                                            const units: Unit[] = curriculum?.list_unit ?? []
                                                                            const newBaiList = units
                                                                            setBaiList(newBaiList)

                                                                            // ✅ Reset listSelectedUnit khi đổi level
                                                                            form.setValue('listSelectedUnit', [], { shouldDirty: false, shouldTouch: false })
                                                                        }}
                                                                    >
                                                                        {'Tất cả'}
                                                                    </DropdownMenuItem>
                                                                    {((curriculum?.list_level as LevelShort[] | undefined) || []).map((level: LevelShort) => (
                                                                        <DropdownMenuItem
                                                                            key={level.id}
                                                                            onSelect={() => {
                                                                                const currentSelected = form.getValues('listSelectedUnit') || []
                                                                                const proceed = currentSelected.length === 0 || window.confirm('Thay đổi trình độ sẽ xóa các bài học đã chọn. Bạn có muốn tiếp tục?')
                                                                                if (!proceed) return
                                                                                field.onChange(level.id)
                                                                                // ✅ Cập nhật baiList khi chọn level mới
                                                                                const selectedLevel = ((curriculum?.list_level as LevelShort[] | undefined) || []).find((l) => l.id === level.id)
                                                                                // Guard list_unit and handle both possible key names for level on unit
                                                                                const units: Unit[] = curriculum?.list_unit ?? []
                                                                                const newBaiList = units.filter((unit) => {
                                                                                    const u = unit as unknown as { level_id?: string; level?: string }
                                                                                    const levelIdFromUnit = u.level_id ?? u.level
                                                                                    return levelIdFromUnit === selectedLevel?.id
                                                                                })
                                                                                setBaiList(newBaiList)

                                                                                // ✅ Reset listSelectedUnit khi đổi level
                                                                                form.setValue('listSelectedUnit', [], { shouldDirty: false, shouldTouch: false })
                                                                            }}
                                                                        >
                                                                            {level.name}
                                                                        </DropdownMenuItem>
                                                                    ))}
                                                                </DropdownMenuContent>

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
                                        <p className="text-base font-medium text-gray-900">Chọn bài học ({baiList.length} bài)</p>
                                        {/* {isEditMode && (
                                        <p className="text-sm text-blue-600 mt-1">
                                            📝 Chế độ chỉnh sửa: Chỉ có thể thêm bài học mới, không thể bỏ bài học đã chọn
                                        </p>
                                    )} */}
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
                                                        control={form.control as unknown as Control<FormValues>}
                                                        name="listSelectedUnit"
                                                        render={({ field }) => {
                                                            const value: string[] = Array.isArray(field.value) ? field.value : []

                                                            // 🔧 Fix: So sánh cả ID và name để handle trường hợp edit mode
                                                            const isChecked = value.includes(bai.id)
                                                            // 🔧 Use ref to avoid re-render issues
                                                            // const isOriginallySelected = isEditMode && (
                                                            //     originalSelectedRef.current.includes(bai.id) || 
                                                            //     originalSelectedRef.current.includes(bai.name)
                                                            // )

                                                            const handleChange = (checked: boolean) => {
                                                                // // 🔧 Trong edit mode, không cho bỏ tích các bài đã chọn ban đầu
                                                                // if (isEditMode && !checked && isOriginallySelected) {
                                                                //     return
                                                                // }

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

                                                                // if (isEditMode && isOriginallySelected && isChecked) {
                                                                //     return
                                                                // }
                
                                                                e.preventDefault()
                                                                e.stopPropagation()
                                                                handleChange(!isChecked)
        
                                                            }

                                                            return (
                                                                <FormItem
                                                                    className={`flex items-center rounded-md p-3 transition-colors border border-gray-500 
                                                                  
                                                                `}
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
                                                                            className="mb-0 mr-0 text-gray-900"
                                                                        // disabled={isEditMode && isOriginallySelected}
                                                                        />
                                                                    </FormControl>
                                                                    <FormLabel
                                                                        className={`text-gray-900 flex-1 ml-3 mb-0 text-sm font-medium `}
                                                                    >
                                                                        {bai.name}
                                                                        {/* {isEditMode && isOriginallySelected && (
                                                                        <span className="text-xs text-blue-600 ml-2">(đã chọn trước đó)</span>
                                                                    )} */}
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
                                                                    className={`h-8 w-8 p-0 ${currentPage === page
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