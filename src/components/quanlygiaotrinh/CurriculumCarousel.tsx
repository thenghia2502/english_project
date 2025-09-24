"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, Trash2, GraduationCap, ChevronLeft, ChevronRight } from 'lucide-react'
import { Curriculum, Unit } from '@/lib/types'

type Props = {
  searchQuery: string
  getFilteredCurriculums: (q: string) => Curriculum[]
  curriculumCarouselIndex: number
  setCurriculumCarouselIndex: (i: number) => void
  deleteCurriculum: (id: string) => void
  formatDate: (d: string | Date) => string
  getTotalUnits: (list_unit?: Unit[]) => number
  getTotalWords: (list_unit?: Unit[]) => number
  routerPush: (path: string) => void
}

export default function CurriculumCarousel({ searchQuery, getFilteredCurriculums, curriculumCarouselIndex, setCurriculumCarouselIndex, deleteCurriculum, formatDate, getTotalUnits, getTotalWords, routerPush }: Props) {
  const filtered = getFilteredCurriculums(searchQuery)

  return (
    <div>
      {filtered.length === 0 ? (
        <div className="relative">
          <Card className="box-border bg-white border border-gray-200 shadow-sm w-full flex " style={{ minHeight: '332px' }}>
            <CardContent className="p-0 text-center flex flex-col justify-center flex-1" >
              <BookOpen className="mx-auto h-8 w-8 text-gray-400 mb-3" />
              <h4 className="text-sm font-medium  mb-2">Không tìm thấy giáo trình nào</h4>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="relative">
          <div className="overflow-hidden">
            <div className="flex transition-transform duration-300 ease-in-out" style={{ transform: `translateX(-${Math.floor(curriculumCarouselIndex / 3) * 100}%)` }}>
              {Array.from({ length: Math.ceil(filtered.length / 3) }).map((_, pageIndex) => (
                <div key={pageIndex} className="w-full flex-shrink-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filtered.slice(pageIndex * 3, (pageIndex + 1) * 3).map((curriculum) => (
                    <Card key={curriculum.id} className="bg-white shadow-sm border border-gray-200 hover:shadow-md hover:bg-blue-50 transition-all cursor-pointer">
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <CardTitle className="h-[3rem] text-lg font-semibold line-clamp-2 text-black">{curriculum.name}</CardTitle>
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); deleteCurriculum(curriculum.id) }} className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1"><GraduationCap className="w-4 h-4" /><span className='text-black'>{curriculum.list_level?.length || 0} trình độ</span></div>
                            <div className="flex items-center gap-1"><BookOpen className="w-4 h-4" /><span className='text-black'>{getTotalUnits(curriculum.list_unit)} bài học</span></div>
                            <div className="flex items-center gap-1"><span className='text-black'>~{getTotalWords(curriculum.list_unit)} từ</span></div>
                          </div>
                          {curriculum.description && <p className="text-sm text-gray-600 line-clamp-2">{curriculum.description}</p>}
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-700">Các trình độ:</p>
                            <div className="flex flex-wrap gap-1">
                              {curriculum.list_level && curriculum.list_level.length > 0 ? (
                                <>
                                  {curriculum.list_level.slice(0, 3).map((level) => (
                                    <Badge key={level.id} variant="outline" className="text-xs text-black" title={`${level.name} - ${level.units?.length || 0} bài học`}>{level.name} ({level.units?.length || 0})</Badge>
                                  ))}
                                  {curriculum.list_level.length > 3 && <Badge variant="outline" className="text-xs">+{curriculum.list_level.length - 3} trình độ nữa</Badge>}
                                </>
                              ) : (
                                <Badge variant="outline" className="text-xs text-gray-400">Chưa có trình độ nào</Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Tạo lúc:</span>
                            <span className="text-gray-500">{formatDate(curriculum.created_at || new Date().toISOString())}</span>
                          </div>
                          <div className="flex items-center gap-2 pt-2">
                            <Button onClick={() => routerPush(`/taodanhsachbaihoc?mode=create&curriculum=${curriculum.id}`)} className="w-full bg-blue-600 hover:bg-blue-700 text-white" size="sm">
                              <BookOpen className="w-4 h-4 mr-2" />Tạo giáo trình tùy chỉnh
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {filtered.length > 3 && (
            <>
              {Math.floor(curriculumCarouselIndex / 3) > 0 && (
                <Button variant="outline" size="sm" className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white shadow-md hover:bg-gray-50" onClick={() => setCurriculumCarouselIndex(Math.max(0, curriculumCarouselIndex - 3))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              )}

              {Math.floor(curriculumCarouselIndex / 3) < Math.ceil(filtered.length / 3) - 1 && (
                <Button variant="outline" size="sm" className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white shadow-md hover:bg-gray-50" onClick={() => setCurriculumCarouselIndex(Math.min(curriculumCarouselIndex + 3, Math.max(0, filtered.length - 3)))}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
