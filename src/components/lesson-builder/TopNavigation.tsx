"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface TopNavigationProps {
    isEditMode: boolean
}

export default function TopNavigation({ isEditMode }: TopNavigationProps) {
    const router = useRouter()

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
            <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold text-gray-900">
                        {isEditMode ? "Chỉnh sửa bài học" : "Tạo bài học"}
                    </h1>
                    <Button 
                        className="bg-blue-600 text-white" 
                        onClick={() => router.push("/quanlybaihoc")} 
                        variant="outline"
                    >
                        Quản lý bài học
                    </Button>
                </div>
            </div>
        </nav>
    )
}