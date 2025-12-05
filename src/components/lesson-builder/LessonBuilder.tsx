"use client"

import { useEffect, useState, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { useLessonById } from "@/hooks"
import { Lesson, LessonWord, Word, Curriculum, Level, Unit } from "@/lib/types"
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
import { LocalWord } from "@/components/lesson-builder/types"
import Modal from "./Modal"
// import ModalAddWords from "./ModalAddWords"

export default function TaoBaiHocPage({ mode, id }: { mode?: 'create' | 'update', id?: string }) {
    // URL parameters
    const searchParams = useSearchParams()
    const curriculumId = searchParams?.get("id") || ''
    const lessonId = id

    // State management
    const isEditMode = mode === 'update'
    const [units, setUnits] = useState<Unit[]>([]) // Units từ API cho cả create và edit mode
    const [data, setData] = useState<{ [key: string]: LocalWord[] }>({})
    const [lessonWords, setLessonWords] = useState<LessonWord[]>([])
    const [courseName, setCourseName] = useState("")
    const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([])
    const [selectedUnitsFromModal, setSelectedUnitsFromModal] = useState<string[]>([])
    const [expandedChildGroups, setExpandedChildGroups] = useState<Set<string>>(new Set())
    const [isModalOpen, setIsModalOpen] = useState(mode === 'create')
    const [curriculumOriginalId, setCurriculumOriginalId] = useState<string>('')  // NEW

    // React Query hooks
    const { data: lessonById, isLoading: lessonByIdLoading } = useLessonById(lessonId)

    // ===== HELPER: Fetch words from unit_ids =====
    const fetchAndSetUnits = useCallback(async (unitIds: string[]) => {
        interface ApiChildWord {
            word_id: string;
            word_text?: string;
            word?: string;
            word_meaning?: string;
            word_ipa?: string;
            word_popularity?: number;
            lesson_ids?: string[];
            lesson_names?: string[];
        }

        interface ApiWordData {
            word_id: string;
            word_text: string;
            word_meaning?: string;
            word_ipa?: string;
            word_popularity?: number;
            word_parent_id?: string | null;
            children?: ApiChildWord[];
        }

        interface ApiUnitData {
            unit_id: string;
            unit_name: string;
            unit_words: {
                original?: ApiWordData[];
                custom?: ApiWordData[];
            }
        }

        try {
            const queryString = unitIds.map(id => `unitIds=${encodeURIComponent(String(id))}`).join('&');
            const response = await fetch(`/api/proxy/words/by_units?${queryString}`);

            if (!response.ok) throw new Error('Failed to fetch words');

            const result = await response.json();
            const wordsData = (result.success && result.data) ? result.data : (Array.isArray(result) ? result : []);

            if (!Array.isArray(wordsData) || wordsData.length === 0) {
                throw new Error('No words data returned from API');
            }

            // Transform API data (preserve children for UI, flatten children into data for selection)
            const transformedUnits: Unit[] = []
            const initialData: { [key: string]: LocalWord[] } = {}

            wordsData.forEach((unitData: ApiUnitData) => {

                // Roots for UI (unit.words contains only roots)
                const root_original = (unitData.unit_words.original || []).map((w: ApiWordData): Word => ({
                    word_id: w.word_id,
                    word_text: (w as unknown as { word?: string }).word ?? w.word_text,
                    word_meaning: w.word_meaning || '-',
                    word_ipa: w.word_ipa,
                    word_popularity: w.word_popularity || 0,
                    word_parent_id: undefined,
                    children: Array.isArray(w.children) ? w.children.map((c: ApiChildWord): Word => ({
                        word_id: c.word_id,
                        word_text: (c as unknown as { word?: string }).word ?? c.word_text ?? '',
                        word_meaning: c.word_meaning ?? '-',
                        word_ipa: c.word_ipa ?? '-',
                        word_popularity: c.word_popularity ?? 0,
                        word_parent_id: undefined
                    })) : []
                }))

                // Roots for UI (unit.words contains only roots)
                const root_custom = (unitData.unit_words.custom || []).map((w: ApiWordData): Word => ({ 
                    word_id: w.word_id,
                    word_text: (w as unknown as { word?: string }).word ?? w.word_text,
                    word_meaning: w.word_meaning || '-',
                    word_ipa: w.word_ipa,
                    word_popularity: w.word_popularity || 0,
                    word_parent_id: undefined,
                    children: Array.isArray(w.children) ? w.children.map((c: ApiChildWord): Word => ({
                        word_id: c.word_id,
                        word_text: (c as unknown as { word?: string }).word ?? c.word_text ?? '',
                        word_meaning: c.word_meaning ?? '-',
                        word_ipa: c.word_ipa ?? '-',
                        word_popularity: c.word_popularity ?? 0,
                        word_parent_id: undefined
                    })) : []
                }))
                transformedUnits.push({
                        unit_id: unitData.unit_id,
                        unit_name: unitData.unit_name,
                        words: {
                            original: root_original,
                            custom: root_custom
                        }
                    })

                // Flatten roots + children into data for selection state
                const list: LocalWord[] = []
                const originals = Array.isArray(unitData.unit_words.original) ? unitData.unit_words.original : []
                const customs = Array.isArray(unitData.unit_words.custom) ? unitData.unit_words.custom : []

                const allRoots: ApiWordData[] = [...originals, ...customs]

                allRoots.forEach((w: ApiWordData) => {
                    // Push root word
                    list.push({
                        word_id: w.word_id,
                        word_text: (w as unknown as { word?: string }).word ?? w.word_text,
                        word_meaning: w.word_meaning || '-',
                        word_ipa: w.word_ipa || '-',
                        word_popularity: w.word_popularity || 0,
                        word_parent_id: undefined,
                        selected: false,
                        done: false,
                        belong: ''
                    })

                    // Push children if any
                    if (Array.isArray(w.children) && w.children.length > 0) {
                        w.children.forEach((c: ApiChildWord) => {
                            list.push({
                                word_id: c.word_id,
                                word_text: (c as unknown as { word?: string }).word ?? c.word_text ?? '',
                                word_meaning: c.word_meaning ?? '-',
                                word_ipa: c.word_ipa ?? '-',
                                word_popularity: c.word_popularity ?? 0,
                                word_parent_id: w.word_id,
                                selected: false,
                                done: false,
                                belong: ''
                            })
                        })
                    }
                })

                // Deduplicate by word_id to avoid duplicate keys downstream
                const uniqueMap = new Map<string, LocalWord>()
                for (const lw of list) {
                    if (!uniqueMap.has(lw.word_id)) uniqueMap.set(lw.word_id, lw)
                }
                initialData[unitData.unit_id] = Array.from(uniqueMap.values())
            })

            setUnits(transformedUnits)
            setSelectedUnitIds(unitIds)
            setData(initialData)
        } catch (error) {
            console.error('❌ Error fetching words:', error);
            alert('Lỗi khi tải dữ liệu từ vựng. Vui lòng thử lại.');
        }
    }, [])

    // ===== HELPER: Load edit mode data =====
    const loadEditModeData = useCallback(async () => {
        try {
            const lb = lessonById as Lesson;
            const unitIdsFromLesson = (lb as unknown as Record<string, unknown>)['unit_ids'];

            if (!Array.isArray(unitIdsFromLesson) || unitIdsFromLesson.length === 0) {
                console.warn('⚠️ No unit_ids found in lesson');
                return;
            }

            setSelectedUnitsFromModal(unitIdsFromLesson.map(String));
            await fetchAndSetUnits(unitIdsFromLesson.map(String));

            // Set course name
            const toStr = (v: unknown) => (v === undefined || v === null) ? '' : String(v);
            const lessonName = toStr((lb as unknown as Record<string, unknown>)['lesson_name']);
            const curriculum = (lb as unknown as Record<string, unknown>)['curriculum'] as Record<string, unknown>;

            if (curriculum && curriculum.curriculum_name) {
                setCourseName(`${lessonName}`);
            } else {
                setCourseName(lessonName);
            }

            // Set lesson words
            const incomingWords: LessonWord[] = Array.isArray(lb.lesson_words)
                ? (lb.lesson_words as unknown as Record<string, unknown>[]).map((w) => ({
                    word_id: toStr(w['word_id']),
                    word: toStr(w['word']),
                    word_meaning: toStr(w['word_meaning']),
                    word_ipa: toStr(w['word_ipa']),
                    word_pause_time: toStr(w['word_pause_time'] ?? '1.5'),
                    word_max_read: toStr(w['word_max_read'] ?? '6'),
                    word_show_ipa: toStr(w['word_show_ipa'] ?? '3'),
                    word_show_word: toStr(w['word_show_word'] ?? '1'),
                    word_show_ipa_and_word: toStr(w['word_show_ipa_and_word'] ?? '2'),
                    word_reads_per_round: toStr(w['word_reads_per_round'] ?? '6'),
                    word_progress: toStr(w['word_progress'] ?? '0'),
                    word_parent_id: toStr(w['word_parent_id'] ?? ''),
                    word_popularity: Number(w['word_popularity'] ?? 0),
                }))
                : [];

            setLessonWords(incomingWords);

            // Mark selected words
            setTimeout(() => {
                const selectedIds = new Set(incomingWords.map((w) => w.word_id));
                setData((prev) => {
                    const out: typeof prev = {};
                    for (const key of Object.keys(prev)) {
                        out[key] = prev[key].map((lw) => ({ ...lw, selected: selectedIds.has(lw.word_id) }));
                    }
                    return out;
                });
            }, 100);
        } catch (error) {
            console.error('❌ Error loading edit mode data:', error);
            alert('Lỗi khi tải dữ liệu bài học. Vui lòng thử lại.');
        }
    }, [lessonById, fetchAndSetUnits]);

    // Create mode: nhận curriculum_id từ Modal
    const handleModalSuccess = async (modalData: {
        selectedUnits: string[]
        curriculum: Curriculum
        level: Level | undefined
    }) => {
        const ccId =
            (modalData.curriculum as unknown as Record<string, unknown>)['curriculum_id'] ??
            (modalData.curriculum as unknown as Record<string, unknown>)['id'] ??
            ''
        setCurriculumOriginalId(String(ccId))                             // NEW
        if (!modalData.selectedUnits || modalData.selectedUnits.length === 0) {
            alert('Không có unit nào được chọn')
            return
        }

        setSelectedUnitsFromModal(modalData.selectedUnits)
        await fetchAndSetUnits(modalData.selectedUnits)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
    }

    // ===== EDIT MODE: Call loadEditModeData when in edit mode =====
    useEffect(() => {
        if (!isEditMode || !lessonById) return;
        loadEditModeData();
    }, [isEditMode, lessonById, loadEditModeData])

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
        data,
        lessonWords,
        courseName,
        selectedUnitsFromModal,
        lessonById,
        setLessonWords,
        setData,
        curriculumOriginalId                                 // NEW
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


    // const [isModalAddWordsOpen, setIsModalAddWordsOpen] = useState(false);
    // const handleOpenModalAddWords = () => {
    //     setIsModalAddWordsOpen(true);
    // }
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
            {/* {
                isModalAddWordsOpen && (
                    <ModalAddWords unitId={""} />
                )
            } */}
            <TopNavigation
                isEditMode={isEditMode}
                onOpenModal={() => setIsModalOpen(true)}
            />

            <div className="pt-20 h-screen flex">
                <div className="w-1/3 bg-gray-100 border-r border-gray-300 overflow-y-auto">
                    {lessonByIdLoading ?
                        <div className="h-full flex justify-center items-center"><Loading message="Đang tải dữ liệu..." /></div> : (
                            <div className="p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-6">Chọn từ vựng</h2>

                                <UnitFilter
                                    units={units}
                                    selectedUnitIds={selectedUnitIds}
                                    setSelectedUnitIds={setSelectedUnitIds}
                                />

                                <WordSelectionPanel
                                    units={units}
                                    selectedUnitIds={selectedUnitIds}
                                    data={data}
                                    expandedChildGroups={expandedChildGroups}
                                    setData={setData}
                                    setExpandedChildGroups={setExpandedChildGroups}
                                    // onOpenModalAddWords={handleOpenModalAddWords}
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
                    {lessonByIdLoading ?
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
                            </div>)}
                </div>
            </div>
        </div>
    )
}