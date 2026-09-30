"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Heart, ThumbsUp, Star, Smile, Frown, Lightbulb } from "lucide-react"
import { auth } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import { updateLetterReaction } from "@/utils/firestore-error-handler-fix"

interface ReactionButtonProps {
  letterId: string
  reactions: Record<string, string[]>
  onReactionUpdate: (reactions: Record<string, string[]>) => void
}

type ReactionType = "heart" | "like" | "star" | "smile" | "sad" | "insightful"

interface ReactionConfig {
  type: ReactionType
  icon: React.ReactNode
  color: string
  label: string
}

export function ReactionButton({ letterId, reactions = {}, onReactionUpdate }: ReactionButtonProps) {
  const [userReaction, setUserReaction] = useState<ReactionType | null>(null)
  const [reactionCounts, setReactionCounts] = useState<Record<ReactionType, number>>({
    heart: 0,
    like: 0,
    star: 0,
    smile: 0,
    sad: 0,
    insightful: 0,
  })
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()

  const reactionConfigs: ReactionConfig[] = [
    { type: "heart", icon: <Heart className="h-6 w-6" />, color: "text-pink-500", label: "Love" },
    { type: "like", icon: <ThumbsUp className="h-6 w-6" />, color: "text-blue-500", label: "Like" },
    { type: "star", icon: <Star className="h-6 w-6" />, color: "text-amber-500", label: "Inspiring" },
    { type: "smile", icon: <Smile className="h-6 w-6" />, color: "text-yellow-500", label: "Joy" },
    { type: "sad", icon: <Frown className="h-6 w-6" />, color: "text-purple-500", label: "Moving" },
    { type: "insightful", icon: <Lightbulb className="h-6 w-6" />, color: "text-green-500", label: "Insightful" },
  ]

  useEffect(() => {
    if (!auth.currentUser) return

    // Check if user has already reacted
    Object.entries(reactions || {}).forEach(([type, userIds]) => {
      if (userIds.includes(auth.currentUser!.uid)) {
        setUserReaction(type as ReactionType)
      }
    })

    // Count reactions
    const counts: Record<ReactionType, number> = {
      heart: 0,
      like: 0,
      star: 0,
      smile: 0,
      sad: 0,
      insightful: 0,
    }

    Object.entries(reactions || {}).forEach(([type, userIds]) => {
      counts[type as ReactionType] = userIds.length
    })

    setReactionCounts(counts)
  }, [reactions])

  const handleReaction = async (type: ReactionType) => {
    if (!auth.currentUser) return

    try {
      const isAdding = userReaction !== type
      const userId = auth.currentUser.uid

      // Use our helper function to update the reaction
      const success = await updateLetterReaction(letterId, userId, type, isAdding)

      if (success) {
        // If user already has this reaction, remove it
        if (userReaction === type) {
          // Create a copy of the reactions to update
          const updatedReactions = { ...reactions }

          // Remove user from this reaction type
          if (updatedReactions[type]) {
            updatedReactions[type] = updatedReactions[type].filter((id: string) => id !== userId)

            // If array is empty, delete the key
            if (updatedReactions[type].length === 0) {
              delete updatedReactions[type]
            }
          }

          setUserReaction(null)
          onReactionUpdate(updatedReactions)
        } else {
          // If user has a different reaction, remove it first
          const updatedReactions = { ...reactions }

          if (userReaction) {
            if (updatedReactions[userReaction]) {
              updatedReactions[userReaction] = updatedReactions[userReaction].filter((id: string) => id !== userId)

              // If array is empty, delete the key
              if (updatedReactions[userReaction].length === 0) {
                delete updatedReactions[userReaction]
              }
            }
          }

          // Add user to the new reaction type
          if (!updatedReactions[type]) {
            updatedReactions[type] = []
          }

          updatedReactions[type] = [...updatedReactions[type], userId]
          setUserReaction(type)
          onReactionUpdate(updatedReactions)
        }

        // Close the popover
        setIsOpen(false)
      }
    } catch (error) {
      console.error("Error updating reaction:", error)
      toast({
        title: "Error",
        description: "Failed to update reaction. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Get total reaction count
  const totalReactions = Object.values(reactionCounts).reduce((sum, count) => sum + count, 0)

  // Get the primary reaction (the one with the most counts)
  const primaryReaction = Object.entries(reactionCounts).sort(([, countA], [, countB]) => countB - countA)[0]?.[0] as
    | ReactionType
    | undefined

  // Get the config for the primary reaction
  const primaryConfig = primaryReaction
    ? reactionConfigs.find((config) => config.type === primaryReaction)
    : reactionConfigs[0]

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className={`reaction-button ${userReaction ? "active" : ""}`}>
          {userReaction ? (
            <>
              {reactionConfigs.find((config) => config.type === userReaction)?.icon}
              {totalReactions > 0 && <span className="ml-1 text-sm font-medium">{totalReactions}</span>}
            </>
          ) : totalReactions > 0 ? (
            <>
              {primaryConfig?.icon}
              <span className="ml-1 text-sm font-medium">{totalReactions}</span>
            </>
          ) : (
            <Heart className="h-6 w-6" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2">
        <div className="flex gap-2">
          {reactionConfigs.map((config) => (
            <Button
              key={config.type}
              variant="ghost"
              size="sm"
              onClick={() => handleReaction(config.type)}
              className={`p-2 hover:bg-violet-50 ${userReaction === config.type ? "bg-violet-100" : ""}`}
              title={config.label}
            >
              <div className="flex flex-col items-center">
                <div className={config.color}>{config.icon}</div>
                <span className="text-xs mt-1">{config.label}</span>
              </div>
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
