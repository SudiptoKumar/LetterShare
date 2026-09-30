"use client"

import { useState, useEffect } from "react"
import { collection, query, orderBy, limit, getDocs, startAfter } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { LetterCard } from "@/components/letter-card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { OnlineActivitySection } from "@/components/online-activity-section"
import { ShotBySection } from "@/components/shot-by-section"

export default function FeedPage() {
  const [letters, setLetters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [lastVisible, setLastVisible] = useState<any>(null)
  const [hasMore, setHasMore] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    fetchLetters()
  }, [activeTab])

  const fetchLetters = async (loadMore = false) => {
    try {
      setLoading(true)
      let lettersQuery

      if (activeTab === "all") {
        lettersQuery = query(collection(db, "letters"), orderBy("createdAt", "desc"), limit(10))
      } else if (activeTab === "following") {
        // This would require a list of followed users
        // For now, just show all letters
        lettersQuery = query(collection(db, "letters"), orderBy("createdAt", "desc"), limit(10))
      } else if (activeTab === "trending") {
        lettersQuery = query(collection(db, "letters"), orderBy("viewCount", "desc"), limit(10))
      }

      if (loadMore && lastVisible) {
        lettersQuery = query(
          collection(db, "letters"),
          orderBy("createdAt", "desc"),
          startAfter(lastVisible),
          limit(10),
        )
      }

      const querySnapshot = await getDocs(lettersQuery)

      if (querySnapshot.empty) {
        setHasMore(false)
        setLoading(false)
        return
      }

      const lastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length - 1]
      setLastVisible(lastVisibleDoc)

      const fetchedLetters = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      if (loadMore) {
        setLetters((prev) => [...prev, ...fetchedLetters])
      } else {
        setLetters(fetchedLetters)
      }

      setHasMore(querySnapshot.docs.length === 10)
    } catch (error) {
      console.error("Error fetching letters:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLoadMore = () => {
    if (hasMore) {
      fetchLetters(true)
    }
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Online Activity Section */}
      <OnlineActivitySection />

      {/* Shot By Section */}
      <ShotBySection />

      {/* Feed Tabs */}
      <div className="filter-section">
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="letter-list-section">
            {loading && letters.length === 0 ? (
              Array(3)
                .fill(0)
                .map((_, i) => <Skeleton key={i} className="w-full h-64 mb-4 rounded-xl" />)
            ) : (
              <>
                {letters.map((letter) => (
                  <LetterCard key={letter.id} letter={letter} currentUser={currentUser} />
                ))}

                {hasMore && (
                  <div className="flex justify-center mt-6">
                    <Button
                      onClick={handleLoadMore}
                      disabled={loading}
                      className="bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl"
                    >
                      {loading ? "Loading..." : "Load More"}
                    </Button>
                  </div>
                )}

                {!hasMore && letters.length > 0 && (
                  <p className="text-center text-gray-500 mt-6">No more letters to load</p>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="following" className="letter-list-section">
            {loading && letters.length === 0 ? (
              Array(3)
                .fill(0)
                .map((_, i) => <Skeleton key={i} className="w-full h-64 mb-4 rounded-xl" />)
            ) : (
              <>
                {letters.map((letter) => (
                  <LetterCard key={letter.id} letter={letter} currentUser={currentUser} />
                ))}

                {hasMore && (
                  <div className="flex justify-center mt-6">
                    <Button
                      onClick={handleLoadMore}
                      disabled={loading}
                      className="bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl"
                    >
                      {loading ? "Loading..." : "Load More"}
                    </Button>
                  </div>
                )}

                {!hasMore && letters.length > 0 && (
                  <p className="text-center text-gray-500 mt-6">No more letters to load</p>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="trending" className="letter-list-section">
            {loading && letters.length === 0 ? (
              Array(3)
                .fill(0)
                .map((_, i) => <Skeleton key={i} className="w-full h-64 mb-4 rounded-xl" />)
            ) : (
              <>
                {letters.map((letter) => (
                  <LetterCard key={letter.id} letter={letter} currentUser={currentUser} />
                ))}

                {hasMore && (
                  <div className="flex justify-center mt-6">
                    <Button
                      onClick={handleLoadMore}
                      disabled={loading}
                      className="bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl"
                    >
                      {loading ? "Loading..." : "Load More"}
                    </Button>
                  </div>
                )}

                {!hasMore && letters.length > 0 && (
                  <p className="text-center text-gray-500 mt-6">No more letters to load</p>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
