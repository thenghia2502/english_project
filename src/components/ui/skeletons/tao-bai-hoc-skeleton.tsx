import React from 'react'
import { Card, CardContent, CardHeader } from "@/components/ui/card"

interface TaoBaiHocSkeletonProps {
  className?: string
}

export function TaoBaiHocSkeleton({ className = "" }: TaoBaiHocSkeletonProps) {
  return (
    <div className={`min-h-screen bg-gray-100 ${className}`}>
      <div className="pt-20 h-screen flex">
        {/* Left Panel - Word Selection Skeleton */}
        <div className="w-1/3 bg-gray-100 border-r border-gray-300 overflow-y-auto">
          <div className="p-6 animate-pulse">
            <div className="h-6 bg-gray-300 rounded w-40 mb-6"></div>
            
            {/* Filter Card Skeleton */}
            <div className="mb-6">
              <Card className="bg-white shadow-sm border border-gray-200">
                <CardHeader className="pb-4">
                  <div className="h-5 bg-gray-300 rounded w-20"></div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-5">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="space-x-1 flex items-center">
                        <div className="h-4 bg-gray-200 rounded w-12"></div>
                        <div className="h-4 w-4 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lesson Tables Skeleton */}
            {[1, 2].map((lessonIndex) => (
              <div key={lessonIndex} className="mb-6 bg-white rounded-lg">
                <div className="text-center p-2">
                  <div className="h-5 bg-gray-300 rounded w-24 mx-auto"></div>
                </div>
                
                {/* Table Header */}
                <div className="border-t border-b bg-gray-50 p-3">
                  <div className="flex space-x-4">
                    <div className="h-4 bg-gray-300 rounded w-16"></div>
                    <div className="h-4 bg-gray-300 rounded w-24"></div>
                    <div className="h-4 bg-gray-300 rounded w-20"></div>
                    <div className="h-4 bg-gray-300 rounded w-12"></div>
                    <div className="h-4 bg-gray-300 rounded w-4"></div>
                  </div>
                </div>
                
                {/* Table Rows */}
                <div className="divide-y">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="p-3">
                      <div className="flex items-center space-x-4">
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                        <div className="h-4 bg-gray-200 rounded w-8"></div>
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                        <div className="h-4 w-4 bg-gray-200 rounded"></div>
                        <div className="h-4 w-4 bg-gray-200 rounded"></div>
                      </div>
                      
                      {/* Sub-rows for expanded words */}
                      {i <= 2 && (
                        <div className="ml-6 mt-2 space-y-2">
                          {[1, 2].map((j) => (
                            <div key={j} className="flex items-center space-x-4 bg-gray-50 p-2 rounded">
                              <div className="h-3 bg-gray-200 rounded w-16"></div>
                              <div className="h-3 bg-gray-200 rounded w-6"></div>
                              <div className="h-3 bg-gray-200 rounded w-24"></div>
                              <div className="h-3 w-3 bg-gray-200 rounded"></div>
                              <div className="h-3 w-3 bg-gray-200 rounded"></div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Middle Panel - Action Control Skeleton */}
        <div className="flex flex-col items-center justify-center mx-4 animate-pulse">
          <div className="text-center">
            <div className="h-12 bg-gray-300 rounded-lg w-28 mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </div>
        </div>

        {/* Right Panel - Course Building Skeleton */}
        <div className="flex-1 border-l border-gray-300 bg-gray-100 overflow-y-auto">
          <div className="p-6 animate-pulse">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div className="h-6 bg-gray-300 rounded w-48"></div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-9 bg-gray-200 rounded w-48"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-40"></div>
                <div className="h-12 bg-gray-300 rounded-lg w-32"></div>
              </div>
            </div>

            {/* Course Table Skeleton */}
            <Card className="bg-white shadow-sm border border-gray-200">
              <CardContent className="p-0">
                {/* Table Header */}
                <div className="bg-gray-50 border-b border-gray-200 p-4">
                  <div className="grid grid-cols-8 gap-4">
                    <div className="h-4 bg-gray-300 rounded w-full"></div>
                    <div className="h-4 bg-gray-300 rounded w-full"></div>
                    <div className="h-4 bg-gray-300 rounded w-full"></div>
                    <div className="h-4 bg-gray-300 rounded w-full"></div>
                    <div className="h-4 bg-gray-300 rounded w-full"></div>
                    <div className="h-4 bg-gray-300 rounded w-full"></div>
                    <div className="h-4 bg-gray-300 rounded w-full"></div>
                    <div className="h-4 bg-gray-300 rounded w-4"></div>
                  </div>
                </div>
                
                {/* Table Rows */}
                <div className="divide-y">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="p-4">
                      <div className="grid grid-cols-8 gap-4 items-center">
                        <div className="flex-1">
                          <div className="h-5 bg-gray-300 rounded w-full mb-1"></div>
                          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        </div>
                        <div className="h-9 bg-gray-200 rounded w-full"></div>
                        <div className="h-9 bg-gray-200 rounded w-full"></div>
                        <div className="h-9 bg-gray-200 rounded w-full"></div>
                        <div className="h-9 bg-gray-200 rounded w-full"></div>
                        <div className="h-9 bg-gray-200 rounded w-full"></div>
                        <div className="flex items-center space-x-2">
                          <div className="h-9 bg-gray-200 rounded w-12"></div>
                          <div className="h-4 bg-gray-200 rounded w-8"></div>
                        </div>
                        <div className="h-8 w-8 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Loading indicator at bottom */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <div className="flex items-center space-x-2 text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-500"></div>
          <span className="text-sm">Đang tải dữ liệu...</span>
        </div>
      </div>
    </div>
  )
}

export default TaoBaiHocSkeleton
