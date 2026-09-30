"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { auth, db } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import { LetterCard } from "@/components/letter-card"
import { Button } from "@/components/ui/button"
import { BookmarkX } from "lucide-react"
import type { Letter } from "@/types/letter"

export default function SavedLettersPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [savedLetters, setSavedLetters] = useState<Letter[]>([])
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)

      if (!currentUser) {
        router.push("/login")
      } else {
        fetchSavedLetters(currentUser.uid)
      }
    })

    return () => unsubscribe()
  }, [router])

  const fetchSavedLetters = async (userId: string) => {
    try {
      // Get user's saved letter IDs
      const userRef = doc(db, "users", userId)
      const userDoc = await getDoc(userRef)

      if (!userDoc.exists()) {
        setLoading(false)
        return
      }

      const userData = userDoc.data()
      const savedLetterIds = userData.savedLetters || []

      if (savedLetterIds.length === 0) {
        setLoading(false)
        return
      }

      // Fetch the actual letters
      const letters: Letter[] = []

      // Firestore doesn't support array contains with more than 10 items
      // So we need to batch our requests if there are more than 10 saved letters
      const batchSize = 10
      for (let i = 0; i < savedLetterIds.length; i += batchSize) {
        const batch = savedLetterIds.slice(i, i + batchSize)
        const lettersQuery = query(collection(db, "letters"), where("__name__", "in", batch))

        const querySnapshot = await getDocs(lettersQuery)
        querySnapshot.forEach((doc) => {
          letters.push({
            id: doc.id,
            ...doc.data(),
          } as Letter)
        })
      }

      setSavedLetters(letters)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching saved letters:", error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto content-container">
        <div className="text-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-violet-400 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="text-violet-600 mt-2">Loading your saved letters...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto content-container">
      <h1 className="text-2xl font-playfair text-violet-800 mb-6">Your Saved Letters</h1>

      {savedLetters.length === 0 ? (
        <div className="text-center py-12 bg-white/50 rounded-xl shadow-sm">
          <BookmarkX className="h-12 w-12 text-violet-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-violet-800 mb-2">No saved letters yet</h3>
          <p className="text-violet-600 mb-6">
            When you find letters you want to save, click the bookmark icon to add them to your collection.
          </p>
          <Button onClick={() => router.push("/feed")} className="bg-gradient-to-r from-violet-600 to-purple-600">
            Explore Letters
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {savedLetters.map((letter) => (
            <LetterCard key={letter.id} letter={letter} currentUser={user} />
          ))}
        </div>
      )}
    </div>
  )
}
