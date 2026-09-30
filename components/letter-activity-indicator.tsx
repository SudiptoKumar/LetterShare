"use client"

import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { onSnapshot, collection, query, where, orderBy, limit } from "firebase/firestore"
import { Eye, MessageSquare } from "lucide-react"

interface LetterActivityIndicatorProps {
  letterId: string
}

export function LetterActivityIndicator({ letterId }: LetterActivityIndicatorProps) {
  const [activeViewers, setActiveViewers] = useState(0)
  const [isCommentActive, setIsCommentActive] = useState(false)

  useEffect(() => {
    // Track active viewers
    const viewersRef = collection(db, "letterViews")
    const viewersQuery = query(viewersRef, where("letterId", "==", letterId), where("active", "==", true))

    const unsubscribeViewers = onSnapshot(viewersQuery, (snapshot) => {
      setActiveViewers(snapshot.size)
    })

    // Track recent comment activity
    const commentsRef = collection(db, "comments")
    const commentsQuery = query(commentsRef, where("letterId", "==", letterId), orderBy("createdAt", "desc"), limit(1))

    const unsubscribeComments = onSnapshot(commentsQuery, (snapshot) => {
      if (!snapshot.empty) {
        const latestComment = snapshot.docs[0].data()

        // Check if comment is recent (within last 2 minutes)
        if (latestComment.createdAt) {
          const commentTime = latestComment.createdAt.toDate()
          const twoMinutesAgo = new Date()
          twoMinutesAgo.setMinutes(twoMinutesAgo.getMinutes() - 2)

          setIsCommentActive(commentTime > twoMinutesAgo)
        }
      }
    })

    return () => {
      unsubscribeViewers()
      unsubscribeComments()
    }
  }, [letterId])

  if (activeViewers <= 1 && !isCommentActive) return null

  return (
    <div className="flex items-center gap-2 text-xs text-violet-600 mt-2">
      {activeViewers > 1 && (
        <div className="flex items-center">
          <span className="pulse-dot"></span>
          <Eye className="h-3 w-3 mr-1" />
          <span>{activeViewers} reading now</span>
        </div>
      )}

      {isCommentActive && (
        <div className="flex items-center">
          <span className="pulse-dot"></span>
          <MessageSquare className="h-3 w-3 mr-1" />
          <span>New comments</span>
        </div>
      )}
    </div>
  )
}
