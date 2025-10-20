"use client"

import React from 'react'
import { CurriculumOriginalList, SearchInput } from '@/components/curriculum-original'
import TopNavigation from '@/components/curriculum-original/TopNavigation'
import { useCurriculumOriginalManagement } from '@/components/curriculum-original/useCurriculumOriginalManagement'
import Loading from '@/components/ui/loading'

export default function CurriculumOriginalManagementPage() {
    // Use the management hook which handles all logic including pagination
    const {
        isLoading,
        error,
        curriculums,
        stats,
        currentPage,
        pageSize,
        totalPages,
        handlePageChange,
        handleSearch,
        searchTerm
    } = useCurriculumOriginalManagement()

    if (isLoading) {
        return (
            <Loading
                message="Đang tải danh sách giáo trình..."
                variant="full-page"
                className='bg-gray-100'
            />
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-red-600 mb-2">Lỗi tải dữ liệu</h2>
                    <p className="text-gray-600">{error.message}</p>
                </div>
            </div>
        )
    }

    // Create pagination data structure for CurriculumOriginalList
    const paginationData = {
        items: curriculums,
        total: stats.total || 0,
        page: currentPage,
        limit: pageSize,
        totalPages: totalPages
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <TopNavigation />
            <div className="pt-20 px-6">
                <div className="mb-2">
                    <p className="text-gray-600 ">
                        Quản lý và tổ chức các giáo trình gốc trong hệ thống
                    </p>
                    <div className="mt-2 text-sm text-gray-500">
                        Tổng cộng: {stats.total} giáo trình 
                    </div>
                </div>
                <SearchInput
                    searchTerm={searchTerm}
                    onSearchChange={handleSearch}
                    placeholder="Tìm kiếm giáo trình..."
                />
                <CurriculumOriginalList
                    curriculumOriginal={paginationData}
                    searchQuery={searchTerm}
                    serverPaginated={true}
                    routerPush={(path: string) => window.location.href = path}
                    onPageChange={handlePageChange}
                />
            </div>
        </div>
    )
}