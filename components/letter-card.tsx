"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MessageSquare, MoreVertical, Trash, Edit } from "lucide-react"
import type { Letter } from "@/types/letter"
import { deleteDoc, doc, updateDoc, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useRouter } from "next/navigation"
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
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LetterMessageSection } from "@/components/letter-message-section"
import { motion, AnimatePresence } from "framer-motion"
import { ShareMenu } from "@/components/share-menu"
import { BookmarkButton } from "@/components/bookmark-button"
import { ReactionButton } from "@/components/reaction-button"
import { LetterViewTracker } from "@/components/letter-view-tracker"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface LetterCardProps {
  letter: Letter
  currentUser: any
}

export function LetterCard({ letter, currentUser }: LetterCardProps) {
  // Core state
  const [letterState, setLetterState] = useState<Letter>(letter)
  const [uiState, setUiState] = useState({
    isEditing: false,
    showMessages: false,
    showDeleteAlert: false,
    isDeleting: false,
    showReportDialog: false,
  })

  // Edit form state
  const [editForm, setEditForm] = useState({
    title: letter.title,
    salutation: letter.salutation || "",
    content: letter.content,
    closing: letter.closing || "",
  })

  // Refs
  const cardRef = useRef<HTMLDivElement>(null)
  const letterContentRef = useRef<HTMLDivElement>(null)

  // Hooks
  const router = useRouter()
  const { toast } = useToast()

  // Derived values
  const isAuthor = useMemo(() => currentUser?.uid === letterState.authorId, [currentUser?.uid, letterState.authorId])
  const isAdminLetter = useMemo(() => {
    return (
      letterState.isAdminLetter ||
      letterState.authorId === "admin" ||
      letterState.authorEmail === "admin@lettershare.com" ||
      (letterState.authorName && letterState.authorName.includes("Letter Share"))
    )
  }, [letterState])

  const signatureName = useMemo(() => {
    return isAdminLetter
      ? letterState.authorName
      : letterState.authorName
        ? letterState.authorName.split(" ")[0]
        : "User"
  }, [isAdminLetter, letterState.authorName])

  const userRole = useMemo(() => (isAdminLetter ? "letter-share" : null), [isAdminLetter])

  const formattedDate = useMemo(() => {
    if (!letterState.createdAt) return "recently"

    try {
      // Check if it's a Firestore Timestamp (has toDate method)
      if (typeof letterState.createdAt.toDate === "function") {
        return format(letterState.createdAt.toDate(), "MMMM d, yyyy 'at' h:mm a")
      }

      // Check if it's a serialized timestamp (seconds and nanoseconds fields)
      if (letterState.createdAt.seconds && letterState.createdAt.nanoseconds) {
        const date = new Date(letterState.createdAt.seconds * 1000)
        return format(date, "MMMM d, yyyy 'at' h:mm a")
      }

      // Check if it's a Date object or timestamp that can be parsed by Date
      return format(new Date(letterState.createdAt), "MMMM d, yyyy 'at' h:mm a")
    } catch (error) {
      console.error("Error formatting date:", error)
      return "recently"
    }
  }, [letterState.createdAt])

  // Set up real-time listener for letter updates
  useEffect(() => {
    const letterRef = doc(db, "letters", letterState.id)
    const unsubscribe = onSnapshot(letterRef, (doc) => {
      if (doc.exists()) {
        const updatedLetter = { id: doc.id, ...doc.data() } as Letter
        setLetterState(updatedLetter)

        // Update edit form if not currently editing
        if (!uiState.isEditing) {
          setEditForm({
            title: updatedLetter.title,
            salutation: updatedLetter.salutation || "",
            content: updatedLetter.content,
            closing: updatedLetter.closing || "",
          })
        }
      }
    })

    return () => unsubscribe()
  }, [letterState.id, uiState.isEditing])

  // Handler functions
  const handleDelete = useCallback(async () => {
    try {
      setUiState((prev) => ({ ...prev, isDeleting: true }))
      await deleteDoc(doc(db, "letters", letterState.id))
      toast({
        title: "Success",
        description: "Letter deleted successfully",
        variant: "default",
        className: "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0",
      })
      router.refresh()
    } catch (error) {
      console.error("Error deleting letter:", error)
      setUiState((prev) => ({ ...prev, isDeleting: false }))
      toast({
        title: "Error",
        description: "Failed to delete letter. Please try again.",
        variant: "destructive",
      })
    }
  }, [letterState.id, router, toast])

  const handleSaveEdit = useCallback(async () => {
    try {
      const letterRef = doc(db, "letters", letterState.id)
      await updateDoc(letterRef, {
        title: editForm.title,
        salutation: editForm.salutation,
        content: editForm.content,
        closing: editForm.closing,
        updatedAt: new Date(),
        isEdited: true,
      })

      setUiState((prev) => ({ ...prev, isEditing: false }))
      toast({
        title: "Success",
        description: "Letter updated successfully",
        variant: "default",
        className: "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0",
      })
    } catch (error) {
      console.error("Error updating letter:", error)
      toast({
        title: "Error",
        description: "Failed to update letter. Please try again.",
        variant: "destructive",
      })
    }
  }, [editForm, letterState.id, toast])

  const handleCancelEdit = useCallback(() => {
    setEditForm({
      title: letterState.title,
      salutation: letterState.salutation || "",
      content: letterState.content,
      closing: letterState.closing || "",
    })
    setUiState((prev) => ({ ...prev, isEditing: false }))
  }, [letterState])

  const toggleMessages = useCallback(() => {
    setUiState((prev) => ({ ...prev, showMessages: !prev.showMessages }))
  }, [])

  const handleAuthorClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()
      if (letterState.authorId) {
        router.push(`/profile?userId=${letterState.authorId}`)
      }
    },
    [letterState.authorId, router],
  )

  // UI rendering
  if (uiState.isDeleting) return null

  const author = {
    photoURL: letterState.authorPhotoURL,
    displayName: letterState.authorName,
    headline: letterState.authorHeadline,
  }

  const createdAt = letterState.createdAt

  const formatDate = (date: any) => {
    if (!date) return "recently"

    try {
      if (typeof date.toDate === "function") {
        return format(date.toDate(), "MMMM d, yyyy 'at' h:mm a")
      }

      if (date.seconds && date.nanoseconds) {
        const newDate = new Date(date.seconds * 1000)
        return format(newDate, "MMMM d, yyyy 'at' h:mm a")
      }

      return format(new Date(date), "MMMM d, yyyy 'at' h:mm a")
    } catch (error) {
      console.error("Error formatting date:", error)
      return "recently"
    }
  }

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      ref={cardRef}
    >
      <Card className="mb-6 glass-card rounded-2xl shadow-lg overflow-hidden letter-card">
        <CardHeader className="pb-1 bg-gradient-to-r from-violet-50 to-purple-50 px-3 py-2 md:px-6 md:py-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={author.photoURL || ""} alt={author.displayName || "User"} />
                <AvatarFallback className="bg-violet-100 text-violet-700">
                  {author.displayName?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-medium text-gray-900 author-name">{author.displayName}</span>
                <span className="text-sm text-gray-500 author-headline">{author.headline || "Letter Writer"}</span>
                <span className="text-xs text-gray-400 timestamp">{formatDate(createdAt)}</span>
              </div>
            </div>

            {/* Only show three-dot menu for the author's own letters */}
            {isAuthor && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-violet-100">
                    <MoreVertical className="h-4 w-4 text-violet-600" />
                    <span className="sr-only">More options</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass-card border-0 shadow-lg">
                  <DropdownMenuItem
                    onClick={() => setUiState((prev) => ({ ...prev, isEditing: true }))}
                    className="hover:bg-violet-50 cursor-pointer"
                  >
                    <Edit className="mr-2 h-4 w-4 text-violet-600" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setUiState((prev) => ({ ...prev, showDeleteAlert: true }))}
                    className="hover:bg-red-50 cursor-pointer"
                  >
                    <Trash className="mr-2 h-4 w-4 text-red-500" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>

        {uiState.isEditing ? (
          <CardContent className="p-4 md:p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor={`edit-title-${letterState.id}`} className="text-violet-700">
                  Title
                </Label>
                <Input
                  id={`edit-title-${letterState.id}`}
                  value={editForm.title}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="px-4 py-3 rounded-xl border-2 border-violet-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all"
                />
              </div>
              <div>
                <Label htmlFor={`edit-salutation-${letterState.id}`} className="text-violet-700">
                  Salutation
                </Label>
                <Input
                  id={`edit-salutation-${letterState.id}`}
                  value={editForm.salutation}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, salutation: e.target.value }))}
                  className="px-4 py-3 rounded-xl border-2 border-violet-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all"
                />
              </div>
              <div>
                <Label htmlFor={`edit-content-${letterState.id}`} className="text-violet-700">
                  Content
                </Label>
                <Textarea
                  id={`edit-content-${letterState.id}`}
                  value={editForm.content}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, content: e.target.value }))}
                  className="min-h-[200px] px-4 py-3 rounded-xl border-2 border-violet-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all"
                />
              </div>
              <div>
                <Label htmlFor={`edit-closing-${letterState.id}`} className="text-violet-700">
                  Closing
                </Label>
                <Input
                  id={`edit-closing-${letterState.id}`}
                  value={editForm.closing}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, closing: e.target.value }))}
                  className="px-4 py-3 rounded-xl border-2 border-violet-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleCancelEdit} className="rounded-xl">
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl">
                  Save Changes
                </Button>
              </div>
            </div>
          </CardContent>
        ) : (
          <CardContent className="p-2 md:p-10" ref={letterContentRef}>
            <LetterViewTracker letterId={letterState.id} />

            <h3 className="letter-title">{letterState.title}</h3>
            {letterState.salutation && <p className="letter-salutation">{letterState.salutation}</p>}
            <div>
              <div className="letter-content whitespace-pre-line">{letterState.content}</div>
            </div>
            {letterState.closing && (
              <div className="mt-3 md:mt-4">
                <p className="letter-closing">{letterState.closing}</p>
                <p className="signature text-right">{signatureName}</p>
                {isAdminLetter && letterState.authorTitle && (
                  <p className="text-right text-xs md:text-sm text-gray-700">{letterState.authorTitle}</p>
                )}
                {isAdminLetter && letterState.authorDepartment && (
                  <p className="text-right text-xs md:text-sm text-gray-700">{letterState.authorDepartment}</p>
                )}
              </div>
            )}
          </CardContent>
        )}

        <CardFooter className="pt-0 border-t flex justify-between p-3">
          <div className="flex space-x-4">
            <ReactionButton
              letterId={letterState.id}
              reactions={letterState.reactions || {}}
              onReactionUpdate={(updatedReactions) => {
                setLetterState((prev) => ({
                  ...prev,
                  reactions: updatedReactions,
                }))
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMessages}
              className="comment-button"
              data-firebase-ignore="true"
            >
              <MessageSquare className="mr-1 h-6 w-6" />
              {letterState.commentCount > 0 && <span className="text-sm font-medium">{letterState.commentCount}</span>}
            </Button>

            <BookmarkButton letterId={letterState.id} />
          </div>

          <ShareMenu targetRef={letterContentRef} title={letterState.title} />
        </CardFooter>

        <AnimatePresence>
          {uiState.showMessages && (
            <motion.div
              initial={{ opacity: 1, height: "auto" }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <LetterMessageSection letterId={letterState.id} currentUser={currentUser} />
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      <AlertDialog
        open={uiState.showDeleteAlert}
        onOpenChange={(open) => setUiState((prev) => ({ ...prev, showDeleteAlert: open }))}
      >
        <AlertDialogContent className="glass-card border-0 rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your letter.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600 rounded-xl">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}
