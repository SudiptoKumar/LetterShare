"use client"

import { db } from "@/lib/firebase"
import { doc, onSnapshot, collection, query, where, orderBy } from "firebase/firestore"
import { useState, useEffect } from "react"
import type { Letter } from "@/types/letter"
import type { Comment } from "@/types/comment"

/**
 * Hook to get real-time updates for a letter
 */
export function useLetterRealTimeUpdates(letterId: string) {
  const [letter, setLetter] = useState<Letter | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!letterId) {
      setLoading(false)
      return
    }

    const letterRef = doc(db, "letters", letterId)

    const unsubscribe = onSnapshot(
      letterRef,
      (doc) => {
        if (doc.exists()) {
          setLetter({ id: doc.id, ...doc.data() } as Letter)
        } else {
          setLetter(null)
        }
        setLoading(false)
      },
      (err) => {
        console.error("Error in letter snapshot:", err)
        setError(`Error loading letter: ${err.message}`)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [letterId])

  return { letter, loading, error }
}

/**
 * Hook to get real-time updates for comments on a letter
 */
export function useCommentsRealTimeUpdates(letterId: string) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!letterId) {
      setLoading(false)
      return
    }

    const commentsQuery = query(
      collection(db, "comments"),
      where("letterId", "==", letterId),
      orderBy("createdAt", "asc"),
    )

    const unsubscribe = onSnapshot(
      commentsQuery,
      (snapshot) => {
        const fetchedComments: Comment[] = []
        snapshot.forEach((doc) => {
          fetchedComments.push({
            id: doc.id,
            ...doc.data(),
          } as Comment)
        })

        setComments(fetchedComments)
        setLoading(false)
      },
      (err) => {
        console.error("Error in comments snapshot:", err)
        setError(`Error loading comments: ${err.message}`)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [letterId])

  return { comments, loading, error }
}

/**
 * Hook to get real-time updates for a user's profile
 */
export function useUserProfileRealTimeUpdates(userId: string) {
  const [profile, setProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const userRef = doc(db, "users", userId)

    const unsubscribe = onSnapshot(
      userRef,
      (doc) => {
        if (doc.exists()) {
          setProfile(doc.data())

          // Update localStorage with latest user data
          if (doc.data().displayName) {
            localStorage.setItem("userName", doc.data().displayName)
          }
          if (doc.data().headline) {
            localStorage.setItem("userHeadline", doc.data().headline)
          }
        } else {
          setProfile(null)
        }
        setLoading(false)
      },
      (err) => {
        console.error("Error in user profile snapshot:", err)
        setError(`Error loading profile: ${err.message}`)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [userId])

  return { profile, loading, error }
}

/**
 * Function to check if real-time updates are working properly
 */
export function checkRealTimeUpdates(letterId: string): Promise<boolean> {
  return new Promise((resolve) => {
    // Set up a test listener
    const letterRef = doc(db, "letters", letterId)

    const unsubscribe = onSnapshot(
      letterRef,
      () => {
        // If we get here, real-time updates are working
        unsubscribe()
        resolve(true)
      },
      (error) => {
        console.error("Real-time update test failed:", error)
        unsubscribe()
        resolve(false)
      },
    )

    // Set a timeout in case the listener doesn't fire
    setTimeout(() => {
      unsubscribe()
      resolve(false)
    }, 5000)
  })
}
