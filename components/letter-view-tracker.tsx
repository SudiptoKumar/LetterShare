"use client"

import { useEffect, useState } from "react"
import { doc, updateDoc, increment, getDoc, setDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { safeFirestoreOperation } from "@/utils/firestore-error-handler"

interface ViewTrackerProps {
  letterId: string
}

export function LetterViewTracker({ letterId }: ViewTrackerProps) {
  const [hasTracked, setHasTracked] = useState(false)

  useEffect(() => {
    // Only track views if the user is authenticated and we haven't tracked yet
    if (!auth.currentUser || hasTracked || !letterId) return

    const trackView = async () => {
      try {
        // Get the current user ID
        const userId = auth.currentUser?.uid

        // Skip if no user ID
        if (!userId) return

        // Check if this user has already viewed this letter
        const viewKey = `${userId}_${letterId}`
        const viewedLettersString = localStorage.getItem("viewedLetters") || "[]"
        const viewedLetters = JSON.parse(viewedLettersString)

        // If already viewed, don't increment
        if (viewedLetters.includes(viewKey)) return

        // Add to viewed letters
        viewedLetters.push(viewKey)
        localStorage.setItem("viewedLetters", JSON.stringify(viewedLetters))

        // Update view count in Firestore
        await safeFirestoreOperation(
          async () => {
            // First check if the letter exists
            const letterRef = doc(db, "letters", letterId)
            const letterDoc = await getDoc(letterRef)

            if (letterDoc.exists()) {
              // Update the view count
              await updateDoc(letterRef, {
                viewCount: increment(1),
              })
            }

            // Track the view in a separate collection for analytics
            const viewRef = doc(db, "letterViews", `${letterId}_${userId}_${Date.now()}`)
            await setDoc(viewRef, {
              letterId,
              userId,
              timestamp: new Date(),
            })
          },
          undefined,
          (error) => {
            // Only log permission errors, don't show to user
            if (error.type === "permission-denied") {
              console.warn("Permission denied when tracking letter view. This is expected for some users.")
            } else {
              console.error("Error tracking letter view:", error.message)
            }
          },
        )

        setHasTracked(true)
      } catch (error) {
        console.error("Error tracking view:", error)
      }
    }

    // Track the view
    trackView()
  }, [letterId, hasTracked])

  // This component doesn't render anything
  return null
}

export function markInactive(letterId: string) {
  // Only run if user is authenticated
  if (!auth.currentUser) return

  safeFirestoreOperation(
    async () => {
      const letterRef = doc(db, "letters", letterId)
      await updateDoc(letterRef, {
        isActive: false,
      })
    },
    undefined,
    (error) => {
      // Only log permission errors, don't show to user
      if (error.type === "permission-denied") {
        console.warn("Permission denied when marking letter inactive. This is expected for some users.")
      } else {
        console.error("Error marking letter inactive:", error.message)
      }
    },
  )
}
