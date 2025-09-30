"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Word } from "@/lib/types"

interface LocalWord extends Word {
    selected: boolean
    done: boolean
    popularity: number
    belong: string
    ipa: string
}

interface WordListUnit {
    id: string
    name: string
    list_word?: Word[]
}

interface WordSelectionPanelProps {
    units: WordListUnit[]
    selectedUnitIds: string[]
    data: { [key: string]: LocalWord[] }
    expandedChildGroups: Set<string>
    setData: React.Dispatch<React.SetStateAction<{ [key: string]: LocalWord[] }>>
    setExpandedChildGroups: React.Dispatch<React.SetStateAction<Set<string>>>
}

export default function WordSelectionPanel({
    units,
    selectedUnitIds,
    data,
    expandedChildGroups,
    setData,
    setExpandedChildGroups
}: WordSelectionPanelProps) {
    const getWordSelected = (unitId: string, wordId: string) => {
        const list = data[unitId]
        if (!Array.isArray(list)) return false
        const found = list.find((w: LocalWord) => w.id === wordId)
        return !!(found && found.selected)
    }

    const toggleWordSelection = (unitId: string, wordId: string, unitWords?: Word[]) => {
        setData((prev) => {
            const prevList = prev[unitId] ?? (unitWords ?? []).map((w) => ({ ...w, selected: false }))
            const updated = prevList.map((w: LocalWord) => (w.id === wordId ? { ...w, selected: !w.selected } : w))
            return { ...prev, [unitId]: updated }
        })
    }

    const renderRow = (word: Word, unit: WordListUnit) => {
        const selected = getWordSelected(unit.id, word.id)

        return (
            <TableRow 
                key={word.id} 
                className="hover:bg-gray-50 text-gray-900 flex" 
                onClick={() => toggleWordSelection(unit.id, word.id, unit.list_word)}
            >
                <TableCell className="px-4 py-3 w-1/3">
                    <div className={`flex items-center space-x-3 ${word.parent_id ? 'pl-2.5' : ''}`}>
                        <div>
                            <div className="font-medium text-gray-900">{word.word}</div>
                            <div className="text-sm text-gray-500">{word.meaning}</div>
                        </div>
                    </div>
                </TableCell>
                <TableCell className="px-4 py-3 w-20 text-sm text-gray-700 flex-1 flex items-center">
                    {word.lesson_ids && word.lesson_ids.length > 0 && (
                        <div className="text-xs">
                            {word.lesson_ids.length === 1 
                                ? `đã có trong bài ${word.lesson_names?.[0] || word.lesson_ids[0]}`
                                : `đã có trong ${word.lesson_ids.length} bài học`
                            }
                        </div>
                    )}
                </TableCell>
                <TableCell className="px-4 py-3 w-10 flex items-center">
                    <div className="space-x-3">
                        <Checkbox 
                            checked={selected} 
                            className={`${selected ? 'bg-blue-500 border-blue-500' : 'bg-white'}`}
                        />
                    </div>
                </TableCell>
            </TableRow>
        )
    }

    return (
        <>
            {units.filter(u => selectedUnitIds.includes(u.id)).map((unit) => {
                // Group children by parent_id and collect roots
                const childrenMap = new Map<string, Word[]>()
                const roots: Word[] = []
                
                ;(unit.list_word || []).forEach((w: Word) => {
                    if (w.parent_id) {
                        if (!childrenMap.has(w.parent_id)) childrenMap.set(w.parent_id, [])
                        childrenMap.get(w.parent_id)!.push(w)
                    } else {
                        roots.push(w)
                    }
                })

                // Sort roots and children for predictable order
                roots.sort((a, b) => a.word.localeCompare(b.word))
                childrenMap.forEach((list) => list.sort((a, b) => a.word.localeCompare(b.word)))

                return (
                    <div key={unit.id} className="mb-6">
                        <h3 className="text-md font-semibold text-gray-800 mb-3">{unit.name} từ</h3>
                        <Card className="bg-white shadow-sm border border-gray-200">
                            <CardContent className="p-0">
                                <Table>
                                    <TableBody>
                                        {roots.map((root) => {
                                            const children = childrenMap.get(root.id) || []

                                            return (
                                                <React.Fragment key={root.id}>
                                                    {renderRow(root, unit)}
                                                    {children.length > 0 && (
                                                        <>
                                                            {expandedChildGroups.has(root.id) ? (
                                                                // Expanded: show all children + collapse button
                                                                <>
                                                                    {children.map((c) => renderRow(c, unit))}
                                                                    <TableRow className="border-b border-gray-700">
                                                                        <TableCell colSpan={3} className="px-4 py-2 flex justify-center">
                                                                            <button
                                                                                type="button"
                                                                                onClick={(e) => { 
                                                                                    e.stopPropagation()
                                                                                    setExpandedChildGroups((s) => { 
                                                                                        const ns = new Set(s)
                                                                                        ns.delete(root.id)
                                                                                        return ns 
                                                                                    }) 
                                                                                }}
                                                                                className="text-sm text-gray-600 hover:underline"
                                                                            >
                                                                                Ẩn bớt
                                                                            </button>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                </>
                                                            ) : (
                                                                // Collapsed: show only first child and a button to reveal remaining
                                                                <>
                                                                    {children[0] && renderRow(children[0], unit)}
                                                                    {children.length > 1 && (
                                                                        <TableRow className="border-b border-gray-700">
                                                                            <TableCell colSpan={3} className="px-4 py-2 flex justify-center">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={(e) => { 
                                                                                        e.stopPropagation()
                                                                                        setExpandedChildGroups((s) => { 
                                                                                            const ns = new Set(s)
                                                                                            ns.add(root.id)
                                                                                            return ns 
                                                                                        }) 
                                                                                    }}
                                                                                    className="text-sm text-blue-600 hover:underline"
                                                                                >
                                                                                    Hiện thêm {children.length - 1} từ
                                                                                </button>
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    )}
                                                                </>
                                                            )}
                                                        </>
                                                    )}
                                                </React.Fragment>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                )
            })}
        </>
    )
}