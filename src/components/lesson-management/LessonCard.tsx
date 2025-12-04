"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Users, Trash2, Play, Pen, Check } from "lucide-react"
import clsx from "clsx"
import { LessonCardProps } from "./types"

export default function LessonCard({
    lesson,
    onDelete,
    onStartLearning,
    onEditLesson,
    formatDate
}: LessonCardProps) {
    return (
        <Card
            className={clsx(
                "bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer",
                {
                    "bg-gradient-to-b from-blue-100 to-white": lesson.lesson_progress === "100"
                }
            )}
        >
            <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
                        {lesson.lesson_name}
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation()
                            onDelete(lesson.lesson_id)
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="pt-0">
                <div className="space-y-4">
                    {/* Course Stats */}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{lesson.lesson_words?.length} từ</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{lesson.estimatedTime}</span>
                        </div>
                    </div>

                    {/* Course Details */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Tạo lúc:</span>
                            <span className="text-gray-500">{formatDate(lesson.lesson_created_at)}</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Cập nhật lúc:</span>
                            <span className="text-gray-500">{formatDate(lesson.lesson_updated_at)}</span>
                        </div>
                    </div>
                    {/* Sample Words */}
                    <div className="flex items-center">
                        <div className="space-y-2 min-w-[240px]">
                            <p className="text-sm font-medium text-gray-700">Từ vựng mẫu:</p>
                            <div className="flex flex-wrap gap-1">
                                {(() => {
                                    const words = lesson.lesson_words
                                    return words.slice(0, 2).map((cw) => (
                                        <Badge key={cw.word_id} variant="outline" className="text-xs text-gray-900">
                                            {cw.word}
                                        </Badge>
                                    ))
                                })()}
                                {(() => {
                                    const words = lesson.lesson_words ?? []
                                    return words.length > 2 ? (
                                        <Badge variant="outline" className="text-xs text-gray-900">
                                            +{words.length - 2} từ khác
                                        </Badge>
                                    ) : null
                                })()}
                            </div>
                        </div>
                        <div className="flex-1 flex justify-center">
                            <div
                                className={`h-[50px] w-[50px] rounded-full flex items-center justify-center text-white ${lesson.lesson_progress === '100' ? 'bg-green-600' : 'bg-yellow-500'
                                    }`}
                            >
                                {lesson.lesson_progress === '100' ? <Check /> : `${lesson.lesson_progress}%`}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-around">
                        <Button
                            onClick={() => onStartLearning(lesson)}
                            className="bg-green-600 hover:bg-green-700 text-white mt-4"
                        >
                            <Play className="w-4 h-4 mr-2" />
                            Bắt đầu học
                        </Button>
                        <Button
                            className="bg-green-600 hover:bg-green-700 text-white mt-4"
                            onClick={() => onEditLesson(lesson)}
                        >
                            <Pen className="w-4 h-4 mr-2" />
                            Chỉnh sửa bài học
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}