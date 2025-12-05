"use client"

import React, { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Word } from "@/lib/types"
import { LocalWord } from "./types"
import ModalAddWords from "./ModalAddWords"

interface WordListUnit {
    unit_id: string
    unit_name: string
    unit_title?: string
    words: {
        original: {
            word_id: string;
            word_text: string;
            word_meaning?: string;
            word_ipa?: string;
            word_popularity?: number;
            word_parent_id?: string | null;
            children?: {
                word_id: string;
                word_text?: string;
                word?: string;
                word_meaning?: string;
                word_ipa?: string;
                word_popularity?: number;
                lesson_ids?: string[];
                lesson_names?: string[];
            }[]
        }[]
        custom: {
            word_id: string;
            word_text: string;
            word_meaning?: string;
            word_ipa?: string;
            word_popularity?: number;
            word_parent_id?: string | null;
            children?: {
                word_id: string;
                word_text?: string;
                word?: string;
                word_meaning?: string;
                word_ipa?: string;
                word_popularity?: number;
                lesson_ids?: string[];
                lesson_names?: string[];
            }[]
        }[]
    }
}

interface WordSelectionPanelProps {
    units: WordListUnit[] | {
        words: {
            original: {
                word_id: string;
                word_text: string;
                word_meaning?: string;
                word_ipa?: string;
                word_popularity?: number;
                word_parent_id?: string | null;
                children?: {
                    word_id: string;
                    word_text?: string;
                    word?: string;
                    word_meaning?: string;
                    word_ipa?: string;
                    word_popularity?: number;
                    lesson_ids?: string[];
                    lesson_names?: string[];
                }[]
            }[]
            custom: {
                word_id: string;
                word_text: string;
                word_meaning?: string;
                word_ipa?: string;
                word_popularity?: number;
                word_parent_id?: string | null;
                children?: {
                    word_id: string;
                    word_text?: string;
                    word?: string;
                    word_meaning?: string;
                    word_ipa?: string;
                    word_popularity?: number;
                    lesson_ids?: string[];
                    lesson_names?: string[];
                }[]
            }[]
        }
        unit_id: string;
        unit_name: string;
        unit_description?: string | undefined;
        unit_order?: number | undefined;
        level_id: string;
        level_name: string;
        level_code: string;
        level_description?: string | undefined;
    }[]
    selectedUnitIds: string[]
    data: {
        [key: string]: LocalWord[];
    }
    expandedChildGroups: Set<string>
    setData: React.Dispatch<React.SetStateAction<{ [key: string]: LocalWord[] }>>
    setExpandedChildGroups: React.Dispatch<React.SetStateAction<Set<string>>>
    // onOpenModalAddWords: () => void
}

export default function WordSelectionPanel({
    units,
    selectedUnitIds,
    data,
    expandedChildGroups,
    setData,
    setExpandedChildGroups,
    // onOpenModalAddWords
}: WordSelectionPanelProps) {
    type ApiChildWord = {
        word_id: string
        word_text?: string
        word?: string
        word_ipa?: string
        word_meaning?: string
        word_popularity?: number
        lesson_ids?: string[]
        lesson_names?: string[]
    }

    type IncomingWord = Word & {
        children?: ApiChildWord[]
        word_text?: string
    }

    const getWordSelected = (unitId: string, wordId: string) => {
        const list = data[unitId]
        if (!Array.isArray(list)) return false
        const found = list.find((w: LocalWord) => w.word_id === wordId)
        return !!(found && found.selected)
    }

    const toggleWordSelection = (unitId: string, wordId: string, unitWords?: {
        original: {
            word_id: string;
            word_text: string;
            word_meaning?: string;
            word_ipa?: string;
            word_popularity?: number;
            word_parent_id?: string | null;
            children?: {
                word_id: string;
                word_text?: string;
                word?: string;
                word_meaning?: string;
                word_ipa?: string;
                word_popularity?: number;
                lesson_ids?: string[];
                lesson_names?: string[];
            }[]
        }[]
        custom: {
            word_id: string;
            word_text: string;
            word_meaning?: string;
            word_ipa?: string;
            word_popularity?: number;
            word_parent_id?: string | null;
            children?: {
                word_id: string;
                word_text?: string;
                word?: string;
                word_meaning?: string;
                word_ipa?: string;
                word_popularity?: number;
                lesson_ids?: string[];
                lesson_names?: string[];
            }[]
        }[]
    }) => {
        setData((prev) => {
            const prevListOriginal = prev[unitId] ?? (unitWords?.original ?? []).map((w) => ({ ...w, selected: false }))
            const prevListCustom = prev[unitId] ?? (unitWords?.custom ?? []).map((w) => ({ ...w, selected: false }))
            const prevList = prevListOriginal.concat(prevListCustom)
            const updated = prevList.map((w: LocalWord) => (w.word_id === wordId ? { ...w, selected: !w.selected } : w))
            return { ...prev, [unitId]: updated }
        })
    }

    const renderRow = (word: Word, unit: WordListUnit, type: number) => {
        const selected = getWordSelected(unit.unit_id, word.word_id)

        return (
            <TableRow
                key={word.word_id}
                className={`hover:bg-gray-50 text-gray-900 flex ${type === 1 ? '' : 'bg-gray-200'}`}
                onClick={() => toggleWordSelection(unit.unit_id, word.word_id, unit.words)}
            >
                <TableCell className="px-4 py-3 w-1/3">
                    <div className={`flex items-center space-x-3 ${word.word_parent_id ? 'pl-2.5' : ''}`}>
                        <div>
                            <div className="font-medium text-gray-900">{word.word_text}</div>
                            <div className="text-sm text-gray-500">{word.word_ipa}</div>
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
    const [modalUnitId, setModalUnitId] = useState<string | null>(null)
    const handleOpenModalAddWords = (unitId: string) => {
        setModalUnitId(unitId)
    }
    const handleCloseModalAddWords = () => {
        setModalUnitId(null)
    }
    return (
        <>
            {modalUnitId && (
                <ModalAddWords unitId={modalUnitId} onClose={handleCloseModalAddWords} />
            )}
            {units.filter(u => selectedUnitIds.includes(u.unit_id)).map((unit) => {
                // Normalize children from API (words with embedded children array)
                const childrenMap = new Map<string, Word[]>()
                const rootsOriginal: Word[] = []
                const rootsCustom: Word[] = []
                const unitWordsOriginal = (unit.words.original || []) as IncomingWord[]
                const unitWordsCustom = (unit.words.custom || []) as IncomingWord[]
                unitWordsOriginal.forEach((w: IncomingWord) => {
                    // Treat item as root
                    const rootWord: Word = {
                        word_id: w.word_id,
                        word_text: w.word_text ?? '',
                        word_meaning: w.word_meaning ?? '',
                        word_ipa: w.word_ipa,
                        word_parent_id: undefined,
                        word_popularity: w.word_popularity,
                        lesson_ids: w.lesson_ids,
                        lesson_names: w.lesson_names
                    }
                    rootsOriginal.push(rootWord)

                    // If API provides children array, map them as child words
                    if (Array.isArray(w.children) && w.children.length > 0) {
                        const list: Word[] = w.children.map((c: ApiChildWord) => ({
                            word_id: c.word_id,
                            word_text: c.word_text ?? '',
                            word_meaning: c.word_meaning ?? '',
                            word_ipa: c.word_ipa,
                            word_parent_id: w.word_id,
                            word_popularity: c.word_popularity,
                            lesson_ids: c.lesson_ids,
                            lesson_names: c.lesson_names
                        }))
                        childrenMap.set(w.word_id, list)
                    }
                })
                unitWordsCustom.forEach((w: IncomingWord) => {
                    // Treat item as root
                    const rootWord: Word = {
                        word_id: w.word_id,
                        word_text: w.word_text ?? '',
                        word_meaning: w.word_meaning ?? '',
                        word_ipa: w.word_ipa,
                        word_parent_id: undefined,
                        word_popularity: w.word_popularity,
                        lesson_ids: w.lesson_ids,
                        lesson_names: w.lesson_names
                    }
                    rootsCustom.push(rootWord)

                    // If API provides children array, map them as child words
                    if (Array.isArray(w.children) && w.children.length > 0) {
                        const list: Word[] = w.children.map((c: ApiChildWord) => ({
                            word_id: c.word_id,
                            word_text: c.word_text ?? '',
                            word_meaning: c.word_meaning ?? '',
                            word_ipa: c.word_ipa,
                            word_parent_id: w.word_id,
                            word_popularity: c.word_popularity,
                            lesson_ids: c.lesson_ids,
                            lesson_names: c.lesson_names
                        }))
                        childrenMap.set(w.word_id, list)
                    }
                })
                // Backward compatibility: include legacy children linked by word_parent_id
                unitWordsOriginal.forEach((w: IncomingWord) => {
                    if (w.word_parent_id) {
                        if (!childrenMap.has(w.word_parent_id)) childrenMap.set(w.word_parent_id, [])
                        const list = childrenMap.get(w.word_parent_id)!
                        // Avoid duplicate if already from new children array
                        if (!list.find((x) => x.word_id === w.word_id)) {
                            list.push({
                                word_id: w.word_id,
                                word_text: w.word_text ?? '',
                                word_meaning: w.word_meaning ?? '',
                                word_ipa: w.word_ipa,
                                word_parent_id: w.word_parent_id,
                                word_popularity: w.word_popularity,
                                lesson_ids: w.lesson_ids,
                                lesson_names: w.lesson_names
                            } as Word)
                        }
                    }
                })

                unitWordsCustom.forEach((w: IncomingWord) => {
                    if (w.word_parent_id) {
                        if (!childrenMap.has(w.word_parent_id)) childrenMap.set(w.word_parent_id, [])
                        const list = childrenMap.get(w.word_parent_id)!
                        // Avoid duplicate if already from new children array
                        if (!list.find((x) => x.word_id === w.word_id)) {
                            list.push({
                                word_id: w.word_id,
                                word_text: w.word_text ?? '',
                                word_meaning: w.word_meaning ?? '',
                                word_ipa: w.word_ipa,
                                word_parent_id: w.word_parent_id,
                                word_popularity: w.word_popularity,
                                lesson_ids: w.lesson_ids,
                                lesson_names: w.lesson_names
                            } as Word)
                        }
                    }
                })

                // Sort roots and children for predictable order
                rootsOriginal.sort((a, b) => a.word_text.localeCompare(b.word_text))
                rootsCustom.sort((a, b) => a.word_text.localeCompare(b.word_text))
                childrenMap.forEach((list) => list.sort((a, b) => a.word_text.localeCompare(b.word_text)))

                return (
                    <div key={unit.unit_id} className="mb-6">
                        <div className="flex justify-between">
                            <h3 className="text-md font-semibold text-gray-800 mb-3">{unit.unit_name} từ</h3>
                            <span className="text-black text-sm cursor-pointer" onClick={() => handleOpenModalAddWords(unit.unit_id)}>thêm từ</span>
                        </div>
                        <Card className="bg-white shadow-sm border border-gray-200">
                            <CardContent className="p-0">
                                <Table>
                                    <TableBody>
                                        {rootsOriginal.map((root) => {
                                            const children = childrenMap.get(root.word_id) || []

                                            return (
                                                <React.Fragment key={root.word_id}>
                                                    {renderRow(root, unit, 1)}
                                                    {children.length > 0 && (
                                                        <>
                                                            {expandedChildGroups.has(root.word_id) ? (
                                                                // Expanded: show all children + collapse button
                                                                <>
                                                                    {children.map((c) => renderRow(c, unit, 1))}
                                                                    <TableRow className="border-b border-gray-700">
                                                                        <TableCell colSpan={3} className="px-4 py-2 flex justify-center">
                                                                            <button
                                                                                type="button"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation()
                                                                                    setExpandedChildGroups((s) => {
                                                                                        const ns = new Set(s)
                                                                                        ns.delete(root.word_id)
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
                                                                    {children[0] && renderRow(children[0], unit, 1)}
                                                                    {children.length > 1 && (
                                                                        <TableRow className="border-b border-gray-700">
                                                                            <TableCell colSpan={3} className="px-4 py-2 flex justify-center">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation()
                                                                                        setExpandedChildGroups((s) => {
                                                                                            const ns = new Set(s)
                                                                                            ns.add(root.word_id)
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
                                        {rootsCustom.map((root) => {
                                            const children = childrenMap.get(root.word_id) || []

                                            return (
                                                <React.Fragment key={root.word_id}>
                                                    {renderRow(root, unit, 2)}
                                                    {children.length > 0 && (
                                                        <>
                                                            {expandedChildGroups.has(root.word_id) ? (
                                                                // Expanded: show all children + collapse button
                                                                <>
                                                                    {children.map((c) => renderRow(c, unit, 2))}
                                                                    <TableRow className="border-b border-gray-700">
                                                                        <TableCell colSpan={3} className="px-4 py-2 flex justify-center">
                                                                            <button
                                                                                type="button"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation()
                                                                                    setExpandedChildGroups((s) => {
                                                                                        const ns = new Set(s)
                                                                                        ns.delete(root.word_id)
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
                                                                    {children[0] && renderRow(children[0], unit, 2)}
                                                                    {children.length > 1 && (
                                                                        <TableRow className="border-b border-gray-700">
                                                                            <TableCell colSpan={3} className="px-4 py-2 flex justify-center">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation()
                                                                                        setExpandedChildGroups((s) => {
                                                                                            const ns = new Set(s)
                                                                                            ns.add(root.word_id)
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