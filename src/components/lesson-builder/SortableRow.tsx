"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TableCell, TableRow } from "@/components/ui/table"
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { X } from "lucide-react"
import { LessonWord } from "@/lib/types"

interface LocalWord {
    id: string
    word: string
    ipa: string
}

interface SortableRowProps {
    word: LocalWord
    lessonWord: LessonWord
    updateMaxReadsLessonWord: (id: string, value: string) => void
    updateLessonWord: (id: string, field: keyof LessonWord, value: string) => void
    removeLessonWord: (id: string) => void
}

export default function SortableRow({
    word,
    lessonWord,
    updateMaxReadsLessonWord,
    updateLessonWord,
    removeLessonWord
}: SortableRowProps) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: word.id })
    
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <TableRow
            ref={setNodeRef}
            style={style}
            {...attributes}
            className="hover:bg-gray-50 transition-colors border-b border-gray-100 cursor-move text-gray-900"
        >
            <TableCell className="py-4 px-6 flex items-center justify-between" {...listeners}>
                <div>
                    <div className="font-medium text-gray-900">{word.word}</div>
                    <div className="text-xs text-gray-400 ipa-text">{word.ipa}</div>
                </div>
            </TableCell>

            <TableCell className="py-4 px-4 cursor-default">
                <Input
                    type="number"
                    value={lessonWord.maxRead}
                    onChange={(e) => updateMaxReadsLessonWord(lessonWord.id, e.target.value)}
                    placeholder="0"
                    className="w-full text-sm text-center"
                    min="0"
                />
            </TableCell>

            <TableCell className="py-4 px-4 cursor-default">
                <Input
                    type="number"
                    value={lessonWord.show_ipa}
                    onChange={(e) => updateLessonWord(lessonWord.id, "show_ipa", e.target.value)}
                    placeholder="0"
                    className="w-full text-sm text-center"
                    min="0"
                    max={Number(lessonWord.maxRead) - (Number(lessonWord.show_ipa_and_word) + Number(lessonWord.show_word))}
                />
            </TableCell>

            <TableCell className="py-4 px-4 cursor-default">
                <Input
                    type="number"
                    value={lessonWord.show_word}
                    onChange={(e) => updateLessonWord(lessonWord.id, "show_word", e.target.value)}
                    placeholder="0"
                    className="w-full text-sm text-center"
                    min="0"
                    max={Number(lessonWord.maxRead) - (Number(lessonWord.show_ipa_and_word) + Number(lessonWord.show_word))}
                />
            </TableCell>

            <TableCell className="py-4 px-4 cursor-default">
                <Input
                    type="number"
                    value={lessonWord.show_ipa_and_word}
                    onChange={(e) => updateLessonWord(lessonWord.id, "show_ipa_and_word", e.target.value)}
                    placeholder="0"
                    className="w-full text-sm text-center"
                    min="0"
                    max={Number(lessonWord.maxRead) - (Number(lessonWord.show_ipa) + Number(lessonWord.show_word))}
                />
            </TableCell>

            <TableCell className="py-4 px-4 cursor-default">
                <Input
                    type="number"
                    value={lessonWord.reads_per_round}
                    onChange={(e) => updateLessonWord(lessonWord.id, "reads_per_round", e.target.value)}
                    placeholder="0"
                    className="w-full text-sm text-center"
                    min="1"
                    max={lessonWord.maxRead}
                />
            </TableCell>

            <TableCell className="py-4 px-4 cursor-default">
                <div className="flex items-center space-x-2">
                    <Input
                        id="pause-time"
                        type="number"
                        value={lessonWord.pause_time}
                        onChange={(e) => updateLessonWord(lessonWord.id, "pause_time", e.target.value)}
                        placeholder="0"
                        className="w-full text-sm text-center"
                        min="0"
                    />
                    <span>giây</span>
                </div>
            </TableCell>

            <TableCell className="py-4 px-4 cursor-default">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        removeLessonWord(lessonWord.id)
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 cursor-pointer"
                >
                    <X className="w-4 h-4" />
                </Button>
            </TableCell>
        </TableRow>
    )
}