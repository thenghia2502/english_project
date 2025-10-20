"use client"

import { useState } from "react"
import type { BookLevel } from "./types"
// import { Button } from "@/components/ui/button"
import Link from "next/link"

interface BookListProps {
    levels: BookLevel[]
}

export function BookList({ levels }: BookListProps) {
    // const [selectedLevel, setSelectedLevel] = useState<string | null>(null)
    const [expandedLevels, setExpandedLevels] = useState<Set<string>>(
        new Set(levels.map(level => level.level))
    )

    // const filteredLevels = selectedLevel ? levels.filter((level) => level.level === selectedLevel) : levels

    const toggleLevel = (levelName: string) => {
        const newExpanded = new Set(expandedLevels)
        if (newExpanded.has(levelName)) {
            newExpanded.delete(levelName)
        } else {
            newExpanded.add(levelName)
        }
        setExpandedLevels(newExpanded)
    }

    return (
        <div className="space-y-12">
            {/* Books by Level */}
            <div className="space-y-20">
                {levels.map((level) => (
                    <section key={level.level} className="space-y-8">
                        <div className="space-y-2">
                            <div 
                                className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => toggleLevel(level.level)}
                            >
                                <div className="h-1 w-12 rounded-full bg-primary" />
                                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{level.level}</h2>
                                <span className="text-2xl text-muted-foreground ml-2">
                                    {expandedLevels.has(level.level) ? '▼' : '▶'}
                                </span>
                            </div>
                        </div>

                        {expandedLevels.has(level.level) && (
                            <div className="flex flex-col gap-4">
                                {level.books.map((book) => (
                                    <Link key={book.id} href={`/book/${book.id}`} className="flex items-center p-4 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow">
                             
                                        <span className="ml-5">
                                            {book.title}
                                        </span>
                               
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>
                ))}
            </div>
        </div>
    )
}
