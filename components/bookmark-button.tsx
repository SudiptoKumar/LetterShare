"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Bookmark, BookmarkCheck } from "lucide-react"
import { db, auth } from "@/lib/firebase"
import { doc, getDoc, setDoc, deleteDoc, arrayUnion, arrayRemove, updateDoc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

interface BookmarkButtonProps {
  letterId: string
  className?: string
}

export function BookmarkButton({ letterId, className = "" }: BookmarkButtonProps) {
  const [isSaved, setIsSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const checkIfSaved = async () => {
      if (!auth.currentUser) return

      try {
        // Check if letter is in user's saved collection
        const userRef = doc(db, "users", auth.currentUser.uid)
        const userDoc = await getDoc(userRef)

        if (userDoc.exists()) {
          const userData = userDoc.data()
          setIsSaved(userData.savedLetters?.includes(letterId) || false)
        }

        setIsLoading(false)
      } catch (error) {
        console.error("Error checking saved status:", error)
        setIsLoading(false)
      }
    }

    checkIfSaved()
  }, [letterId])

  const handleToggleSave = async () => {
    if (!auth.currentUser) return

    try {
      const userRef = doc(db, "users", auth.currentUser.uid)
      const userDoc = await getDoc(userRef)

      if (userDoc.exists()) {
        // Update the savedLetters array
        await updateDoc(userRef, {
          savedLetters: isSaved ? arrayRemove(letterId) : arrayUnion(letterId),
        })
      } else {
        // Create user document if it doesn't exist
        await setDoc(userRef, {
          savedLetters: [letterId],
          displayName: auth.currentUser.displayName,
          email: auth.currentUser.email,
          createdAt: new Date(),
        })
      }

      // Also add to a separate collection for easier querying
      if (!isSaved) {
        const savedRef = doc(db, "saved", `${auth.currentUser.uid}_${letterId}`)
        await setDoc(savedRef, {
          userId: auth.currentUser.uid,
          letterId: letterId,
          savedAt: new Date(),
        })
      } else {
        const savedRef = doc(db, "saved", `${auth.currentUser.uid}_${letterId}`)
        await deleteDoc(savedRef)
      }

      setIsSaved(!isSaved)

      toast({
        title: isSaved ? "Removed from collection" : "Saved to collection",
        description: isSaved ? "Letter removed from your saved collection" : "Letter added to your saved collection",
        variant: "default",
        className: "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0",
      })
    } catch (error) {
      console.error("Error saving letter:", error)
      toast({
        title: "Error",
        description: "Failed to save letter. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) return null

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggleSave}
      className={`bookmark-button ${className}`}
      aria-label={isSaved ? "Remove from saved" : "Save letter"}
    >
      {isSaved ? <BookmarkCheck className="h-5 w-5 text-violet-600" /> : <Bookmark className="h-5 w-5" />}
    </Button>
  )
}
