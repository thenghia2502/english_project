"use client"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { FormValues, Unit } from "@/lib/types"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import Loading from "@/components/ui/loading"
import ErrorHandler from "@/components/ui/error-handler"

export default function TaoDanhSachTu() {
    const [curriculums, setCurriculums] = useState<{ id: string, title: string }[]>([])
    const [curriculum, setCurriculum] = useState<{
        id: string,
        title: string,
        levels: {
            id: string,
            name: string,
            units?: Unit[]
        }[]
    } | undefined>()
    const [formValues, setFormValues] = useState<FormValues>({
        name: "",
        curriculum: "",
        level: "",
        selectedBai: [],
    })
    const [isLoading, setIsLoading] = useState(true) // ✅ Đổi từ false thành true như taokhoahoc
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null) // ✅ Thêm error state
    const [isEditMode, setIsEditMode] = useState(false) // ✅ Trạng thái chế độ sửa
    const [editingLessonId, setEditingLessonId] = useState<string | null>(null) // ✅ ID bài học đang sửa
    const router = useRouter()
    const searchParams = useSearchParams()
    const form = useForm<FormValues>({ defaultValues: formValues })
    const [baiList, setBaiList] = useState<Unit[]>([]) // ✅ Thay đổi từ string[] thành Unit[]
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true)
                setError(null) // ✅ Reset error state
                
                const ar = await fetch("/api/curriculum")
                
                if (!ar.ok) {
                    throw new Error("Failed to fetch curriculums")
                }
                
                const data = await ar.json()
                setCurriculums(data)
                
                // ✅ Kiểm tra chế độ sửa từ URL params hoặc sessionStorage
                const modeFromUrl = searchParams.get('mode')
                const idFromUrl = searchParams.get('id')
                console.log('Mode from URL:', modeFromUrl)
                console.log('ID from URL:', idFromUrl)
                
                // Kiểm tra sessionStorage trước, sau đó mới kiểm tra URL params (backward compatibility)
                let editData = null
                if (modeFromUrl === 'edit') {
                    const storedData = sessionStorage.getItem('editLessonData')
                    console.log('Stored data from sessionStorage:', storedData)
                    if (storedData) {
                        try {
                            editData = JSON.parse(storedData)
                            console.log('Parsed edit data:', editData)
                            // Xóa dữ liệu sau khi sử dụng để tránh conflict
                            sessionStorage.removeItem('editLessonData')
                        } catch (e) {
                            console.error('Error parsing stored edit data:', e)
                        }
                    } else {
                        console.log('No stored data found in sessionStorage')
                        
                        // Fallback: nếu có ID từ URL, fetch data từ API
                        if (idFromUrl) {
                            console.log('Fetching lesson data from API for ID:', idFromUrl)
                            try {
                                const lessonRes = await fetch(`/api/danhsachtu?format=names`)
                                if (lessonRes.ok) {
                                    const allLessons = await lessonRes.json()
                                    const targetLesson = allLessons.find((lesson: {id: string, id_curriculum: string, id_level: string, name: string, list_exercise: string[]}) => lesson.id === idFromUrl)
                                    if (targetLesson) {
                                        editData = {
                                            id: targetLesson.id,
                                            curriculum: targetLesson.id_curriculum,
                                            level: targetLesson.id_level,
                                            name: targetLesson.name,
                                            exercises: targetLesson.list_exercise
                                        }
                                        console.log('Fetched edit data from API:', editData)
                                    }
                                }
                            } catch (error) {
                                console.error('Error fetching lesson data:', error)
                            }
                        }
                    }
                }
                
                // Fallback: kiểm tra URL params (để tương thích ngược)
                if (!editData) {
                    const editId = searchParams.get('edit')
                    const curriculumIdFromUrl = searchParams.get('curriculum')
                    const levelIdFromUrl = searchParams.get('level')
                    const nameFromUrl = searchParams.get('name')
                    const exercisesFromUrl = searchParams.get('exercises')
                    
                    if (editId && curriculumIdFromUrl && levelIdFromUrl && nameFromUrl && exercisesFromUrl) {
                        editData = {
                            id: editId,
                            curriculum: curriculumIdFromUrl,
                            level: levelIdFromUrl,
                            name: decodeURIComponent(nameFromUrl),
                            exercises: JSON.parse(decodeURIComponent(exercisesFromUrl))
                        }
                    }
                }
                
                if (editData) {
                    // Chế độ sửa
                    console.log('Entering edit mode with data:', editData)
                    setIsEditMode(true)
                    setEditingLessonId(editData.id)
                    
                    try {
                        // Fetch curriculum details
                        const res = await fetch(`/api/curriculum/${editData.curriculum}`)
                        if (!res.ok) {
                            throw new Error("Failed to fetch curriculum details")
                        }
                        
                        const curriculumData = await res.json()
                        console.log('Fetched curriculum data:', curriculumData)
                        setCurriculum(curriculumData)
                        
                        // Cập nhật danh sách bài học từ level được chọn
                        const selectedLevel = curriculumData.levels?.find((l: { id: string, name: string, units?: Unit[] }) => l.id === editData.level)
                        const units = selectedLevel?.units || []
                        console.log('Selected level:', selectedLevel)
                        console.log('Units in level:', units)
                        setBaiList(units)
                        
                        // Chuyển đổi tên bài tập thành IDs để phù hợp với selectedBai
                        const selectedIds = editData.exercises.map((exerciseName: string) => {
                            const unit = units.find((u: Unit) => u.name === exerciseName)
                            console.log(`Looking for unit with name "${exerciseName}":`, unit)
                            return unit ? unit.id : exerciseName
                        })
                        console.log('Converted exercise names to IDs:', selectedIds)
                        
                        // Set form values cho chế độ sửa
                        const editValues = {
                            name: editData.name,
                            curriculum: editData.curriculum,
                            level: editData.level,
                            selectedBai: selectedIds,
                        }
                        console.log('Setting form values:', editValues)
                        setFormValues(editValues)
                        
                        // Cập nhật form
                        form.reset(editValues)
                        
                    } catch (parseError) {
                        console.error("Error processing edit data:", parseError)
                        setError("Dữ liệu sửa không hợp lệ!")
                    }
                } else {
                    // Chế độ tạo mới (logic cũ)
                    const curriculumIdFromUrl = searchParams.get('curriculum')
                    const targetCurriculumId = curriculumIdFromUrl || data[0]?.id
                    
                    if (targetCurriculumId && data.length > 0) {
                        const res = await fetch(`/api/curriculum/${targetCurriculumId}`)
                        
                        if (!res.ok) {
                            throw new Error("Failed to fetch curriculum details")
                        }
                        
                        const curriculumData = await res.json()
                        setCurriculum(curriculumData)
                        
                        const targetCurriculum = data.find((c: { id: string, title: string }) => c.id === targetCurriculumId) || data[0]
                        const firstLevel = curriculumData.levels?.[0]
                        console.log("Target Curriculum:", targetCurriculum)
                        console.log("First Level:", firstLevel)
                        
                        const newValues = {
                            curriculum: targetCurriculumId,
                            level: firstLevel?.id || "",
                            selectedBai: [],
                            name: "" // ✅ Thêm trường name vào formValues
                        }
                        setFormValues(newValues)

                        // ✅ Cập nhật danh sách bài học từ units của level đầu tiên
                        const units = firstLevel?.units || [];
                        setBaiList(units)

                        // ✅ Cập nhật form values
                        form.reset(newValues)
                    }
                }
            } catch (error) {
                console.error("Error fetching data:", error)
                setError("Có lỗi khi tải dữ liệu. Vui lòng thử lại!")
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [searchParams, form])

    // ✅ Fetch curriculum chi tiết khi curriculum được chọn (chỉ từ form reset hoặc load đầu tiên)
    useEffect(() => {
        const fetchCurriculum = async () => {
            if (formValues.curriculum && !curriculum) { // ✅ Chỉ fetch khi chưa có curriculum data
                try {
                    const res = await fetch(`/api/curriculum/${formValues.curriculum}`)
                    
                    if (!res.ok) {
                        throw new Error("Failed to fetch curriculum details")
                    }
                    
                    const data = await res.json()
                    setCurriculum(data)
                } catch (error) {
                    console.error("Error fetching curriculum:", error)
                    setError("Có lỗi khi tải thông tin giáo trình!")
                }
            }
        }
        fetchCurriculum()
    }, [formValues.curriculum, curriculum])

    const onSubmit = useCallback(async (data: FormValues) => {
        try {
            setIsSubmitting(true)
            console.log(data)
            
            // Validation
            if (!data.name.trim()) {
                alert("Vui lòng nhập tên danh sách từ")
                return
            }
            
            if (!data.curriculum || !data.level) {
                alert("Vui lòng chọn giáo trình và trình độ")
                return
            }
            
            if (data.selectedBai.length === 0) {
                alert("Vui lòng chọn ít nhất một bài học")
                return
            }
            
            if (isEditMode && editingLessonId) {
                // Chế độ sửa - Chuyển đổi IDs thành names cho API
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
                
                const response = await fetch("/api/danhsachtu", {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(updateData),
                })
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`)
                }
                
                const result = await response.json()
                console.log("Success:", result)
                alert("Cập nhật danh sách từ thành công!")
            } else {
                // Chế độ tạo mới - Chuyển đổi IDs thành names cho API
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
                
                const response = await fetch("/api/danhsachtu", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(newData),
                })
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`)
                }
                
                const result = await response.json()
                console.log("Success:", result)
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
    }, [router, isEditMode, editingLessonId, baiList])

    return (
        <div className="min-h-screen bg-gray-100 overflow-x-hidden">
            {/* Fixed Top Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-bold text-gray-900">
                            {isEditMode ? "Sửa danh sách từ" : "Tạo danh sách từ"}
                        </h1>
                        <Button onClick={() => router.push("/quanlykhoahoc")} variant="outline">
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
                <div className="bg-white rounded-lg shadow-md w-full p-6 mt-6 mb-3  flex flex-col">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 flex flex-col h-full">
                            <div className="flex-none space-y-6">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-base font-medium">Tên danh sách từ</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    {...field} 
                                                    placeholder="Nhập tên danh sách từ..."
                                                    className="w-full"
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
                                                    <FormLabel className="text-base font-medium">Giáo trình</FormLabel>
                                                    <FormControl>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="outline" className="w-full justify-between">
                                                                    {selectedCurriculum?.title || "Chọn giáo trình"}
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="start" className="w-full bg-white">
                                                                {curriculums.map((cur) => (
                                                                    <DropdownMenuItem
                                                                        key={cur.id}
                                                                        onSelect={() => {
                                                                            field.onChange(cur.id)
                                                                            setFormValues(prev => ({
                                                                                ...prev,
                                                                                curriculum: cur.id,
                                                                                level: "" // Reset level khi đổi curriculum
                                                                            }))

                                                                            // ✅ Reset baiList và form khi đổi curriculum
                                                                            setBaiList([])
                                                                            form.setValue('level', '')
                                                                            form.setValue('selectedBai', [])
                                                                            setCurriculum(undefined) // ✅ Reset curriculum details
                                                                            
                                                                            // ✅ Fetch curriculum details ngay lập tức
                                                                            const fetchCurriculumDetails = async () => {
                                                                                try {
                                                                                    const res = await fetch(`/api/curriculum/${cur.id}`)
                                                                                    if (!res.ok) {
                                                                                        throw new Error("Failed to fetch curriculum details")
                                                                                    }
                                                                                    const data = await res.json()
                                                                                    setCurriculum(data)
                                                                                } catch (error) {
                                                                                    console.error("Error fetching curriculum:", error)
                                                                                    setError("Có lỗi khi tải thông tin giáo trình!")
                                                                                }
                                                                            }
                                                                            fetchCurriculumDetails()
                                                                        }}
                                                                    >
                                                                        {cur.title}
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
                                        control={form.control}
                                        name="level"
                                        render={({ field }) => {
                                            const selectedLevel = curriculum?.levels?.find(l => l.id === field.value)
                                            return (
                                                <FormItem className="flex-1">
                                                    <FormLabel className="text-base font-medium">Trình độ</FormLabel>
                                                    <FormControl>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="outline" className="w-full justify-between">
                                                                    {selectedLevel?.name || "Chọn trình độ"}
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="start" className="w-full bg-white">
                                                                {curriculum?.levels?.map((level) => (
                                                                    <DropdownMenuItem
                                                                        key={level.id}
                                                                        onSelect={() => {
                                                                            field.onChange(level.id)
                                                                            setFormValues(prev => ({
                                                                                ...prev,
                                                                                level: level.id
                                                                            }))

                                                                            // ✅ Cập nhật baiList khi chọn level mới
                                                                            const selectedLevel = curriculum?.levels?.find(l => l.id === level.id)
                                                                            const newBaiList = selectedLevel?.units || []
                                                                            setBaiList(newBaiList)

                                                                            // ✅ Reset selectedBai khi đổi level
                                                                            form.setValue('selectedBai', [])
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
                                <p className="text-base font-medium mb-4 flex-none">Chọn bài học ({baiList.length} bài)</p>
                                {baiList.length === 0 ? (
                                    <div className="flex-1 flex items-center justify-center text-gray-500">
                                        <p>Vui lòng chọn giáo trình và trình độ để xem danh sách bài học</p>
                                    </div>
                                ) : (
                                    <div className="flex-1  min-h-0">
                                        <div className="h-full overflow-y-auto grid grid-cols-4 gap-3">
                                            {baiList.map((bai) => (
                                                <FormField
                                                    key={bai.id}
                                                    control={form.control}
                                                    name="selectedBai"
                                                    render={({ field }) => {
                                                        const value: string[] = Array.isArray(field.value) ? field.value : []

                                                        const isChecked = value.includes(bai.id)

                                                        const handleChange = (checked: boolean) => {
                                                            if (checked) {
                                                                field.onChange([...value, bai.id])
                                                            } else {
                                                                field.onChange(value.filter((v) => v !== bai.id))
                                                            }
                                                        }

                                                        return (
                                                            <FormItem 
                                                                className="flex items-center hover:bg-blue-50 rounded-md p-3 cursor-pointer transition-colors border border-gray-200"
                                                            >
                                                                <FormControl>
                                                                    <Checkbox
                                                                        checked={isChecked}
                                                                        onCheckedChange={handleChange}
                                                                        className="mb-0 mr-0 cursor-pointer"
                                                                        onClick={(e) => e.stopPropagation()} // Ngăn double trigger
                                                                    />
                                                                </FormControl>
                                                                <FormLabel className="flex-1 ml-3 mb-0 cursor-pointer text-sm font-medium">
                                                                    {bai.name}
                                                                </FormLabel>
                                                            </FormItem>
                                                        )
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Nút gửi - Fixed ở dưới */}
                            <div className="flex-none flex justify-end pt-4 border-t bg-white">
                                <Button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    className="hover:bg-green-400 hover:text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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