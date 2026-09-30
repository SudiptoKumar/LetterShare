"use client"

import type React from "react"
import { useState } from "react"
import { useCommentsRealTimeUpdates } from "@/hooks/useCommentsRealTimeUpdates"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, Loader2 } from "lucide-react"
import { createComment, formatCommentDate } from "@/lib/comment-service"

interface CommentSectionProps {
  letterId: string
}

export function CommentSection({ letterId }: CommentSectionProps) {
  const { comments, loading, error } = useCommentsRealTimeUpdates(letterId)
  const { user } = useAuth()
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !newComment.trim() || isSubmitting) return

    setIsSubmitting(true)

    const success = await createComment({
      letterId,
      authorId: user.uid,
      authorName: user.displayName || "Anonymous",
      authorPhotoURL: user.photoURL || "",
      content: newComment.trim(),
    })

    if (success) {
      setNewComment("")
    }

    setIsSubmitting(false)
  }

  return (
    <div className="space-y-6 mt-8">
      <h3 className="text-xl font-semibold">Comments</h3>

      {error && (
        <div className="bg-destructive/10 p-4 rounded-md flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-destructive">{error}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Please try refreshing the page. If the problem persists, contact support.
            </p>
          </div>
        </div>
      )}

      {user && (
        <form onSubmit={handleSubmitComment} className="space-y-4">
          <Textarea
            placeholder="Share your thoughts..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[100px]"
            disabled={isSubmitting}
          />
          <Button type="submit" disabled={!newComment.trim() || isSubmitting} className="ml-auto">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Posting...
              </>
            ) : (
              "Post Comment"
            )}
          </Button>
        </form>
      )}

      <div className="space-y-6">
        {loading ? (
          // Loading skeletons
          Array(3)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-4">
              <Avatar>
                <AvatarImage src={comment.authorPhotoURL || ""} alt={comment.authorName} />
                <AvatarFallback>{comment.authorName.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{comment.authorName}</p>
                  <p className="text-xs text-muted-foreground">{formatCommentDate(comment.createdAt)}</p>
                </div>
                <p className="text-sm">{comment.content}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-muted-foreground py-6">
            No comments yet. Be the first to share your thoughts!
          </p>
        )}
      </div>
    </div>
  )
}
