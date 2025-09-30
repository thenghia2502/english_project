"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { startTransition } from "react"
import { LessonGridProps } from "./types"

export default function LessonGrid({
  control,
  currentItems,
  onItemChange
}: LessonGridProps) {
  return (
    <div className="grid grid-cols-4 grid-rows-6 gap-3 h-[24rem]">
      {currentItems.map((bai) => (
        <FormField
          key={bai.id}
          control={control}
          name="listSelectedUnit"
          render={({ field }) => {
            const value: string[] = Array.isArray(field.value) ? field.value : []
            const isChecked = value.includes(bai.id)

            const handleChange = (checked: boolean) => {
              // Prevent unnecessary updates if value is the same
              const currentlyChecked = value.includes(bai.id)
              if (checked === currentlyChecked) {
                return
              }

              // Use startTransition to mark as non-urgent update
              startTransition(() => {
                const newValue = checked
                  ? [...value, bai.id]
                  : value.filter((v) => v !== bai.id)

                field.onChange(newValue)
                onItemChange()
              })
            }

            // Handle click on the entire FormItem
            const handleItemClick = (e: React.MouseEvent) => {
              // Don't handle if click came from checkbox
              if ((e.target as HTMLElement).closest('input[type="checkbox"]')) {
                return
              }

              e.preventDefault()
              e.stopPropagation()
              handleChange(!isChecked)
            }

            return (
              <FormItem
                className="flex items-center rounded-md p-3 transition-colors border border-gray-500 cursor-pointer hover:bg-gray-50"
                onClick={handleItemClick}
              >
                <FormControl>
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      if (typeof checked === 'boolean') {
                        handleChange(checked)
                      }
                    }}
                    className="mb-0 mr-0 text-gray-900"
                  />
                </FormControl>
                <FormLabel className="text-gray-900 flex-1 ml-3 mb-0 text-sm font-medium cursor-pointer">
                  {bai.name}
                </FormLabel>
              </FormItem>
            )
          }}
        />
      ))}
    </div>
  )
}