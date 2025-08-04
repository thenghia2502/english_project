import React from 'react'
import { Card, CardContent } from "@/components/ui/card"

interface VocabTrainerSkeletonProps {
  className?: string
}

export function VocabTrainerSkeleton({ className = "" }: VocabTrainerSkeletonProps) {
  return (
    <div className={`mx-auto min-h-[52rem] px-4 py-8 sm:px-6 lg:px-8 flex flex-col space-y-5 ${className}`}>
      {/* Loading Controls */}
      <div className="mb-6 flex justify-between animate-pulse">
        <div className="flex space-x-6">
          {/* Checkbox skeleton */}
          <div className="flex items-center space-x-2">
            <div className="h-4 w-4 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded w-24"></div>
          </div>
          {/* Radio buttons skeleton */}
          <div className="flex space-x-4">
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 bg-gray-300 rounded-full"></div>
              <div className="h-4 bg-gray-300 rounded w-6"></div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 bg-gray-300 rounded-full"></div>
              <div className="h-4 bg-gray-300 rounded w-6"></div>
            </div>
          </div>
        </div>
        {/* Button skeleton */}
        <div className="h-10 bg-gray-300 rounded-full w-24"></div>
      </div>

      {/* Main Vocabulary Card */}
      <Card className="border-none shadow-lg bg-white relative">
        <CardContent className="p-6 h-fit">
          {/* Progress indicator skeleton */}
          <div className="absolute top-4 left-4 h-6 w-8 bg-gray-300 rounded animate-pulse"></div>
          
          <div className="mb-6 flex items-center justify-center bg-gray-100 rounded-lg p-4 h-[30rem]">
            <div className="text-center animate-pulse">
              {/* Large vocabulary text skeleton - không có spinner */}
              <div className="space-y-4">
                <div className="h-20 bg-gray-300 rounded w-80 mx-auto"></div>
                <div className="h-16 bg-gray-200 rounded w-60 mx-auto"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vocabulary Table Skeleton */}
      <div className="rounded-lg border border-gray-200 overflow-hidden animate-pulse">
        {/* Table Header */}
        <div className="bg-gray-50 p-4 border-b">
          <div className="flex space-x-4  justify-between items-center">
            <div className="h-5 bg-gray-300 rounded w-8"></div>
            <div className="h-5 bg-gray-300 rounded w-16"></div>
            <div className="h-5 bg-gray-300 rounded w-12"></div>
            <div className="h-5 bg-gray-300 rounded w-32"></div>
            <div className="h-5 bg-gray-300 rounded w-16"></div>
            <div className="h-5 bg-gray-300 rounded w-12"></div>
          </div>
        </div>
        
        {/* Table Rows */}
        <div className="bg-white">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 border-b border-gray-100   ">
              <div className="flex space-x-4 items-center justify-between">
                <div className="h-4 bg-gray-200 rounded w-8"></div>
                <div className="h-4 bg-gray-300 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-4 bg-gray-200 rounded w-12"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default VocabTrainerSkeleton
