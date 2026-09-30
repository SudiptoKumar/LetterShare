"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tag, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CategoryFilterProps {
  currentCategory: string | null
  onCategoryChange: (category: string | null) => void
}

export function CategoryFilter({ currentCategory, onCategoryChange }: CategoryFilterProps) {
  const categories = [
    "Personal",
    "Advice",
    "Gratitude",
    "Reflection",
    "Confession",
    "Inspiration",
    "Story",
    "Question",
    "Other",
  ]

  const clearFilter = () => {
    onCategoryChange(null)
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-violet-700">Category:</span>
      {currentCategory ? (
        <div className="flex items-center gap-2 bg-violet-100 px-3 py-1.5 rounded-full">
          <Tag className="h-4 w-4 text-violet-700" />
          <span className="text-sm text-violet-700">{currentCategory}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 rounded-full hover:bg-violet-200"
            onClick={clearFilter}
          >
            <X className="h-3 w-3 text-violet-700" />
          </Button>
        </div>
      ) : (
        <Select onValueChange={onCategoryChange}>
          <SelectTrigger className="w-[180px] bg-white/80 backdrop-blur-sm">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                <div className="flex items-center">
                  <Tag className="mr-2 h-4 w-4" />
                  <span>{category}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
