"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Curriculum, CurriculumPagination } from '@/lib/types'
import { useCurriculumCustomList } from '@/hooks/use-curriculum'
import { X } from 'lucide-react'

type Props = {
  curriculumCustom?: CurriculumPagination
  searchQuery?: string
  curriculumOriginalIds?: string[]
  serverPaginated?: boolean
  routerPush: (path: string) => void
}

export default function CurriculumCustomList({ curriculumCustom, searchQuery = '', curriculumOriginalIds, serverPaginated, routerPush }: Props) {
  const PAGE_SIZE = curriculumCustom?.limit ?? 16
  const [currentPage, setCurrentPage] = useState<number>(curriculumCustom?.page ?? 1)

  // Ensure items is always an array to avoid runtime errors
  const itemsFromProp: Curriculum[] = Array.isArray(curriculumCustom?.items) ? curriculumCustom!.items : []

  const isServerPaginated = typeof serverPaginated === 'boolean'
    ? serverPaginated
    : (typeof curriculumCustom?.totalPages === 'number' && curriculumCustom!.totalPages > 1)

  // Always call the hook (React Hooks rule). If not server-paginated, pass undefineds
  // When parent provided `curriculumCustom`, avoid duplicate network requests by disabling the hook here
  const serverQuery = useCurriculumCustomList(
    isServerPaginated ? currentPage : undefined,
    isServerPaginated ? PAGE_SIZE : undefined,
    searchQuery || undefined,
    // pass parent's curriculumOriginalIds filter through to the hook
    curriculumOriginalIds || undefined,
    curriculumCustom === undefined // enable child fetch only when parent didn't supply data
  )

  // Prefer server results when available, otherwise fall back to parent-provided items
  const items: Curriculum[] = isServerPaginated
    ? (serverQuery.data?.items ?? (curriculumCustom?.items ?? []))
    : itemsFromProp

  // Backend already applies filtering when a searchQuery is provided.
  // Use the items returned by the server/parent as-is.
  const filtered = items

  // Prefer server-provided totalPages (from child fetch or parent prop) when available.
  const totalPages = (serverQuery.data?.totalPages ?? curriculumCustom?.totalPages) ?? Math.max(1, Math.ceil(items.length / PAGE_SIZE))

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  // If parent provides a different page (e.g., initial load), sync local currentPage
  useEffect(() => {
    if (typeof curriculumCustom?.page === 'number') setCurrentPage(curriculumCustom.page)
  }, [curriculumCustom?.page])

  let paginated: Curriculum[] = []
  if (isServerPaginated) {
    // Backend already returned the items for the current page
    paginated = filtered
  } else {
    const start = (currentPage - 1) * PAGE_SIZE
    paginated = filtered.slice(start, start + PAGE_SIZE)
  }

  // Show loading only if the child is fetching and parent didn't already provide items
  const parentHasItems = Array.isArray(curriculumCustom?.items) && (curriculumCustom!.items.length > 0)
  const isPageLoading = isServerPaginated ? (serverQuery.isLoading && !parentHasItems) : false

  return (
    <>
      {/* Fixed-height grid area (600px) with internal scrolling */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-auto'>
        {isPageLoading ? (
          <div className="col-span-full text-center py-20">Đang tải trang...</div>
        ) : (
          paginated.map((curriculum: Curriculum) => {
            return (
              <div key={curriculum.id} className="">
                <Card className="bg-white shadow-sm border border-gray-200 relative">
                  <button className="absolute top-0 right-0 w-[3rem] h-[3rem] bg-red-500 [clip-path:polygon(100%_0,0_0,100%_100%)] flex items-center justify-center group rounded-tr-lg"
                    onClick={() => alert('Đóng')}
                  >
                    <X className="absolute top-1 right-1 w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                  </button>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold text-black">{curriculum.name}</CardTitle>

                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">{curriculum.description || 'Không có mô tả'}</p>
                    <div className="my-2 flex items-center gap-3 text-sm text-gray-600">
                      <span>{curriculum.list_level?.length || 0} trình độ</span>
                      <span>{curriculum.list_unit?.length || 0} bài học</span>
                    </div>
                    <div className='flex space-x-6'>
                      <Button className='bg-green-600 hover:bg-green-700 text-white flex-1' variant="ghost" size="sm" onClick={() => routerPush(`/taobaihoc?id=${curriculum.id}`)}>Tạo bài học</Button>
                      <Button className='bg-green-600 hover:bg-green-700 text-white flex-1' variant="ghost" size="sm" onClick={() => routerPush(`/taodanhsachbaihoc?mode=edit&curriculum_custom=${curriculum.id}`)}>Sửa bài học</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )
          })
        )}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center space-x-4 text-black">
          <Button variant="outline" size="sm" disabled={currentPage <= 1 || isPageLoading} onClick={() => setCurrentPage(1)}>
            First
          </Button>
          <Button variant="outline" size="sm" disabled={currentPage <= 1 || isPageLoading} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
            Prev
          </Button>

          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }).map((_, i) => {
              const page = i + 1
              return (
                <Button
                  key={page}
                  variant={page === currentPage ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className={page === currentPage ? 'bg-gray-200' : ''}
                  disabled={isPageLoading}
                >
                  {page}
                </Button>
              )
            })}
          </div>

          <Button variant="outline" size="sm" disabled={currentPage >= totalPages || isPageLoading} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>
            Next
          </Button>
          <Button variant="outline" size="sm" disabled={currentPage >= totalPages || isPageLoading} onClick={() => setCurrentPage(totalPages)}>
            Last
          </Button>
        </div>
      )}
    </>
  )
}
