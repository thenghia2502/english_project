"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { CurriculumSelectorProps } from "./types"

export default function CurriculumSelector({
  control,
  curriculums,
  selectedCurriculum,
  onCurriculumChange
}: CurriculumSelectorProps) {
  return (
    <FormField
      control={control}
      name="curriculum"
      render={({ field }) => (
        <FormItem className="flex-1">
          <FormLabel className="text-base font-medium text-gray-900">
            Giáo trình gốc:
          </FormLabel>
          <FormControl>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between text-gray-900"
                >
                  {selectedCurriculum?.name || "Chọn giáo trình gốc"}
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="start" className="w-full bg-white text-gray-900">
                {curriculums.map((cur) => (
                  <DropdownMenuItem
                    key={cur.id}
                    onSelect={() => {
                      field.onChange(cur.id)
                      onCurriculumChange()
                    }}
                  >
                    {cur.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}