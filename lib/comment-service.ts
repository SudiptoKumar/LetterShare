import { collection, addDoc, serverTimestamp, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "@/components/ui/use-toast"

interface CommentData {
  letterId: string
  authorId: string
  authorName: string
  authorPhotoURL?: string
  content: string
}

export async function createComment(commentData: CommentData): Promise<boolean> {
  try {
    await addDoc(collection(db, "comments"), {
      ...commentData,
      createdAt: serverTimestamp(),
    })

    toast({
      title: "Comment posted",
      description: "Your comment has been successfully posted.",
    })

    return true
  } catch (error) {
    console.error("Error creating comment:", error)

    toast({
      title: "Failed to post comment",
      description: "There was a problem posting your comment. Please try again.",
      variant: "destructive",
    })

    return false
  }
}

// Helper function to format comment timestamps for display
export function formatCommentDate(timestamp: Timestamp | null | undefined): string {
  if (!timestamp) return "Just now"

  try {
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp.seconds * 1000)

    // Simple relative time formatting
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return "Just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`

    // For older comments, show the actual date
    return date.toLocaleDateString()
  } catch (err) {
    console.error("Error formatting comment date:", err)
    return "Unknown date"
  }
}
