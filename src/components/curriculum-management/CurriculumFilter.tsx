"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

interface CurriculumFilterProps {
    curriculums: Array<{ id: string; name: string; description?: string }>
    selectedOriginalIds: string[] | undefined
    setSelectedOriginalIds: React.Dispatch<React.SetStateAction<string[] | undefined>>
    onApplyFilter: () => void
    onClearFilter: () => void
}

export default function CurriculumFilter({
    curriculums,
    selectedOriginalIds,
    setSelectedOriginalIds,
    onApplyFilter,
    onClearFilter
}: CurriculumFilterProps) {
    const isAllSelected = Array.isArray(selectedOriginalIds) && selectedOriginalIds.length === curriculums.length

    return (
        <div className="bg-white p-6 rounded-xl mb-6 border border-gray-200 shadow-sm text-gray-900">
            <div className="flex items-center justify-between mb-4">
                <Label htmlFor="select-all" className="flex items-center space-x-2">
                    <Checkbox 
                        id="select-all" 
                        checked={isAllSelected}
                        onCheckedChange={(checked) => {
                            const isChecked = checked === true
                            setSelectedOriginalIds(isChecked ? curriculums.map(c => c.id) : undefined)
                        }} 
                    />
                    <span className="text-sm font-medium">Chọn tất cả ({curriculums.length})</span>
                </Label>
                <div className="text-sm text-gray-600">{curriculums.length} mục</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {curriculums.length === 0 ? (
                    <div className="col-span-full text-sm text-gray-500">Không có giáo trình</div>
                ) : (
                    curriculums.map(co => (
                        <div key={co.id} className="p-3 border border-gray-300 rounded-md hover:shadow-sm bg-white">
                            <Label htmlFor={`select-${co.id}`} className="flex items-center space-x-3">
                                <Checkbox 
                                    id={`select-${co.id}`} 
                                    checked={Array.isArray(selectedOriginalIds) ? selectedOriginalIds.includes(co.id) : false} 
                                    onCheckedChange={(checked) => {
                                        const isChecked = checked === true
                                        setSelectedOriginalIds(prev => {
                                            const prevArr = Array.isArray(prev) ? prev : []
                                            if (isChecked) {
                                                return Array.from(new Set([...prevArr, co.id]))
                                            }
                                            return prevArr.filter(x => x !== co.id)
                                        })
                                    }} 
                                />
                                <div>
                                    <div className="text-sm font-semibold text-gray-900">{co.name}</div>
                                    {co.description && (
                                        <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                                            {co.description}
                                        </div>
                                    )}
                                </div>
                            </Label>
                        </div>
                    ))
                )}
            </div>
            
            <div className="flex gap-2">
                <Button 
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white w-[7.5rem]" 
                    onClick={onApplyFilter}
                >
                    Lọc
                </Button>
                <Button 
                    variant="outline" 
                    className="mt-4 w-[7.5rem]" 
                    onClick={onClearFilter}
                >
                    Xóa bộ lọc
                </Button>
            </div>
        </div>
    )
}