"use client"

import { useState, useEffect } from "react"
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"

export function ShotBySection() {
  const [topAuthors, setTopAuthors] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    // Query for top letter authors based on view count
    const lettersQuery = query(collection(db, "letters"), orderBy("viewCount", "desc"), limit(5))

    const unsubscribe = onSnapshot(lettersQuery, (snapshot) => {
      // Extract unique authors
      const authors = new Map()

      snapshot.docs.forEach((doc) => {
        const letter = { id: doc.id, ...doc.data() }
        if (!authors.has(letter.authorId)) {
          authors.set(letter.authorId, {
            id: letter.authorId,
            name: letter.authorName,
            photoURL: letter.authorPhotoURL,
            headline: letter.authorHeadline,
          })
        }
      })

      setTopAuthors(Array.from(authors.values()))
    })

    return () => unsubscribe()
  }, [])

  if (topAuthors.length === 0) return null

  return (
    <div className="shot-by-section">
      <Card className="p-4 glass-card">
        <h3 className="text-lg font-medium mb-3">Popular Authors</h3>
        <div className="flex flex-wrap gap-3">
          {topAuthors.map((author) => (
            <div
              key={author.id}
              className="flex flex-col items-center cursor-pointer"
              onClick={() => router.push(`/profile?userId=${author.id}`)}
            >
              <Avatar className="h-12 w-12">
                <AvatarImage src={author.photoURL} alt={author.name || "Author"} />
                <AvatarFallback className="bg-violet-100 text-violet-700">
                  {author.name?.[0]?.toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs mt-1 text-center font-medium">{author.name}</span>
              <span className="text-xs text-gray-500 text-center">
                {author.headline?.split(" ").slice(0, 2).join(" ") || "Writer"}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
