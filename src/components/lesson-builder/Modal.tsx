import { useCreateCurriculumCustom } from "@/hooks/use-curriculum";
import { useCurriculumConditional } from "@/hooks/use-curriculum-conditional";
import { CurriculumSelector, LessonSelectionSection, LevelSelector, SubmitButton } from "./index";
import { useForm, FormProvider } from "react-hook-form";
import { FormValues, Curriculum, Level } from "@/lib/types";
import { X } from "lucide-react";
import { useState, useEffect } from "react";
import Loading from "@/components/ui/loading";

export default function Modal({ 
    id,
    isOpen, 
    onClose, 
    onSuccess 
}: { 
    id?: string,
    isOpen: boolean, 
    onClose: () => void,
    onSuccess?: (data: {
        curriculumCustomId: string,
        selectedUnits: string[],
        curriculum: Curriculum,
        level: Level | undefined
    }) => void
}) {
    // Debug: Track when Modal is mounted and with what props
    console.log('🚀 Modal mounted with props:', { id, isOpen });
    
    // Sử dụng custom hook tối ưu - chỉ fetch data cần thiết
    const { curriculum, curriculums, isLoading, error } = useCurriculumConditional(id);
    const [selectedCurriculum, setSelectedCurriculum] = useState<Curriculum | undefined>(undefined);
    const [selectedLevel, setSelectedLevel] = useState<Level | undefined>(undefined);
    const [currentPage, setCurrentPage] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<FormValues>({
        defaultValues: {
            curriculum: "",
            levelId: "",
            listSelectedUnit: [],
        }
    });

    // Data for form
    const levels = selectedCurriculum?.list_level || [];
    const baiList = selectedCurriculum?.list_unit || [];
    const isEditMode = false;

    // Initialize default selections when curriculum data loads
    useEffect(() => {
        if (!selectedCurriculum && curriculum) {
            setSelectedCurriculum(curriculum);
            form.setValue("curriculum", curriculum.id);

            if (curriculum.list_level && curriculum.list_level.length > 0) {
                const defaultLevel = curriculum.list_level[0];
                setSelectedLevel(defaultLevel);
                form.setValue("levelId", defaultLevel.id);
            }
        }
    }, [curriculum, selectedCurriculum, form]);

    // Watch for curriculum changes in form
    useEffect(() => {
        const subscription = form.watch((value, { name }) => {
            if (name === "curriculum" && value.curriculum) {
                const curriculum = curriculums.find(c => c.id === value.curriculum);
                if (curriculum && curriculum.id !== selectedCurriculum?.id) {
                    setSelectedCurriculum(curriculum);
                    // Reset level when curriculum changes
                    setSelectedLevel(undefined);
                    form.setValue("levelId", "");
                }
            }
        });
        return () => subscription.unsubscribe();
    }, [form, curriculums, selectedCurriculum]);

    // Pagination logic
    const itemsPerPage = 10;
    const totalItems = baiList.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const currentItems = baiList.slice(startIndex, endIndex);

    const handleCurriculumChange = () => {
        // CurriculumSelector will update form field via field.onChange
        // We need to listen to form changes to update local state
        const currentCurriculumId = form.watch("curriculum");
        if (currentCurriculumId) {
            const curriculum = curriculums.find(c => c.id === currentCurriculumId);
            if (curriculum) {
                setSelectedCurriculum(curriculum);
                // Reset level when curriculum changes
                setSelectedLevel(undefined);
                form.setValue("levelId", "");
                // Auto-select first level if available
                if (curriculum.list_level && curriculum.list_level.length > 0) {
                    const firstLevel = curriculum.list_level[0];
                    setSelectedLevel(firstLevel);
                    form.setValue("levelId", firstLevel.id);
                }
            }
        }
    };

    const handleLevelChange = (levelId: string) => {
        const level = levels.find(l => l.id === levelId);
        if (level) {
            setSelectedLevel(level);
            form.setValue("levelId", levelId);
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleItemChange = () => {
        // Item change logic here
    };
    const createLessonMutation = useCreateCurriculumCustom();
    const onSubmit = async (data: FormValues) => {
        setIsSubmitting(true);
        try {
            const newData = {
                "name": `${selectedCurriculum?.name || 'Curriculum'} - ${selectedLevel?.name || 'Level'}`,
                "curriculum_original_id": form.getValues("curriculum"),
                "description": `Giáo trình tùy chỉnh từ ${selectedCurriculum?.name}`,
                "level_id": form.getValues("levelId"),
                "list_unit": form.getValues("listSelectedUnit")
            }
            // Handle form submission here
            console.log("Form data:", data);
            // Add your submission logic
            const result = await createLessonMutation.mutateAsync(newData)
            
            // Gọi callback với data đã chọn khi tạo thành công
            if (onSuccess) {
                onSuccess({
                    curriculumCustomId: result.id, // ID của curriculum custom vừa tạo
                    selectedUnits: form.getValues("listSelectedUnit"),
                    curriculum: selectedCurriculum!,
                    level: selectedLevel
                });
            }
            
            // Chỉ đóng modal khi tạo thành công
            onClose();
        } catch (error) {
            console.error("Error submitting form:", error);
            // Không đóng modal khi có lỗi, để user có thể thử lại
        } finally {
            setIsSubmitting(false);
        }
    };

    // Close modal when clicking outside
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="modal fixed inset-0 flex items-center justify-center z-[90]"
            onClick={handleBackdropClick}
        >
            <div className="fixed inset-0 bg-gray-500/75" />
            <div className="modal-content relative flex flex-col z-10 w-[95%] max-w-6xl bg-white rounded-lg shadow-xl overflow-visible">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Chọn sách bạn muốn tạo bài học</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        disabled={isSubmitting}
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-auto">
                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex items-center justify-center py-12">
                            <Loading 
                                message="Đang tải dữ liệu giáo trình..."
                                variant="default"
                            />
                        </div>
                    )}

                    {/* Error State */}
                    {error && !isLoading && (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <p className="text-red-600 mb-2">Lỗi tải dữ liệu</p>
                                <p className="text-gray-500 text-sm">{error.message}</p>
                            </div>
                        </div>
                    )}

                    {/* Form Content - Only show when data is loaded */}
                    {!isLoading && !error && (
                        <FormProvider {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 flex flex-col h-full">
                                {/* Submitting Overlay */}
                                {isSubmitting && (
                                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-50 rounded-lg">
                                        <Loading 
                                            message="Đang tạo giáo trình..."
                                            variant="default"
                                        />
                                    </div>
                                )}
                                <div className="flex-none space-y-3">

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
                                    originalSelectedRef={{ current: [] }}
                                    isEditMode={isEditMode}
                                    onPageChange={handlePageChange}
                                    onItemChange={handleItemChange}
                                />

                                <div className="flex-none pt-4 border-t border-gray-200">
                                    <SubmitButton isSubmitting={isSubmitting} isEditMode={isEditMode} />
                                </div>
                            </form>
                        </FormProvider>
                    )}
                </div>
            </div>
        </div>
    );
}
