import React from 'react'

interface TaoDanhSachBaiHocSkeletonProps {
    className?: string
}

export function TaoDanhSachBaiHocSkeleton({ className = "" }: TaoDanhSachBaiHocSkeletonProps) {
    return (
        <div className={`px-4 min-h-screen bg-gray-100 ${className}`}>
            <div className="w-full pt-20 min-h-screen">
                <div className=" animate-pulse">

                    {/* Main Content Card */}
                    <div className='w-full bg-white shadow-lg rounded-lg p-6'>
                        {/* Form Section */}
                        <div className="mb-8">
                            {/* Description Field */}
                            <div className="mb-6">
                                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                                <div className="h-10 bg-gray-100 rounded w-full border border-gray-200"></div>
                            </div>
                            {/* Form Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                {/* Name Field */}
                                <div>
                                    <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                                    <div className="h-10 bg-gray-100 rounded w-full border border-gray-200"></div>
                                </div>

                                {/* Category Field */}
                                <div>
                                    <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                                    <div className="h-10 bg-gray-100 rounded w-full border border-gray-200"></div>
                                </div>
                            </div>


                        </div>

                        {/* Word List Section */}   
                        <div className="w-full border border-gray-200  rounded-md">
                            <div className='m-4'>
                                <div className="flex items-center justify-between mb-6">
                                    <div className="h-6 bg-gray-300 rounded w-36"></div>
                                </div>

                                {/* Word Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {Array.from({ length: 40 }, (_, index) => (
                                        <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                            {/* Word Item */}
                                            <div className="flex items-center space-x-3">
                                                <div className="h-4 w-4 bg-gray-200 rounded"></div>
                                                <div className="flex-1">
                                                    <div className="h-4 bg-gray-300 rounded w-16 mb-1"></div>

                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {/* Action Buttons */}
                                <div className="flex justify-end space-x-4 mt-8">
                                    <div className="h-10 bg-gray-300 rounded w-32"></div>
                                </div>
                            </div>

                        </div>
                    </div>


                </div>
            </div>

            {/* Loading indicator */}
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
                <div className="flex items-center space-x-2 text-gray-500 bg-white px-4 py-2 rounded-full shadow-lg">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-500"></div>
                    <span className="text-sm">Đang tải danh sách từ vựng...</span>
                </div>
            </div>
        </div>
    )
}

export default TaoDanhSachBaiHocSkeleton
