"use client"

import React, { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BookOpen, Save, ChevronLeft, ChevronRight } from "lucide-react"
import type { BookUnit, BookNote } from "../types"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"

// Dynamic import PDFViewer
const PDFViewer = dynamic(
  () => import("./PDFViewer").then((mod) => ({ default: mod.PDFViewer })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground">Loading PDF viewer...</p>
        </div>
      </div>
    ),
  }
)

// Dynamic import NotesEditor
const NotesEditor = dynamic(
  () => import("./NotesEditor").then((mod) => ({ default: mod.NotesEditor })),
  {
    ssr: false,
    loading: () => <div className="min-h-32 border rounded-md p-3 text-gray-400">Loading editor...</div>,
  }
)

interface BookReaderProps {
  book: {
    id: string
    title: string
    author: string
    units: BookUnit[]
    id_wb: string
  }
}

export function BookReader({ book }: BookReaderProps) {
  const router = useRouter()
  const [selectedUnit, setSelectedUnit] = useState<BookUnit>(book.units[0])
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [savedNotes, setSavedNotes] = useState<BookNote[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true)
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Load note when component mounts or book changes
  useEffect(() => {
    const loadNote = async () => {
      try {
        const response = await fetch(`http://localhost:4000/api/notes/${book.id}/${selectedUnit.id}`)
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            // Load all notes for this book (data is an object with unitId as keys)
            const loadedNotes: Record<string, string> = {}
            Object.keys(result.data).forEach(unitId => {
              loadedNotes[unitId] = result.data[unitId].content
            })
            const loadedText = result.data.content || "";
            const loadedTitle = result.data.title || "";
            setTitle(loadedTitle)
            setText(loadedText)
            setNotes(loadedNotes)
          }
        } else if (response.status === 404) {
          setText("");
          setTitle("");
          // Note doesn't exist yet, that's ok
          console.log('No existing notes found for this book')
        } else {
          console.error('Failed to load notes:', response.status)
        }
      } catch (error) {
        // Server might not be running or network error
        // Just log it, don't block the UI
        console.log('Could not connect to notes server:', error)
      }
    }

    loadNote()
  }, [book.id, selectedUnit.id])

  const handleSaveNote = async () => {
    if (!notes[selectedUnit.id]?.trim()) return

    setIsSaving(true)
    setSaveMessage(null)

    try {
      const response = await fetch('http://localhost:4000/api/notes/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookId: book.id,
          unitId: selectedUnit.id,
          content: notes[selectedUnit.id],
          title
        }),
      })

      const result = await response.json()

      if (result.success) {
        const newNote: BookNote = {
          id: Date.now().toString(),
          unitId: selectedUnit.id,
          content: notes[selectedUnit.id],
          timestamp: new Date(),
          title: title 
        }
        setSavedNotes([...savedNotes, newNote])
        setSaveMessage({ type: 'success', text: `Note saved for ${selectedUnit.title}!` })

        // Clear success message after 3 seconds
        setTimeout(() => setSaveMessage(null), 3000)
      } else {
        setSaveMessage({ type: 'error', text: result.error || 'Failed to save note' })
      }
    } catch (error) {
      console.error('Error saving note:', error)
      setSaveMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex h-screen flex-col bg-white text-gray-900">
      {/* Header */}
      <header className="border-b bg-background px-6 py-4">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold">{book.title}</h1>
            <p className="text-sm text-muted-foreground">{book.author}</p>
          </div>
        </div>
      </header>

      {/* Main Content - 3 Column Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Toggle Button for Left Panel */}
        {!isLeftPanelOpen && (
          <Button
            variant="outline"
            size="icon"
            className="mt-4 z-10 bg-white shadow-lg hover:bg-gray-100"
            onClick={() => setIsLeftPanelOpen(true)}
          >
            <ChevronRight className="" />
          </Button>
        )}

        {/* Left Panel - Units List */}
        {isLeftPanelOpen && (
          <aside className="w-64 flex-shrink-0 border-r bg-muted/30">
            <ScrollArea className="h-full">
              <div className="p-4 pt-0">
                <div className="flex items-center">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Units</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-1 justify-end"
                    onClick={() => setIsLeftPanelOpen(false)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {book.units.map((unit) => (
                    <React.Fragment key={unit.id}>
                      <Button
                        key={unit.id}
                        variant={selectedUnit.id === unit.id ? "default" : "ghost"}
                        className={`w-full justify-start text-left hover:bg-gray-300 cursor-pointer ${selectedUnit.id === unit.id ? "bg-gray-200" : ""}`}
                        onClick={() => setSelectedUnit(unit)}
                      >
                        <span className="line-clamp-2 text-sm">{unit.title}</span>
                      </Button>
                      {/* <Button
                      variant={"default"}
                      className="w-full justify-start text-left hover:bg-gray-300 cursor-pointer"
                      onClick={() => router.push(`/book/wb/${book.id_wb}`)}
                    >
                      Xem bài tập
                    </Button> */}
                    </React.Fragment>
                  ))}
                  <Button
                    variant={"default"}
                    className="w-full justify-start text-left hover:bg-gray-300 cursor-pointer"
                    onClick={() => router.push(`/book/wb/${book.id_wb}`)}
                  >
                    Xem sách bài tập
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </aside>
        )}

        {/* Middle Panel - PDF Viewer */}
        <main className="w-[1100px] bg-muted/10">
          <div className="h-full p-4">
            <Card className="h-full">
              <CardContent className="h-[calc(100%)] p-0">
                <PDFViewer pdfUrl={selectedUnit.pdfUrl} title={selectedUnit.title} />
              </CardContent>
            </Card>
          </div>
        </main>

        {/* Right Panel - Notes */}
        {isRightPanelOpen && (
          <aside className="flex-1 border-l bg-background">
            <div className="flex h-full flex-col">
              <div className="border-b flex ">
                <Input
                  onChange={(e) => setTitle(e.target.value)}
                  className="border-0 border-r rounded-none flex-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 "
                  value={title}
                  placeholder="Nhập tên ghi chú"
                />
                <Button
                  variant="default"
                  size="icon"
                  className=" justify-center cursor-pointer"
                  onClick={() => setIsRightPanelOpen(false)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Note Input */}
              <div className="border-b p-4 h-full flex flex-col">
                <div className="mb-3 flex-1">
                  <NotesEditor
                    value={text}
                    onChange={(content) => setText(content)}
                    placeholder="Write your notes here..."
                    className="bg-white "
                  />
                </div>

                <Button
                  onClick={handleSaveNote}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                  disabled={!notes[selectedUnit.id]?.trim() || isSaving}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save Note'}
                </Button>
              </div>

            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
