"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useCurriculumCustomById, useLessonById } from "@/hooks"
import { Lesson, LessonWord, Word, Curriculum, Level } from "@/lib/types"
import Loading from "@/components/ui/loading"

// Components
import TopNavigation from "@/components/lesson-builder/TopNavigation"
import UnitFilter from "@/components/lesson-builder/UnitFilter"
import WordSelectionPanel from "@/components/lesson-builder/WordSelectionPanel"
import TransferControl from "@/components/lesson-builder/TransferControl"
import LessonHeader from "@/components/lesson-builder/LessonHeader"
import EmptyLessonState from "@/components/lesson-builder/EmptyLessonState"
import LessonWordsTable from "@/components/lesson-builder/LessonWordsTable"
import { useLessonBuilderLogic } from "@/components/lesson-builder/useLessonBuilderLogic"
import { LocalWord, LessonWithWords } from "@/components/lesson-builder/types"
import Modal from "./Modal"

export default function TaoBaiHocPage({ mode, id }: { mode?: 'create' | 'update', id?: string }) {
    // URL parameters
    const searchParams = useSearchParams()
    const curriculumId = searchParams?.get("id") || ''
    const lessonId = id

    // State management
    const isEditMode = mode === 'update'
    const [actualCCId, setActualCCId] = useState<string>('')
    // const [mounted, setMounted] = useState(false)
    const [data, setData] = useState<{ [key: string]: LocalWord[] }>({})
    const [lessonsFiltered, setLessonsFiltered] = useState<LessonWithWords[]>([])
    const [lessonWords, setLessonWords] = useState<LessonWord[]>([])
    const [courseName, setCourseName] = useState("")
    const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([])
    const [expandedChildGroups, setExpandedChildGroups] = useState<Set<string>>(new Set())
    const [isModalOpen, setIsModalOpen] = useState(mode === 'create')

    // React Query hooks - chỉ fetch khi thực sự cần thiết
    const { data: customCurriculum, isLoading: customCurriculumLoading } = useCurriculumCustomById(
        // Fetch curriculum custom khi có actualCCId (trong cả create và edit mode)
        // Create mode: actualCCId được set sau khi Modal tạo thành công
        // Edit mode: actualCCId được extract từ lesson data
        actualCCId || ''
    )
    const { data: lessonById, isLoading: lessonByIdLoading } = useLessonById(lessonId)

    // Debug logging với thông tin chi tiết hơn về React Query
    useEffect(() => {
        console.log('🔍 Debug state:', {
            mode,
            isEditMode,
            curriculumId, // curriculum ORIGINAL ID từ URL
            actualCCId,   // curriculum CUSTOM ID
            lessonId,
            hasCustomCurriculum: !!customCurriculum,
            hasLessonById: !!lessonById,
            customCurriculumLoading,
            lessonByIdLoading,
            shouldFetchCustomCurriculum: !!actualCCId, // enabled condition for useCurriculumCustomById
            modalWillRender: !isEditMode,
            reactQueryState: {
                customCurriculumEnabled: !!actualCCId, // Updated: fetch khi có actualCCId (cả create và edit mode)
                lessonByIdEnabled: !!lessonId
            }
        })

        // Thêm warning nếu có request không mong muốn
        if (!actualCCId && customCurriculumLoading) {
            console.warn('⚠️ customCurriculumLoading = true nhưng actualCCId is empty!')
        }
    }, [mode, isEditMode, curriculumId, actualCCId, lessonId, customCurriculum, lessonById, customCurriculumLoading, lessonByIdLoading])

    // const isLoading = lessonByIdLoading || (actualCCId && customCurriculumLoading)

    // Handle edit mode
    // useEffect(() => {
    //     if (mode === 'update') {
    //         setIsEditMode(true)
    //     } else {
    //         setIsEditMode(false)
    //     }
    // }, [mode])

    // Extract curriculum_custom_id sớm để load curriculum data
    useEffect(() => {
        if (isEditMode && lessonById && !actualCCId) {
            const ccid = (lessonById as unknown as Record<string, unknown>)['curriculum_custom_id']
            if (ccid) {
                console.log('🔄 Setting actualCCId early (update mode):', String(ccid))
                setActualCCId(String(ccid))
            }
        }
        // Trong create mode, KHÔNG set actualCCId từ curriculumId vì đó là curriculum original ID
        // actualCCId chỉ được set khi Modal tạo thành công curriculum custom
    }, [isEditMode, lessonById, actualCCId])

    // useEffect(() => {
    //     setMounted(true)
    // }, [])

    // Normalize units
    const normalizedUnits = useMemo(() => {
        const units = (customCurriculum && Array.isArray((customCurriculum).list_unit)) ? (customCurriculum).list_unit : []
        return units.map((u) => {
            const list_word = u.list_word
            return { ...u, list_word }
        })
    }, [customCurriculum])

    // Initialize selectedUnitIds and data
    useEffect(() => {
        if (!Array.isArray(normalizedUnits) || normalizedUnits.length === 0) return

        const allIds = normalizedUnits.map((u) => u.id)
        setSelectedUnitIds(allIds)

        setData((prev) => {
            if (Object.keys(prev).length > 0) return prev
            const initialData: { [key: string]: LocalWord[] } = {}
            normalizedUnits.forEach((u) => {
                const words: LocalWord[] = (u.list_word || []).map((w: Word) => ({
                    id: w.id,
                    word: w.word,
                    meaning: w.meaning || '',
                    ipa: w.ipa || '',
                    selected: false,
                    done: false,
                    popularity: (w.popularity as number) || 0,
                    belong: ''
                }))
                initialData[u.id] = words
            })
            return initialData
        })
    }, [normalizedUnits])

    // Update lessons filtered
    useEffect(() => {
        const visibleUnits = normalizedUnits.filter((u) => selectedUnitIds.includes(u.id))
        const items: LessonWithWords[] = visibleUnits.map((u) => {
            const words: LocalWord[] = (u.list_word || []).map((w: Word) => ({
                id: w.id,
                word: w.word,
                meaning: w.meaning || '',
                ipa: w.ipa || '',
                selected: false,
                done: false,
                popularity: (w.popularity as number) || 0,
                belong: ''
            }))
            return { id: u.id, title: u.name || '', words }
        })

        setLessonsFiltered(items)

        setData((prev) => {
            if (Object.keys(prev).length > 0) return prev
            const initialData: { [key: string]: LocalWord[] } = {}
            visibleUnits.forEach((it) => {
                initialData[it.id] = it.list_word?.map((w: Word) => ({
                    id: w.id,
                    word: w.word,
                    meaning: w.meaning || '',
                    ipa: w.ipa || '',
                    selected: false,
                    done: false,
                    popularity: (w.popularity as number) || 0,
                    belong: ''
                })) || []
            })
            return initialData
        })
    }, [normalizedUnits, selectedUnitIds])

    // Prefill edit mode data
    useEffect(() => {
        if (!isEditMode || !lessonById || normalizedUnits.length === 0) return

        console.log('🔄 Prefilling edit mode data:', {
            lessonId,
            lessonById,
            normalizedUnitsLength: normalizedUnits.length
        })

        try {
            const lb = lessonById as Lesson
            const toStr = (v: unknown) => (v === undefined || v === null) ? '' : String(v)

            setCourseName(toStr((lb as unknown as Record<string, unknown>)['name']))

            const incomingWords: LessonWord[] = Array.isArray(lb.words)
                ? (lb.words as unknown as Record<string, unknown>[]).map((w) => ({
                    id: toStr(w['id'] ?? w['wordId'] ?? w['word']),
                    word: toStr(w['word'] ?? w['wordText']),
                    meaning: toStr(w['meaning'] ?? w['mean']),
                    ipa: toStr(w['ipa'] ?? w['pronunciation']),
                    pause_time: toStr(w['pauseTime'] ?? '2'),
                    maxRead: toStr(w['maxRead'] ?? '6'),
                    show_ipa: toStr(w['show_ipa'] ?? '3'),
                    show_word: toStr(w['show_word'] ?? '1'),
                    show_ipa_and_word: toStr(w['show_ipa_and_word'] ?? '2'),
                    reads_per_round: toStr(w['reads_per_round'] ?? '6'),
                    progress: toStr(w['progress'] ?? '0')
                }))
                : []

            console.log('📝 Incoming words from lesson:', incomingWords)
            setLessonWords(incomingWords)

            // actualCCId đã được set ở useEffect trên rồi

            // Wait for the next tick to ensure normalizedUnits is ready
            setTimeout(() => {
                const selectedIds = new Set(incomingWords.map((w) => w.id))
                console.log('✅ Selected word IDs:', Array.from(selectedIds))

                setLessonsFiltered((prev) => prev.map((lesson) => ({
                    ...lesson,
                    words: lesson.words.map((lw) => ({ ...lw, selected: selectedIds.has(lw.id) }))
                })))

                setData((prev) => {
                    const out: typeof prev = {}
                    for (const key of Object.keys(prev)) {
                        out[key] = prev[key].map((lw) => ({ ...lw, selected: selectedIds.has(lw.id) }))
                    }
                    return out
                })

                console.log('🎯 Edit mode data prefilled successfully')
            }, 100)
        } catch (err) {
            console.error('❌ Failed to prefill edit data for lesson:', err)
        }
    }, [isEditMode, lessonById, normalizedUnits, lessonId])

    // Keep selections in sync - only update when not in edit mode or when normalizedUnits change
    useEffect(() => {
        // Skip this effect if we're in edit mode and lessonWords are already loaded
        if (isEditMode && lessonWords.length > 0) return

        const selectedIds = new Set(lessonWords.map((w) => w.id))

        setLessonsFiltered((prev) => prev.map((lesson) => ({
            ...lesson,
            words: lesson.words.map((lw) => ({ ...lw, selected: selectedIds.has(lw.id) }))
        })))

        setData((prev) => {
            const out: typeof prev = {}
            for (const key of Object.keys(prev)) {
                out[key] = prev[key].map((lw) => ({ ...lw, selected: selectedIds.has(lw.id) }))
            }
            return out
        })
    }, [lessonWords, normalizedUnits, isEditMode])

    // Business logic hook
    const {
        getSelectedCount,
        transferSelectedWords,
        updateLessonWord,
        updateMaxReadsLessonWord,
        removeLessonWord,
        calculateEstimatedTime,
        handleCreateLesson,
        handleUpdateLesson
    } = useLessonBuilderLogic({
        lessonsFiltered,
        data,
        lessonWords,
        courseName,
        actualCCId,
        lessonById,
        curriculumId,
        setLessonWords,
        setLessonsFiltered,
        setData
    })

    // Loading state
    // if (mounted && isLoading) {
    //     return (
    //         <Loading
    //             message="Đang tải dữ liệu bài học..."
    //             variant="full-page"
    //         />
    //     )
    // }

    const handleCloseModal = () => {
        setIsModalOpen(false)
    }
// const router = useRouter()
    const handleOpenModal = () => {
        // if (mode !== 'create')
        setIsModalOpen(true)
        // else router.push('/lesson/create')
    }

    // Xử lý khi Modal tạo thành công và trả về data
    const handleModalSuccess = (data: {
        curriculumCustomId: string,
        selectedUnits: string[],
        curriculum: Curriculum,
        level: Level | undefined
    }) => {
        console.log('🎉 Modal tạo thành công với data:', data)

        // Cập nhật actualCCId với curriculum custom vừa tạo
        console.log('🔄 Setting actualCCId from Modal success:', data.curriculumCustomId)
        setActualCCId(data.curriculumCustomId)

        // Có thể cập nhật selectedUnitIds nếu cần
        // if (data.selectedUnits && data.selectedUnits.length > 0) {
        //     setSelectedUnitIds(data.selectedUnits)
        // }

        // Cập nhật course name dựa trên curriculum và level đã chọn
        // const newCourseName = `${data.curriculum?.name || 'Curriculum'} - ${data.level?.name || 'Level'}`
        // setCourseName(newCourseName)

        console.log('✅ Lesson builder đã nhận được thông tin units đã chọn:', data.selectedUnits)
        console.log('🔄 Will trigger useCurriculumCustomById with actualCCId:', data.curriculumCustomId)
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Chỉ render Modal trong create mode để tránh fetch không cần thiết */}
            {mode === 'create' && (
                <Modal
                    id={curriculumId}
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSuccess={handleModalSuccess}
                />
            )}
            <TopNavigation
                isEditMode={isEditMode}
                onOpenModal={handleOpenModal}
            />

            <div className="pt-20 h-screen flex">
                <div className="w-1/3 bg-gray-100 border-r border-gray-300 overflow-y-auto">
                    { customCurriculumLoading || lessonByIdLoading ? 
                    <div className="h-full flex justify-center items-center"><Loading message="Đang tải giáo trình..." /></div> : (
                        <div className="p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-6">Chọn từ vựng</h2>

                            <UnitFilter
                                units={normalizedUnits}
                                selectedUnitIds={selectedUnitIds}
                                setSelectedUnitIds={setSelectedUnitIds}
                            />

                            <WordSelectionPanel
                                units={normalizedUnits}
                                selectedUnitIds={selectedUnitIds}
                                data={data}
                                expandedChildGroups={expandedChildGroups}
                                setData={setData}
                                setExpandedChildGroups={setExpandedChildGroups}
                            />
                        </div>
                    )}
                </div>

                {/* Middle Panel - Transfer Control */}
                <TransferControl
                    selectedCount={getSelectedCount()}
                    onTransfer={transferSelectedWords}
                />

                {/* Right Panel - Lesson Building */}
                <div className="flex-1 border-l border-gray-300 bg-gray-100 overflow-y-auto">
                    { lessonByIdLoading ? 
                    <div className="h-full flex justify-center items-center"><Loading message="Đang tải danh sách từ vựng..." /></div> : (
                    <div className="p-6">
                        <LessonHeader
                            lessonWordsCount={lessonWords.length}
                            courseName={courseName}
                            setCourseName={setCourseName}
                            estimatedTime={calculateEstimatedTime()}
                            isEditMode={isEditMode}
                            onSave={isEditMode ? handleUpdateLesson : handleCreateLesson}
                            canSave={lessonWords.length > 0 && courseName.trim() !== ''}
                        />

                        {lessonWords.length === 0 ? (
                            <EmptyLessonState />
                        ) : (
                            <LessonWordsTable
                                lessonWords={lessonWords}
                                setLessonWords={setLessonWords}
                                updateLessonWord={updateLessonWord}
                                updateMaxReadsLessonWord={updateMaxReadsLessonWord}
                                removeLessonWord={removeLessonWord}
                            />
                        )}
                    </div> )}
                </div>
            </div>
        </div>
    )
}