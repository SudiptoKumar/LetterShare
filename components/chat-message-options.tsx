"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Edit, Trash } from "lucide-react"
import { doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore"
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
import { useToast } from "@/hooks/use-toast"

interface ChatMessageOptionsProps {
  messageId: string
  content: string
  isAuthor: boolean
  isAdmin: boolean
  onClose: () => void
}

export function ChatMessageOptions({ messageId, content, isAuthor, isAdmin, onClose }: ChatMessageOptionsProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(content)
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleEdit = async () => {
    if (!editContent.trim() || editContent === content) {
      setIsEditing(false)
      return
    }

    setIsSubmitting(true)

    try {
      const messageRef = doc(db, "chat", messageId)
      await updateDoc(messageRef, {
        content: editContent,
        updatedAt: serverTimestamp(),
        isEdited: true,
      })

      toast({
        title: "Success",
        description: "Message updated successfully",
        variant: "default",
        className: "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0",
      })

      setIsEditing(false)
      onClose()
    } catch (error) {
      console.error("Error updating message:", error)
      toast({
        title: "Error",
        description: "Failed to update message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setIsSubmitting(true)

    try {
      await deleteDoc(doc(db, "chat", messageId))

      toast({
        title: "Success",
        description: "Message deleted successfully",
        variant: "default",
        className: "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0",
      })

      onClose()
    } catch (error) {
      console.error("Error deleting message:", error)
      toast({
        title: "Error",
        description: "Failed to delete message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setShowDeleteAlert(false)
    }
  }

  if (isEditing) {
    return (
      <div className="p-2 bg-violet-50 rounded-lg" onClick={(e) => e.stopPropagation()}>
        <Textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          className="min-h-[80px] mb-2 text-sm"
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} className="text-xs h-8">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleEdit}
            disabled={isSubmitting || !editContent.trim() || editContent === content}
            className="text-xs h-8"
          >
            Save
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex gap-1 p-1 bg-violet-50 rounded-lg" onClick={(e) => e.stopPropagation()}>
        {isAuthor && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="text-violet-600 hover:text-violet-700 hover:bg-violet-100 h-7 w-7 p-0"
          >
            <Edit className="h-3 w-3" />
          </Button>
        )}
        {(isAuthor || isAdmin) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteAlert(true)}
            className="text-red-500 hover:text-red-600 hover:bg-red-50 h-7 w-7 p-0"
          >
            <Trash className="h-3 w-3" />
          </Button>
        )}
      </div>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent className="glass-card border-0 rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your message.
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
    </>
  )
}
