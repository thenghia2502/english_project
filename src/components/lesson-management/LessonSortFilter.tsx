"use client"

import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { Funnel } from "lucide-react"
import { LessonSortFilterProps } from "./types"

export default function LessonSortFilter({
    sortBy,
    searchText,
    onSortChange,
    onSearchChange,
    hasResults
}: LessonSortFilterProps) {
    return (
        <div className="mb-5 space-y-2">
            <div className="flex items-center m-2 text-gray-900">
                <Label className="w-[100px] text-lg">Tìm kiếm: </Label>
                <Input
                    type="text"
                    placeholder="Nhập tên khóa học..."
                    className="border-gray-300 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>
            
            <div className={`relative p-2 ${(searchText && !hasResults) ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex flex-row space-x-8 p-6 border rounded-md border-gray-300">
                    {/* Container Ngày tạo */}
                    <div className="flex flex-col space-y-3">
                        <h4 className="text-sm font-semibold text-gray-700">Ngày tạo</h4>
                        <RadioGroup value={sortBy} onValueChange={onSortChange} className="flex flex-col space-y-2 text-gray-900">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <RadioGroupItem value="date-desc" id="date-desc" />
                                <span className="text-sm">Mới đến cũ</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <RadioGroupItem value="date-asc" id="date-asc" />
                                <span className="text-sm">Cũ đến mới</span>
                            </label>
                        </RadioGroup>
                    </div>

                    {/* Container Tiến độ */}
                    <div className="flex flex-col space-y-3">
                        <h4 className="text-sm font-semibold text-gray-700">Tiến độ</h4>
                        <RadioGroup value={sortBy} onValueChange={onSortChange} className="flex flex-col space-y-2 text-gray-900">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <RadioGroupItem value="progress-desc" id="progress-desc" />
                                <span className="text-sm">Giảm dần</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <RadioGroupItem value="progress-asc" id="progress-asc" />
                                <span className="text-sm">Tăng dần</span>
                            </label>
                        </RadioGroup>
                    </div>
                </div>

                <div className="absolute top-0 left-0 flex pr-2 pb-1 bg-[#f3f4f6] text-gray-900">
                    <Funnel className="bg-[#f3f4f6] w-4 h-4" />
                    <span className="text-sm bg-[#f3f4f6]">Sắp xếp</span>
                </div>
            </div>
        </div>
    )
}