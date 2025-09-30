"use client"

import { FormHeaderProps } from "./types"

export default function FormHeader({ isEditMode }: FormHeaderProps) {
  return (
    <div className="mb-3">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        {isEditMode ? 'Chỉnh sửa danh sách bài học' : 'Tạo danh sách bài học mới'}
      </h1>
    </div>
  )
}