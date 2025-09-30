"use client"

import { useCallback, useEffect, useState, useRef, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { Form } from "@/components/ui/form"
import { FormValues, Unit, Curriculum } from "@/lib/types"
import Loading from "@/components/ui/loading"
import ErrorHandler from "@/components/ui/error-handler"
import { 
  useCurriculumOriginal, 
  useCreateCurriculumCustom, 
  useUpdateCurriculumCustom, 
  useCurriculumOriginalById, 
  useCurriculumCustomById 
} from "@/hooks"

import TopNavigation from "./TopNavigation"
import FormHeader from "./FormHeader"
import LessonNameInput from "./LessonNameInput"
import CurriculumSelector from "./CurriculumSelector"
import LevelSelector from "./LevelSelector"
import LessonSelectionSection from "./LessonSelectionSection"
import SubmitButton from "./SubmitButton"
import { LevelShort } from "./types"

export default function GiaoTrinhPage({ mode, id }: { mode?: 'create' | 'update', id?: string }) {
  // Local state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editDataLoaded, setEditDataLoaded] = useState(false)
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null)
  const [baiList, setBaiList] = useState<Unit[]>([])
  const originalSelectedRef = useRef<string[]>([])
  const isInitialized = useRef(false)
  const isConverting = useRef(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 24

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
  const curriculum_custom_id = mode === 'update' ? id : undefined
  const watchedCurriculum = form.watch('curriculum')

  // Determine edit mode from props
  const isEditModeFromRoute = mode === 'update'
  const curriculumIdFromProps = mode === 'create' ? id : undefined // This is the curriculum ID from props

  // React Query hooks
  const { data: curriculum, isLoading: curriculumLoading } = useCurriculumOriginalById(watchedCurriculum)
  const { data: curriculums = [], isLoading: curriculumsLoading, error: curriculumsError } = useCurriculumOriginal()
  const createLessonMutation = useCreateCurriculumCustom()
  const updateLessonMutation = useUpdateCurriculumCustom()

  // For edit mode, fetch the custom curriculum by curriculum ID
  const { data: customCurriculum } = useCurriculumCustomById(curriculum_custom_id ?? '')

  // Computed values
  const isLoading = curriculumLoading || curriculumsLoading
  const error = curriculumsError?.message

  // Pagination calculations
  const totalItems = baiList.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = baiList.slice(startIndex, endIndex)

  // Selected curriculum and level
  const selectedCurriculum = curriculums.find(c => c.id === watchedCurriculum) as Curriculum | undefined
  const levels = useMemo(() => 
    (curriculum?.list_level as LevelShort[] | undefined) || [], 
    [curriculum?.list_level]
  )
  const levelId = form.watch('levelId')
  const selectedLevel = levelId === 'all' 
    ? { id: 'all', name: 'Tất cả' } as LevelShort
    : levels.find(l => l.id === levelId)

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

  // Handle edit mode based on props
  useEffect(() => {
    if (isEditModeFromRoute) {
      setIsEditMode(true)
      originalSelectedRef.current = []
      isConverting.current = false

      if (customCurriculum) {
        type CustomPayload = {
          id?: string
          curriculum_original_id?: string
          level_id?: string
          list_unit?: {
            id: string
            name: string
            level_id: string
            level_name: string
            list_work: unknown[]
          }[]
          name?: string
        }
        const payload = customCurriculum as unknown as CustomPayload
        const originalCurriculumId = payload.curriculum_original_id || payload.id || ''

        setEditingLessonId(customCurriculum.id || null)

        const preferredLevelId = payload.level_id || ((customCurriculum.list_level && customCurriculum.list_level[0]?.id) || '')
        const selectedUnitIds = (payload.list_unit || []).map((u) => typeof u === 'string' ? u : u.id)

        const editValues = {
          name: payload.name || '',
          curriculum: originalCurriculumId, // Use original curriculum ID from custom curriculum data
          levelId: preferredLevelId,
          listSelectedUnit: selectedUnitIds,
        }

        originalSelectedRef.current = selectedUnitIds
        form.reset(editValues, { keepDirty: false, keepTouched: false })
        setEditDataLoaded(true)
      }
    } else {
      setIsEditMode(false)
      setEditDataLoaded(false)
      originalSelectedRef.current = []
      isInitialized.current = false
    }
  }, [isEditModeFromRoute, customCurriculum, form])

  // Auto-set default curriculum when curriculums are loaded
  useEffect(() => {
    if (isEditMode) return
    
    const paramCurriculum = searchParams.get('curriculum') || curriculumIdFromProps
    const currentCurriculum = form.getValues('curriculum')
    
    if (isInitialized.current && paramCurriculum === currentCurriculum) return

    if (curriculums && curriculums.length > 0) {
      if (paramCurriculum) {
        const found = curriculums.find(c => c.id === paramCurriculum)
        if (found) {
          form.setValue('curriculum', found.id, { shouldDirty: false, shouldTouch: false })
        } else {
          form.setValue('curriculum', curriculums[0].id, { shouldDirty: false, shouldTouch: false })
        }
      } else if (!isInitialized.current) {
        form.setValue('curriculum', curriculums[0].id, { shouldDirty: false, shouldTouch: false })
      }
    }
    isInitialized.current = true
  }, [isEditMode, curriculums, searchParams, form, curriculumIdFromProps])

  // Auto-set level when curriculum details are loaded
  useEffect(() => {
    if (!curriculum) return
    if (!levels) return

    if (isEditMode && !editDataLoaded) {
      return
    }

    const currentLevel = form.getValues('levelId')

    if (isEditMode) {
      if (currentLevel && levels.length > 0) {
        const levelExists = levels.find((l: LevelShort) => l.id === currentLevel)
        if (!levelExists) {
          const firstLevelId = levels[0].id
          form.setValue('levelId', firstLevelId, { shouldDirty: false, shouldTouch: false })
        }
      } else if (!currentLevel && levels.length > 0) {
        const firstLevelId = levels[0].id
        form.setValue('levelId', firstLevelId, { shouldDirty: false, shouldTouch: false })
      }
    } else {
      if (!currentLevel && levels.length > 0) {
        const firstLevelId = levels[0].id
        form.setValue('levelId', firstLevelId, { shouldDirty: false, shouldTouch: false })
        const units: Unit[] = curriculum?.list_unit ?? []
        const newBaiList = units.filter((unit) => {
          const u = unit as unknown as { level_id?: string; level?: string }
          const levelIdFromUnit = u.level_id ?? u.level
          return levelIdFromUnit === firstLevelId
        })
        setBaiList(newBaiList)
      }
    }
  }, [curriculum, isEditMode, editDataLoaded, form, levels])

  // Update baiList when curriculum data and level change
  useEffect(() => {
    const currentFormValues = form.getValues()

    if (!curriculum) {
      setBaiList([])
      return
    }

    const levelsForUnits = (curriculum?.list_level as LevelShort[] | undefined) || []
    if (levelsForUnits && levelsForUnits.length > 0 && currentFormValues.levelId) {
      if (isEditMode && !editDataLoaded) {
        return
      }
      const selectedLevel = levelsForUnits.find((l) => l.id === currentFormValues.levelId)
      const units = selectedLevel?.units || []
      const newBaiList: Unit[] = units.map(unit => ({
        ...unit,
        list_word: []
      }))
      setBaiList(newBaiList)
    } else {
      setBaiList([])
    }
  }, [curriculum, isEditMode, editDataLoaded, form, levels])

  // Defensive effect: ensure baiList populates once curriculum arrives
  useEffect(() => {
    if (!curriculum) return
    if (isEditMode && !editDataLoaded) return

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

    const levelsData = ((curriculum?.list_level as LevelShort[] | undefined) || [])
    if (levelsData.length > 0) {
      const firstLevelId = levelsData[0].id
      form.setValue('levelId', firstLevelId, { shouldDirty: false, shouldTouch: false })
      const found = filterUnitsByLevel(firstLevelId)
      setBaiList(found)
      return
    }

    if (units.length > 0 && baiList.length === 0) {
      setBaiList(units)
    }
  }, [curriculum, isEditMode, editDataLoaded, form, baiList.length])

  // Separate effect for handling edit mode conversion
  useEffect(() => {
    if (isEditMode && editDataLoaded && baiList.length > 0 && !isConverting.current) {
      const currentSelectedBai = form.getValues('listSelectedUnit') || []

      if (currentSelectedBai.length > 0) {
        const needsConversion = currentSelectedBai.some((item: string) => {
          return baiList.find(unit => unit.name === item) !== undefined
        })

        if (needsConversion) {
          isConverting.current = true

          const convertedIds = currentSelectedBai.map((nameOrId: string) => {
            const unitByName = baiList.find(unit => unit.name === nameOrId)
            return unitByName ? unitByName.id : nameOrId
          })

          form.setValue('listSelectedUnit', convertedIds, { shouldDirty: false, shouldTouch: false })
          originalSelectedRef.current = convertedIds
        }
      }
    }
  }, [isEditMode, editDataLoaded, baiList, form])

  // Event handlers
  const handleCurriculumChange = useCallback(() => {
    setBaiList([])
    form.setValue('levelId', '', { shouldDirty: false, shouldTouch: false })
    form.setValue('listSelectedUnit', [], { shouldDirty: false, shouldTouch: false })
    setCurrentPage(1)
  }, [form, setBaiList, setCurrentPage])

  const handleLevelChange = useCallback((levelId: string) => {
    const currentSelected = form.getValues('listSelectedUnit') || []
    const proceed = currentSelected.length === 0 || window.confirm('Thay đổi trình độ sẽ xóa các bài học đã chọn. Bạn có muốn tiếp tục?')
    if (!proceed) return

    const units: Unit[] = curriculum?.list_unit ?? []
    let newBaiList: Unit[]

    if (levelId === 'all') {
      newBaiList = units
    } else {
      newBaiList = units.filter((unit) => {
        const u = unit as unknown as { level_id?: string; level?: string }
        const levelIdFromUnit = u.level_id ?? u.level
        return levelIdFromUnit === levelId
      })
    }

    setBaiList(newBaiList)
    form.setValue('listSelectedUnit', [], { shouldDirty: false, shouldTouch: false })
  }, [form, curriculum, setBaiList])

  const handleItemChange = useCallback(() => {
    // This is handled by the LessonGrid component
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [setCurrentPage])

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
        const updateData = {
          id: editingLessonId,
          name: data.name.trim(),
          description: '',
          curriculum_original_id: data.curriculum,
          level_id: data.levelId,
          list_unit: data.listSelectedUnit,
        }

        await updateLessonMutation.mutateAsync(updateData)
        alert("Cập nhật danh sách từ thành công!")
      } else {
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

        if (!createLessonMutation || typeof createLessonMutation.mutateAsync !== 'function') {
          throw new Error('Tạo không thành công: create mutation chưa sẵn sàng')
        }

        await createLessonMutation.mutateAsync(newData)
        alert("Tạo danh sách từ thành công!")
      }

      // Navigate to curriculum management page
      router.push("/giaotrinh")

    } catch (error) {
      console.error("Error:", error)
      const errorMessage = isEditMode 
        ? "Có lỗi xảy ra khi cập nhật danh sách từ. Vui lòng thử lại!" 
        : "Có lỗi xảy ra khi tạo danh sách từ. Vui lòng thử lại!"
      alert(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }, [router, isEditMode, editingLessonId, createLessonMutation, updateLessonMutation])

  return (
    <div className="min-h-screen bg-gray-100 overflow-x-hidden">
      <TopNavigation 
        isEditMode={isEditMode}
        onNavigateToLessonManagement={() => router.push("/quanlykhoahoc")}
      />

      {/* Loading State */}
      {isLoading && (
        <Loading
          variant="skeleton"
          skeletonType="tao-danh-sach-bai-hoc"
        />
      )}

      {/* Error State */}
      {error && !isLoading && (
        <ErrorHandler
          type="GENERAL_ERROR"
          pageType="tao-danh-sach-bai-hoc"
          title="Không thể tải dữ liệu tạo danh sách bài học"
          message="Đã xảy ra lỗi khi tải dữ liệu giáo trình. Vui lòng thử lại."
          errorDetails={error}
          onRetry={() => window.location.reload()}
          onGoBack={() => router.push("/giaotrinh")}
          onGoHome={() => router.push("/")}
        />
      )}

      {/* Main Content */}
      {!isLoading && !error && (
        <main className="pt-16 pb-6 h-screen flex justify-center items-start bg-gray-100 px-4">
          <div className="bg-white rounded-lg shadow-md w-full py-3 px-6 mt-6 mb-3 flex flex-col">
            <FormHeader isEditMode={isEditMode} />

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 flex flex-col h-full">
                <div className="flex-none space-y-3">
                  <LessonNameInput control={form.control} />
                  
                  <div className="flex gap-4">
                    <CurriculumSelector
                      control={form.control}
                      curriculums={curriculums}
                      selectedCurriculum={selectedCurriculum}
                      onCurriculumChange={handleCurriculumChange}
                      isEditMode={isEditMode}
                    />
                    
                    <LevelSelector
                      control={form.control}
                      levels={levels}
                      selectedLevel={selectedLevel}
                      onLevelChange={handleLevelChange}
                      isEditMode={isEditMode}
                    />
                  </div>
                </div>

                <LessonSelectionSection
                  control={form.control}
                  baiList={baiList}
                  currentItems={currentItems}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  startIndex={startIndex}
                  endIndex={endIndex}
                  originalSelectedRef={originalSelectedRef}
                  isEditMode={isEditMode}
                  onPageChange={handlePageChange}
                  onItemChange={handleItemChange}
                />

                <SubmitButton isSubmitting={isSubmitting} isEditMode={isEditMode} />
              </form>
            </Form>
          </div>
        </main>
      )}
    </div>
  )
}