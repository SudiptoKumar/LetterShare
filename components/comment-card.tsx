"use client"

import type React from "react"
import { useState, useCallback, useMemo } from "react"
import { formatDistanceToNow } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Heart, MoreVertical, Reply, Trash, Edit, Flag } from "lucide-react"
import type { Comment, Reply as ReplyType } from "@/types/comment"
import { doc, updateDoc, arrayUnion, serverTimestamp, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { RoleBadge } from "@/components/role-badge"
import { ReportDialog } from "@/components/report-dialog"
import { useToast } from "@/hooks/use-toast"
import { safeFirestoreOperation } from "@/utils/firestore-error-handler-fix"

interface CommentCardProps {
  comment: Comment
  currentUser: any
  letterId: string
  onCommentUpdated: (comment: Comment) => void
}

export function CommentCard({ comment, currentUser, letterId, onCommentUpdated }: CommentCardProps) {
  // Core state
  const [uiState, setUiState] = useState({
    isLiked: comment.likes?.includes(currentUser?.uid) || false,
    isReplying: false,
    isEditing: false,
    showDeleteAlert: false,
    showReportDialog: false,
    activeComment: false,
    activeReply: null as string | null,
    isSubmitting: false,
  })

  // Form state
  const [replyContent, setReplyContent] = useState("")
  const [editContent, setEditContent] = useState(comment.content)
  const [quotedContent, setQuotedContent] = useState("")

  // Hooks
  const { toast } = useToast()

  // Derived values
  const isAuthor = useMemo(() => currentUser?.uid === comment.authorId, [currentUser?.uid, comment.authorId])
  const authorInitials = useMemo(() => {
    return (
      comment.authorName
        ?.split(" ")
        .map((n: string) => n[0])
        .join("") || "U"
    )
  }, [comment.authorName])

  const userRole = useMemo(() => {
    if (comment.isAdminReply) return "admin"
    if (comment.authorName === "Admin") return "admin"
    if (comment.authorName === "Letter Share") return "letter-share"
    if (comment.authorName?.toLowerCase().includes("letter share")) return "letter-share"
    return null
  }, [comment.authorName, comment.isAdminReply])

  const formattedDate = useMemo(() => {
    return comment.createdAt
      ? formatDistanceToNow(new Date(comment.createdAt.toDate()), { addSuffix: true })
      : "recently"
  }, [comment.createdAt])

  const likeCount = useMemo(() => comment.likes?.length || 0, [comment.likes])

  // Handler functions
  const handleLike = useCallback(async () => {
    if (!currentUser) return

    try {
      const commentRef = doc(db, "comments", comment.id)
      const newLikes = uiState.isLiked
        ? comment.likes.filter((id: string) => id !== currentUser.uid)
        : [...(comment.likes || []), currentUser.uid]

      // Use our safe operation helper
      await safeFirestoreOperation(
        async () => {
          await updateDoc(commentRef, {
            likes: newLikes,
          })
        },
        undefined,
        (error) => {
          console.error("Error updating like:", error)
          toast({
            title: "Error",
            description: "Failed to update like. Please try again.",
            variant: "destructive",
          })
          return
        },
      )

      // Update local state
      setUiState((prev) => ({ ...prev, isLiked: !prev.isLiked }))

      // Only call onCommentUpdated if the component is still mounted
      // and only if the likes have actually changed
      if (JSON.stringify(comment.likes) !== JSON.stringify(newLikes)) {
        onCommentUpdated({
          ...comment,
          likes: newLikes,
        })
      }
    } catch (error) {
      console.error("Error updating like:", error)
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive",
      })
    }
  }, [comment, currentUser, onCommentUpdated, toast, uiState.isLiked])

  const handleReply = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!replyContent.trim()) return

      setUiState((prev) => ({ ...prev, isSubmitting: true }))

      try {
        // Generate a unique ID for the reply
        const replyId = Date.now().toString()

        const newReply: ReplyType = {
          id: replyId,
          content: replyContent,
          authorId: currentUser.uid,
          authorName: currentUser.displayName || "Anonymous",
          authorPhotoURL: currentUser.photoURL || "",
          createdAt: serverTimestamp() as any,
          likes: [],
          quotedContent: quotedContent || undefined,
        }

        const commentRef = doc(db, "comments", comment.id)
        await updateDoc(commentRef, {
          replies: arrayUnion(newReply),
        })

        // Update local state
        const updatedComment = {
          ...comment,
          replies: [...comment.replies, newReply],
        }

        onCommentUpdated(updatedComment)

        // Reset form
        setReplyContent("")
        setQuotedContent("")
        setUiState((prev) => ({
          ...prev,
          isReplying: false,
          isSubmitting: false,
          activeComment: false,
        }))

        toast({
          title: "Success",
          description: "Reply posted successfully",
          variant: "default",
          className: "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0",
        })
      } catch (error) {
        console.error("Error adding reply:", error)
        setUiState((prev) => ({ ...prev, isSubmitting: false }))
        toast({
          title: "Error",
          description: "Failed to post reply. Please try again.",
          variant: "destructive",
        })
      }
    },
    [comment, currentUser, onCommentUpdated, quotedContent, replyContent, toast],
  )

  const handleEdit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!editContent.trim() || editContent === comment.content) {
        setUiState((prev) => ({ ...prev, isEditing: false }))
        return
      }

      setUiState((prev) => ({ ...prev, isSubmitting: true }))

      try {
        const commentRef = doc(db, "comments", comment.id)
        await updateDoc(commentRef, {
          content: editContent,
          updatedAt: serverTimestamp(),
          isEdited: true,
        })

        // Update local state
        const updatedComment = {
          ...comment,
          content: editContent,
          isEdited: true,
        }

        onCommentUpdated(updatedComment)

        // Exit edit mode
        setUiState((prev) => ({
          ...prev,
          isEditing: false,
          isSubmitting: false,
          activeComment: false,
        }))

        toast({
          title: "Success",
          description: "Comment updated successfully",
          variant: "default",
          className: "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0",
        })
      } catch (error) {
        console.error("Error updating comment:", error)
        setUiState((prev) => ({ ...prev, isSubmitting: false }))
        toast({
          title: "Error",
          description: "Failed to update comment. Please try again.",
          variant: "destructive",
        })
      }
    },
    [comment, editContent, onCommentUpdated, toast],
  )

  const handleDelete = useCallback(async () => {
    try {
      await deleteDoc(doc(db, "comments", comment.id))

      // Update comment count on letter
      const letterRef = doc(db, "letters", letterId)
      await updateDoc(letterRef, {
        commentCount: comment.replies.length > 0 ? 1 : -1,
      })

      // Remove from local state (handled by parent component)
      onCommentUpdated({
        ...comment,
        id: "deleted",
      })

      toast({
        title: "Success",
        description: "Comment deleted successfully",
        variant: "default",
        className: "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0",
      })
    } catch (error) {
      console.error("Error deleting comment:", error)
      toast({
        title: "Error",
        description: "Failed to delete comment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUiState((prev) => ({ ...prev, showDeleteAlert: false }))
    }
  }, [comment, letterId, onCommentUpdated, toast])

  const handleQuoteReply = useCallback((content: string) => {
    setReplyContent("")
    setQuotedContent(content)
    setUiState((prev) => ({
      ...prev,
      isReplying: true,
      activeComment: true,
    }))
  }, [])

  const toggleCommentActive = useCallback(() => {
    setUiState((prev) => ({
      ...prev,
      activeComment: !prev.activeComment,
      activeReply: null,
    }))
  }, [])

  const toggleReplyActive = useCallback((replyId: string) => {
    setUiState((prev) => ({
      ...prev,
      activeReply: prev.activeReply === replyId ? null : replyId,
      activeComment: false,
    }))
  }, [])

  return (
    <div className="flex gap-4">
      <Avatar>
        <AvatarImage src={comment.authorPhotoURL || ""} alt={comment.authorName} />
        <AvatarFallback>{authorInitials}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div
          className={`bg-muted p-4 rounded-lg ${uiState.activeComment ? "bg-violet-50" : ""}`}
          onClick={toggleCommentActive}
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="font-semibold text-xs md:text-base text-violet-900 flex items-center comment-author">
                {comment.authorName || "User"}
                {userRole && <RoleBadge role={userRole} />}
              </div>
              <p className="text-xs text-muted-foreground comment-timestamp">
                {formattedDate}
                {comment.isEdited && <span className="ml-2">(edited)</span>}
              </p>
            </div>
            {uiState.activeComment && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">More options</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isAuthor && (
                    <>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          setUiState((prev) => ({ ...prev, isEditing: true }))
                          setEditContent(comment.content)
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          setUiState((prev) => ({ ...prev, showDeleteAlert: true }))
                        }}
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                  {!isAuthor && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        setUiState((prev) => ({ ...prev, showReportDialog: true }))
                      }}
                    >
                      <Flag className="mr-2 h-4 w-4 text-red-500" />
                      Report
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {uiState.isEditing ? (
            <form onSubmit={handleEdit} className="space-y-2" onClick={(e) => e.stopPropagation()}>
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[100px] text-sm"
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setUiState((prev) => ({ ...prev, isEditing: false }))
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={uiState.isSubmitting || !editContent.trim() || editContent === comment.content}
                >
                  {uiState.isSubmitting ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          ) : (
            <p className="whitespace-pre-line comment-text">{comment.content}</p>
          )}
        </div>

        <div className="flex gap-2 mt-2 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleLike()
            }}
            className={uiState.isLiked ? "text-pink-500" : ""}
          >
            <Heart className={`mr-1 h-4 w-4 ${uiState.isLiked ? "fill-pink-500" : ""}`} />
            {likeCount > 0 && likeCount}
          </Button>

          {uiState.activeComment && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setUiState((prev) => ({ ...prev, isReplying: !prev.isReplying }))
              }}
              className="reaction-btn"
            >
              <Reply className="mr-1 h-4 w-4" />
              Reply
            </Button>
          )}
        </div>

        {uiState.isReplying && (
          <form
            onSubmit={handleReply}
            className="mb-4 pl-4 border-l-2 border-muted"
            onClick={(e) => e.stopPropagation()}
          >
            {quotedContent && (
              <div className="bg-muted/50 p-2 rounded mb-2 text-sm text-muted-foreground border-l-2 border-primary">
                <p className="line-clamp-2">{quotedContent}</p>
              </div>
            )}
            <Textarea
              placeholder="Write a reply..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="min-h-[80px] mb-2"
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setUiState((prev) => ({ ...prev, isReplying: false }))
                  setReplyContent("")
                  setQuotedContent("")
                }}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={uiState.isSubmitting || !replyContent.trim()}>
                {uiState.isSubmitting ? "Posting..." : "Post Reply"}
              </Button>
            </div>
          </form>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-4 pl-4 border-l-2 border-muted">
            {comment.replies.map((reply) => {
              const replyRole =
                reply.authorName === "Admin" || reply.isAdminReply
                  ? "admin"
                  : reply.authorName === "Letter Share"
                    ? "letter-share"
                    : null
              const isReplyFromCurrentUser = reply.authorId === currentUser?.uid

              return (
                <div key={reply.id} className="mt-4">
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={reply.authorPhotoURL || ""} alt={reply.authorName} />
                      <AvatarFallback>{reply.authorName?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div
                        className={`bg-muted p-3 rounded-lg ${uiState.activeReply === reply.id ? "bg-violet-50" : ""}`}
                        onClick={() => toggleReplyActive(reply.id)}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <div className="font-semibold text-xs md:text-sm text-violet-900 flex items-center">
                              {reply.authorName || "User"}
                              {replyRole && <RoleBadge role={replyRole} size="sm" />}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {reply.createdAt
                                ? formatDistanceToNow(new Date(reply.createdAt.toDate()), { addSuffix: true })
                                : "recently"}
                              {reply.isEdited && <span className="ml-2">(edited)</span>}
                            </p>
                          </div>
                          {uiState.activeReply === reply.id && isReplyFromCurrentUser && (
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  // Handle edit reply
                                  // This would need additional state and handlers
                                }}
                                className="text-violet-600 hover:text-violet-700 hover:bg-violet-100 h-7 w-7 p-0"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  // Handle delete reply
                                  // This would need additional state and handlers
                                }}
                                className="text-red-500 hover:text-red-600 hover:bg-red-50 h-7 w-7 p-0"
                              >
                                <Trash className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>

                        {reply.quotedContent && (
                          <div className="bg-white/50 p-2 rounded mb-2 text-xs text-gray-600 border-l-2 border-violet-300">
                            <div className="font-medium text-violet-800 text-xs">{reply.quotedAuthor} wrote:</div>
                            <p className="line-clamp-2 text-xs">{reply.quotedContent}</p>
                          </div>
                        )}

                        <p className="text-sm whitespace-pre-line">{reply.content}</p>
                      </div>

                      <div className="flex gap-2 mt-1">
                        {uiState.activeReply === reply.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleQuoteReply(reply.content)
                            }}
                          >
                            <Reply className="mr-1 h-3 w-3" />
                            Reply
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <ReportDialog
        contentId={comment.id}
        contentType="comment"
        authorId={comment.authorId}
        open={uiState.showReportDialog}
        onOpenChange={(open) => setUiState((prev) => ({ ...prev, showReportDialog: open }))}
      />
      <AlertDialog
        open={uiState.showDeleteAlert}
        onOpenChange={(open) => setUiState((prev) => ({ ...prev, showDeleteAlert: open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your comment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
