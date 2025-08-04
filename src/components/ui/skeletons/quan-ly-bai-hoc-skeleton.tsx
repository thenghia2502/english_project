import { Card, CardContent, CardHeader } from "@/components/ui/card"

interface QuanLyBaiHocSkeletonProps {
  className?: string
}

export default function QuanLyBaiHocSkeleton({ className = "" }: QuanLyBaiHocSkeletonProps) {
  return (
    <div className={`min-h-screen bg-gray-100 ${className}`}>
      {/* Main Content Skeleton */}
      <div className="pt-[4.5rem] min-h-screen">
        <div className="mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Search and Filter Section Skeleton */}
          <div className="mb-5 space-y-2">
            {/* Search Input Skeleton */}
            <div className="flex items-center m-2">
              <div className="w-[100px] h-7 bg-gray-200 rounded animate-pulse mr-4"></div>
              <div className="flex-1 h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
            
            {/* Filter Section Skeleton */}
            <div className="relative p-2">
              <div className="flex flex-row space-x-6 p-6 border rounded-md border-gray-300">
                <div className="flex items-center space-x-1">
                  <div className="w-4 h-4 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-4 h-4 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="w-12 h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="absolute top-0 left-0 flex pr-2 pb-1 bg-[#f3f4f6]">
                
                <div className="h-6 bg-gray-200 rounded animate-pulse w-[100px] ml-2"></div>
              </div>
            </div>
          </div>

          {/* Course Cards Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <Card key={index} className="bg-white shadow-sm border border-gray-200">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                    </div>
                    <div className="w-8 h-8 bg-gray-200 rounded animate-pulse ml-2"></div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {/* Course Stats Skeleton */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="w-8 h-4 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="w-12 h-4 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>

                    {/* Course Details Skeleton */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="w-12 h-4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>

                    {/* Sample Words Section Skeleton */}
                    <div className="flex items-center">
                      <div className="space-y-2 min-w-[240px]">
                        <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="flex flex-wrap gap-1">
                          <div className="w-12 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                          <div className="w-16 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                          <div className="w-14 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                      <div className="flex-1 flex justify-center">
                        <div className="h-[50px] w-[50px] rounded-full bg-gray-200 animate-pulse"></div>
                      </div>
                    </div>

                    {/* Action Buttons Skeleton */}
                    <div className="flex items-center justify-around">
                      <div className="h-10 w-24 bg-gray-200 rounded animate-pulse mt-4"></div>
                      <div className="h-10 w-28 bg-gray-200 rounded animate-pulse mt-4"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
