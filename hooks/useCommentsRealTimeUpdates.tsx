"use client"

import { useState, useEffect } from "react"
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "@/components/ui/use-toast"

export interface Comment {
  id: string
  letterId: string
  authorId: string
  authorName: string
  authorPhotoURL?: string
  content: string
  createdAt: Timestamp
}

export function useCommentsRealTimeUpdates(letterId: string) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!letterId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    // Create a query WITHOUT ordering (no index required)
    const commentsRef = collection(db, "comments")
    const commentsQuery = query(commentsRef, where("letterId", "==", letterId))

    const unsubscribe = onSnapshot(
      commentsQuery,
      (snapshot) => {
        try {
          const commentsList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Comment[]

          // Sort comments client-side by createdAt in descending order
          commentsList.sort((a, b) => {
            // Handle cases where createdAt might be missing or in different formats
            if (!a.createdAt) return 1
            if (!b.createdAt) return -1

            // Convert to milliseconds for comparison
            const aTime = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : a.createdAt.seconds * 1000

            const bTime = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : b.createdAt.seconds * 1000

            return bTime - aTime // Descending order
          })

          setComments(commentsList)
          setLoading(false)
        } catch (err) {
          console.error("Error processing comments data:", err)
          setError("Failed to process comments data")
          setLoading(false)
        }
      },
      (err) => {
        console.error("Error in comments query:", err)
        setError("Failed to load comments. Please try again later.")
        setLoading(false)

        // Show a toast with the error
        toast({
          title: "Error loading comments",
          description: "There was a problem loading the comments. Please refresh the page.",
          variant: "destructive",
        })
      },
    )

    return () => unsubscribe()
  }, [letterId])

  return { comments, loading, error }
}
