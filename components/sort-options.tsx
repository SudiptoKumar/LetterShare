"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowUpAZ, Flame, Heart, MessageSquare, Clock } from "lucide-react"

interface SortOptionsProps {
  currentSort: string
  onSortChange: (sortOption: string) => void
  isMobile?: boolean
}

export function SortOptions({ currentSort, onSortChange, isMobile = false }: SortOptionsProps) {
  const sortOptions = [
    { value: "recent", label: "Most Recent", icon: <Clock className="h-4 w-4" /> },
    { value: "popular", label: "Most Reactions", icon: <Heart className="h-4 w-4" /> },
    { value: "comments", label: "Most Comments", icon: <MessageSquare className="h-4 w-4" /> },
    { value: "oldest", label: "Oldest First", icon: <ArrowUpAZ className="h-4 w-4" /> },
    { value: "trending", label: "Trending", icon: <Flame className="h-4 w-4" /> },
  ]

  // Find the current sort option details
  const currentSortOption = sortOptions.find((option) => option.value === currentSort) || sortOptions[0]

  return (
    <div className="flex items-center gap-1">
      {!isMobile && <span className="text-xs text-violet-700">Sort by:</span>}
      <Select value={currentSort} onValueChange={onSortChange}>
        <SelectTrigger
          className={`${isMobile ? "w-auto px-2 py-1 h-8 text-xs" : "w-[180px]"} bg-white/80 backdrop-blur-sm`}
        >
          {isMobile ? (
            <div className="flex items-center">{currentSortOption.icon}</div>
          ) : (
            <SelectValue placeholder="Sort by" />
          )}
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center">
                {option.icon}
                <span className="ml-2 text-xs md:text-sm">{option.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
