"use client"

import { Button } from "@/components/ui/button"
import { TopNavigationProps } from "./types"

export default function TopNavigation({ onNavigateToManagement }: TopNavigationProps) {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
            <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold text-gray-900">Quản lý bài học</h1>
                    <Button 
                        onClick={onNavigateToManagement} 
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        Quản lý Giáo trình
                    </Button>
                </div>
            </div>
        </nav>
    )
}