"use client"

import { Button } from "@/components/ui/button"
import { TopNavigationProps } from "./types"

export default function TopNavigation({ 
  isEditMode, 
  onNavigateToLessonManagement 
}: TopNavigationProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">
            {isEditMode ? "Sửa giáo trình tùy chỉnh" : "Tạo giáo trình tùy chỉnh"}
          </h1>
          <Button 
            className="bg-blue-500 text-white cursor-pointer" 
            onClick={onNavigateToLessonManagement} 
            variant="outline"
          >
            Quản lý bài học
          </Button>
        </div>
      </div>
    </nav>
  )
}