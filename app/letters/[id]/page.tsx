"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { auth, db } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import {
  doc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  updateDoc,
  increment,
} from "firebase/firestore"
import type { Letter } from "@/types/letter"
import { LetterCard } from "@/components/letter-card"
import type { Comment } from "@/types/comment"
import { CommentCard } from "@/components/comment-card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface PageProps {
  params: {
    id: string
  }
}

export default function LetterDetailPage({ params }: PageProps) {
  const [user, setUser] = useState<any>(null)
  const [letter, setLetter] = useState<Letter | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<{ message: string; indexUrl?: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)

      if (!currentUser) {
        router.push("/login")
      }
    })

    return () => unsubscribe()
  }, [router])

  useEffect(() => {
    const fetchLetter = async () => {
      try {
        const letterDoc = await getDoc(doc(db, "letters", params.id))

        if (letterDoc.exists()) {
          setLetter({
            id: letterDoc.id,
            ...letterDoc.data(),
          } as Letter)
        } else {
          router.push("/feed")
        }
      } catch (error) {
        console.error("Error fetching letter:", error)
      }
    }

    const fetchComments = async () => {
      try {
        // Use a simpler query without ordering to avoid index errors
        const commentsQuery = query(collection(db, "comments"), where("letterId", "==", params.id))

        const querySnapshot = await getDocs(commentsQuery)

        const fetchedComments: Comment[] = []
        querySnapshot.forEach((doc) => {
          fetchedComments.push({
            id: doc.id,
            ...doc.data(),
          } as Comment)
        })

        // Sort comments client-side as a fallback
        fetchedComments.sort((a, b) => {
          if (!a.createdAt || !b.createdAt) return 0
          return a.createdAt.toMillis() - b.createdAt.toMillis()
        })

        setComments(fetchedComments)

        // Set a warning about the missing index
        setError({
          message: "Comments are displayed in an unoptimized way. An administrator needs to create a Firestore index.",
          indexUrl:
            "https://console.firebase.google.com/v1/r/project/new-letter-1e714/firestore/indexes?create_composite=ClFwcm9qZWN0cy9uZXctbGV0dGVyLTFlNzE0L2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9jb21tZW50cy9pbmRleGVzL18QARoMCghsZXR0ZXJJZBABGg0KCWNyZWF0ZWRBdBACGgwKCF9fbmFtZV9fEAI",
        })
      } catch (error: any) {
        console.error("Error fetching comments:", error)
        setError({
          message: `Error loading comments: ${error.message}`,
        })
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchLetter()
      fetchComments()
    }
  }, [params.id, router])

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newComment.trim() || !user) return

    setSubmitting(true)

    try {
      // Add comment to Firestore
      await addDoc(collection(db, "comments"), {
        letterId: params.id,
        content: newComment,
        authorId: user.uid,
        authorName: user.displayName || "Anonymous",
        authorPhotoURL: user.photoURL || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        likes: [],
        replies: [],
      })

      // Update comment count on letter
      await updateDoc(doc(db, "letters", params.id), {
        commentCount: increment(1),
      })

      // Reset form and refresh comments
      setNewComment("")

      // Refresh comments - use the simpler query to avoid index issues
      const commentsQuery = query(collection(db, "comments"), where("letterId", "==", params.id))

      const querySnapshot = await getDocs(commentsQuery)

      const fetchedComments: Comment[] = []
      querySnapshot.forEach((doc) => {
        fetchedComments.push({
          id: doc.id,
          ...doc.data(),
        } as Comment)
      })

      // Sort client-side
      fetchedComments.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0
        return a.createdAt.toMillis() - b.createdAt.toMillis()
      })

      setComments(fetchedComments)

      // Update letter comment count in state
      if (letter) {
        setLetter({
          ...letter,
          commentCount: (letter.commentCount || 0) + 1,
        })
      }
    } catch (error: any) {
      console.error("Error adding comment:", error)
      setError({
        message: `Failed to post comment: ${error.message}`,
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto p-4">
        <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Skeleton className="h-[300px] w-full mb-8" />

        <div className="space-y-4 mb-8">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-[100px] w-full" />
        </div>

        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!letter) {
    return (
      <div className="container max-w-4xl mx-auto p-4">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Letter not found</h2>
          <p className="text-muted-foreground mb-6">The letter you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => router.push("/feed")}>Return to Feed</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto p-4">
      <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <LetterCard letter={letter} currentUser={user} />

      <div className="mt-8 mb-4">
        <h2 className="text-xl font-semibold mb-4">Comments ({letter.commentCount || 0})</h2>

        {error && (
          <Alert variant={error.indexUrl ? "warning" : "destructive"} className="mb-4">
            <AlertTitle>{error.indexUrl ? "Performance Notice" : "Error"}</AlertTitle>
            <AlertDescription className="flex flex-col gap-2">
              <p>{error.message}</p>
              {error.indexUrl && (
                <a
                  href={error.indexUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-sm font-medium text-blue-600 hover:underline"
                >
                  Create Firestore Index
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              )}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmitComment} className="flex gap-4 mb-8">
          <Avatar>
            <AvatarImage src={user?.photoURL || ""} alt={user?.displayName} />
            <AvatarFallback>{user?.displayName?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={submitting || !newComment.trim()}
                className="bg-gradient-to-r from-pink-400 to-violet-500 hover:from-pink-500 hover:to-violet-600"
              >
                {submitting ? "Posting..." : "Post Comment"}
              </Button>
            </div>
          </div>
        </form>

        <div className="space-y-6">
          {comments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                currentUser={user}
                letterId={params.id}
                onCommentUpdated={(updatedComment) => {
                  setComments(comments.map((c) => (c.id === updatedComment.id ? updatedComment : c)))
                }}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
