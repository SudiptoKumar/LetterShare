"use client"

import { useState, useEffect, useRef } from "react"
import { format, formatDistanceToNow } from "date-fns"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Edit, Trash, MessageSquare } from "lucide-react"
import { collection, query, where, onSnapshot, deleteDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Comment } from "@/types/comment"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import { RoleBadge } from "@/components/role-badge"
import {
  addLetterComment,
  addLetterReply,
  updateLetterComment,
  deleteLetterComment,
} from "@/actions/letter-message-actions"

interface LetterMessageSectionProps {
  letterId: string
  currentUser: any
}

export function LetterMessageSection({ letterId, currentUser }: LetterMessageSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [deletingComments, setDeletingComments] = useState<string[]>([])
  const { toast } = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [activeComment, setActiveComment] = useState<string | null>(null)
  const [activeReply, setActiveReply] = useState<string | null>(null)

  useEffect(() => {
    const commentsQuery = query(collection(db, "comments"), where("letterId", "==", letterId))

    try {
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

          // Sort comments client-side since we can't use server-side ordering without the index
          fetchedComments.sort((a, b) => {
            if (!a.createdAt || !b.createdAt) return 0
            return a.createdAt.toMillis() - b.createdAt.toMillis()
          })

          setComments(fetchedComments)
          setLoading(false)
          setError(null)

          // Scroll to bottom when new comments are added
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
          }
        },
        (err) => {
          console.error("Error in comments snapshot:", err)
          setError(`Error loading comments: ${err.message}`)
          setLoading(false)
        },
      )

      return () => unsubscribe()
    } catch (error: any) {
      console.error("Error setting up comments listener:", error)
      setError(`Error loading comments: ${error.message}`)
      setLoading(false)
    }
  }, [letterId])

  // Determine if current user is admin
  const isCurrentUserAdmin = () => {
    const userEmail = localStorage.getItem("userEmail")
    return userEmail === "admin@lettershare.com" || currentUser?.email === "admin@lettershare.com"
  }

  // Get appropriate user name based on role
  const getUserDisplayName = () => {
    if (isCurrentUserAdmin()) {
      return "Letter Share"
    }
    return currentUser?.displayName || localStorage.getItem("userName") || "User"
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !currentUser) return

    setSubmitting(true)

    try {
      const authorName = getUserDisplayName()
      const isAdmin = isCurrentUserAdmin()

      await addLetterComment(letterId, newComment, currentUser.uid, authorName, isAdmin, comments.length || 0)

      setNewComment("")

      toast({
        title: "Success",
        description: "Message posted successfully!",
        variant: "default",
        className: "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0",
      })
    } catch (error: any) {
      console.error("Error adding comment:", error)
      setError(`Failed to post comment: ${error.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim() || !currentUser) return

    setSubmitting(true)

    try {
      const parentComment = comments.find((c) => c.id === parentId)
      const authorName = getUserDisplayName()
      const isAdmin = isCurrentUserAdmin()

      await addLetterReply(
        letterId,
        replyContent,
        currentUser.uid,
        authorName,
        isAdmin,
        parentId,
        parentComment?.content,
        parentComment?.authorName,
      )

      setReplyContent("")
      setReplyingTo(null)

      toast({
        title: "Success",
        description: "Reply posted successfully!",
        variant: "default",
        className: "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0",
      })
    } catch (error: any) {
      console.error("Error adding reply:", error)
      setError(`Failed to post reply: ${error.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateComment = async (commentId: string) => {
    if (!editContent.trim()) return

    try {
      await updateLetterComment(commentId, editContent)
      setEditingComment(null)

      toast({
        title: "Success",
        description: "Message updated successfully!",
        variant: "default",
        className: "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0",
      })
    } catch (error: any) {
      console.error("Error updating comment:", error)
      setError(`Failed to update message: ${error.message}`)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      setDeletingComments((prev) => [...prev, commentId])

      // Wait for animation to complete
      setTimeout(async () => {
        // Delete replies first
        const repliesToDelete = comments.filter((c) => c.parentId === commentId)
        for (const reply of repliesToDelete) {
          await deleteDoc(doc(db, "comments", reply.id))
        }

        const totalDeleted = 1 + repliesToDelete.length
        await deleteLetterComment(commentId, letterId, totalDeleted, comments.length || 0)

        toast({
          title: "Success",
          description: "Message deleted successfully!",
          variant: "default",
          className: "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0",
        })

        setDeletingComments((prev) => prev.filter((id) => id !== commentId))
      }, 500)
    } catch (error: any) {
      console.error("Error deleting comment:", error)
      setError(`Failed to delete message: ${error.message}`)
      setDeletingComments((prev) => prev.filter((id) => id !== commentId))
    }
  }

  const startEditing = (comment: Comment) => {
    setEditingComment(comment.id)
    setEditContent(comment.content)
  }

  const cancelEditing = () => {
    setEditingComment(null)
    setEditContent("")
  }

  const startReplying = (commentId: string) => {
    setReplyingTo(commentId)
    setReplyContent("")
  }

  const cancelReplying = () => {
    setReplyingTo(null)
    setReplyContent("")
  }

  // Filter top-level comments and replies
  const topLevelComments = comments.filter((c) => !c.parentId)
  const getReplies = (commentId: string) => comments.filter((c) => c.parentId === commentId)

  // Determine user role
  const getUserRole = (authorName: string, isAdminReply?: boolean) => {
    if (isAdminReply) return "admin"
    if (authorName === "Admin") return "admin"
    if (authorName === "Letter Share") return "letter-share"
    if (authorName?.toLowerCase().includes("letter share")) return "letter-share"
    return null
  }

  const toggleCommentActive = (commentId: string) => {
    setActiveComment((prev) => (prev === commentId ? null : commentId))
  }

  const toggleReplyActive = (replyId: string) => {
    setActiveReply((prev) => (prev === replyId ? null : replyId))
  }

  return (
    <div className="border-t border-gray-200 px-4 py-3 md:px-6 md:py-4 bg-gradient-to-r from-violet-50 to-purple-50">
      {/* Message section header */}
      <div className="flex justify-between items-center mb-3 md:mb-4">
        <h4 className="text-sm md:text-lg font-medium text-violet-900 flex items-center gap-1 md:gap-2">
          <MessageSquare className="w-4 h-4 md:w-5 md:h-5" />
          Letter Messages
        </h4>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4 bg-red-50 border border-red-200 text-red-800">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="mb-4 md:mb-6">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a message about this letter..."
          className="min-h-[100px] px-4 py-3 rounded-xl border-2 border-violet-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all mb-3"
        />
        <Button
          onClick={handleSubmitComment}
          disabled={submitting || !newComment.trim()}
          className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl hover:shadow-md transition-all"
        >
          Post Message
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-violet-400 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="text-violet-600 mt-2">Loading messages...</p>
        </div>
      ) : topLevelComments.length === 0 ? (
        <div className="text-center py-8 bg-white/50 rounded-xl">
          <p className="text-violet-600">No messages yet. Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {topLevelComments.map((comment) => {
            const isCurrentUser = comment.authorId === currentUser?.uid
            const replies = getReplies(comment.id)
            const isDeleting = deletingComments.includes(comment.id)
            const userRole = getUserRole(comment.authorName, comment.isAdminReply)
            const formattedDate = comment.createdAt
              ? format(new Date(comment.createdAt.toDate()), "MMMM d, yyyy 'at' h:mm a")
              : "recently"

            return (
              <AnimatePresence key={comment.id}>
                {!isDeleting ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white rounded-xl shadow-md p-4 md:p-6 glass-card"
                  >
                    <div
                      className={`bg-muted p-4 rounded-lg ${activeComment === comment.id ? "bg-violet-50" : ""}`}
                      onClick={() => toggleCommentActive(comment.id)}
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
                        {activeComment === comment.id && (
                          <div className="flex items-center gap-1 md:gap-2">
                            {isCurrentUser && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    startEditing(comment)
                                  }}
                                  className="text-violet-600 hover:text-violet-700 hover:bg-violet-50"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteComment(comment.id)
                                  }}
                                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                startReplying(comment.id)
                              }}
                              className="text-violet-600 hover:text-violet-700 hover:bg-violet-50"
                            >
                              Reply
                            </Button>
                          </div>
                        )}
                      </div>

                      {editingComment === comment.id ? (
                        <div>
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="min-h-[100px] px-4 py-3 rounded-xl border-2 border-violet-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all mb-3"
                          />
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={cancelEditing}
                              className="rounded-xl bg-transparent"
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleUpdateComment(comment.id)}
                              className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl"
                            >
                              Save Changes
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                      )}

                      <AnimatePresence>
                        {replyingTo === comment.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-3 p-3 bg-violet-50 rounded-lg"
                          >
                            <Textarea
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              placeholder="Write your reply..."
                              className="min-h-[80px] px-4 py-3 rounded-xl border-2 border-violet-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all mb-3"
                            />
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={cancelReplying}
                                className="rounded-xl bg-transparent"
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleSubmitReply(comment.id)}
                                disabled={submitting || !replyContent.trim()}
                                className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl"
                              >
                                Post Reply
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Reply content styling */}
                      <div className="mt-4 space-y-3 pl-4 md:pl-8 border-l-2 border-violet-100">
                        <AnimatePresence>
                          {replies.map((reply) => {
                            const isReplyFromCurrentUser = reply.authorId === currentUser?.uid
                            const isReplyDeleting = deletingComments.includes(reply.id)
                            const replyRole = getUserRole(reply.authorName, reply.isAdminReply)

                            return !isReplyDeleting ? (
                              <motion.div
                                key={reply.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10, height: 0, marginBottom: 0 }}
                                transition={{ duration: 0.3 }}
                                className="bg-violet-50 rounded-lg p-3 md:p-4"
                              >
                                <div
                                  className={`bg-muted p-3 rounded-lg ${activeReply === reply.id ? "bg-violet-50" : ""}`}
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
                                    {activeReply === reply.id && isReplyFromCurrentUser && (
                                      <div className="flex items-center gap-1">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setEditingComment(reply.id)
                                            setEditContent(reply.content)
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
                                            handleDeleteComment(reply.id)
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
                                      <div className="font-medium text-violet-800 text-xs">
                                        {reply.quotedAuthor} wrote:
                                      </div>
                                      <p className="line-clamp-2 text-xs">{reply.quotedContent}</p>
                                    </div>
                                  )}

                                  {editingComment === reply.id ? (
                                    <div>
                                      <Textarea
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        className="min-h-[80px] px-3 py-2 rounded-lg border-2 border-violet-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-all mb-2 text-xs"
                                      />
                                      <div className="flex justify-end space-x-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={cancelEditing}
                                          className="rounded-lg text-xs h-7 bg-transparent"
                                        >
                                          Cancel
                                        </Button>
                                        <Button
                                          size="sm"
                                          onClick={() => handleUpdateComment(reply.id)}
                                          className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-lg text-xs h-7"
                                        >
                                          Save
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-xs md:text-sm text-gray-700 whitespace-pre-wrap comment-text">
                                      {reply.content}
                                    </p>
                                  )}
                                </div>
                              </motion.div>
                            ) : null
                          })}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            )
          })}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  )
}
