'use client'

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {CSS} from '@dnd-kit/utilities'
import React, {useState} from 'react'

interface VocabularyItem {
  id: string
  word: string
}

const SortableItem = ({id, word}: {id: string; word: string}) => {
  const {attributes, listeners, setNodeRef, transform, transition} =
    useSortable({id})

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-4 bg-white border rounded shadow-sm cursor-move hover:bg-gray-100"
    >
      {word}
    </li>
  )
}

export default function VocabularyList() {
  const [items, setItems] = useState<VocabularyItem[]>([
    {id: '1', word: 'home'},
    {id: '2', word: 'dog'},
    {id: '3', word: 'school'},
    {id: '4', word: 'food'},
  ])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = (event: any) => {
    const {active, over} = event

    if (active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id)
      const newIndex = items.findIndex((item) => item.id === over.id)

      setItems((items) => arrayMove(items, oldIndex, newIndex))
    }
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <h2 className="text-xl font-semibold mb-4">Sắp xếp danh sách từ vựng</h2>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="space-y-2">
            {items.map((item) => (
              <SortableItem key={item.id} id={item.id} word={item.word} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  )
}
