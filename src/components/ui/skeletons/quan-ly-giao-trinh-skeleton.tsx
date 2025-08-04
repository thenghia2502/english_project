import React from 'react'
import { Card, CardContent, CardHeader } from "@/components/ui/card"

interface QuanLyGiaoTrinhSkeletonProps {
  className?: string
}

export function QuanLyGiaoTrinhSkeleton({ className = "" }: QuanLyGiaoTrinhSkeletonProps) {
  return (
    <div className={`pt-20 px-6 pb-6 min-h-screen bg-gray-100 ${className}`}>
      <div className="mx-auto animate-pulse">
        {/* Header Section */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="h-8 bg-gray-300 rounded w-80 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-60"></div>
          </div>
          {/* Search Bar Skeleton */}
          <div className="relative w-80">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <div className="h-4 w-4 bg-gray-300 rounded"></div>
            </div>
            <div className="h-10 bg-gray-200 rounded-lg w-full pl-10"></div>
          </div>
        </div>

        {/* Curriculum Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-white shadow-sm border border-gray-200">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="h-6 bg-gray-300 rounded w-48"></div>
                  <div className="h-8 w-8 bg-gray-200 rounded"></div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {/* Stats skeleton */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <div className="h-4 w-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-4 w-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-12"></div>
                  </div>
                  
                  {/* Description skeleton */}
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                  
                  {/* Levels skeleton */}
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-24"></div>
                    <div className="flex flex-wrap gap-1">
                      {[1, 2, 3].map((j) => (
                        <div key={j} className="h-5 bg-gray-200 rounded-full w-16"></div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Date skeleton */}
                  <div className="flex items-center justify-between">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </div>
                  
                  {/* Button skeleton */}
                  <div className="h-9 bg-gray-300 rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Lesson Lists Section */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="h-8 bg-gray-300 rounded w-72 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-80"></div>
          </div>
          {/* Search Bar Skeleton */}
          <div className="relative w-80">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <div className="h-4 w-4 bg-gray-300 rounded"></div>
            </div>
            <div className="h-10 bg-gray-200 rounded-lg w-full pl-10"></div>
          </div>
        </div>

        {/* Lesson Cards by Curriculum */}
        <div className="space-y-8">
          {[1].map((curriculumIndex) => (
            <div key={curriculumIndex}>
              {/* Curriculum Title */}
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="h-6 bg-gray-300 rounded w-64 mb-1"></div>
                  <div className="h-4 bg-gray-200 rounded w-48"></div>
                </div>
              </div>
              
              {/* Lesson Cards Grid */}
              <div className="grid grid-cols-4 gap-4 mb-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="bg-white shadow-sm border border-gray-200 h-fit">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="h-5 bg-gray-300 rounded w-32"></div>
                        <div className="h-4 w-4 bg-gray-200 rounded"></div>
                      </div>
                    </CardHeader>
                    <CardContent className="">
                      <div className="space-y-3">
                        {/* Badge skeleton */}
                        <div className="h-5 bg-gray-200 rounded-full w-20"></div>
                        
                        {/* Exercise count skeleton */}
                        <div className="flex items-center gap-1">
                          <div className="h-4 w-4 bg-gray-200 rounded"></div>
                          <div className="h-4 bg-gray-200 rounded w-16"></div>
                        </div>
                        
                        {/* Exercise list skeleton */}
                        <div className="space-y-1">
                          <div className="h-3 bg-gray-200 rounded w-24"></div>
                          <div className="h-3 bg-gray-200 rounded w-full"></div>
                          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        </div>
                        
                        {/* Buttons skeleton */}
                        <div className="flex gap-2 mt-4">
                          <div className="h-7 bg-gray-300 rounded flex-1"></div>
                          <div className="h-7 bg-gray-300 rounded flex-1"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Navigation dots skeleton */}
              <div className="flex justify-center gap-2">
                {[1, 2, 3].map((dot) => (
                  <div key={dot} className="w-2 h-2 bg-gray-300 rounded-full"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Loading indicator at bottom */}
      <div className="flex justify-center py-4">
        <div className="flex items-center space-x-2 text-gray-500">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-500"></div>
          <span className="text-sm">Đang tải danh sách giáo trình...</span>
        </div>
      </div>
    </div>
  )
}

export default QuanLyGiaoTrinhSkeleton
