"use server"

import { collection, addDoc, serverTimestamp, updateDoc, deleteDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { safeFirestoreOperation } from "@/utils/firestore-error-handler-fix"

export async function addLetterComment(
  letterId: string,
  content: string,
  authorId: string,
  authorName: string,
  isAdmin: boolean,
  currentCommentCount: number,
) {
  try {
    await safeFirestoreOperation(
      async () => {
        // Add comment to Firestore
        await addDoc(collection(db, "comments"), {
          letterId,
          content,
          authorId,
          authorName,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          likes: [],
          replies: [],
          isAdminReply: isAdmin,
        })

        // Update comment count on letter
        await updateDoc(doc(db, "letters", letterId), {
          commentCount: currentCommentCount + 1,
        })
      },
      undefined,
      (error) => {
        console.error("Error adding comment:", error)
        throw new Error(`Failed to post comment: ${error.message}`)
      },
    )

    return { success: true, message: "Message posted successfully!" }
  } catch (error: any) {
    console.error("Error adding comment:", error)
    throw new Error(`Failed to post comment: ${error.message}`)
  }
}

export async function addLetterReply(
  letterId: string,
  content: string,
  authorId: string,
  authorName: string,
  isAdmin: boolean,
  parentId: string,
  quotedContent?: string,
  quotedAuthor?: string,
) {
  try {
    await addDoc(collection(db, "comments"), {
      letterId,
      content,
      authorId,
      authorName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      likes: [],
      replies: [],
      parentId,
      quotedContent,
      quotedAuthor,
      isAdminReply: isAdmin,
    })

    return { success: true, message: "Reply posted successfully!" }
  } catch (error: any) {
    console.error("Error adding reply:", error)
    throw new Error(`Failed to post reply: ${error.message}`)
  }
}

export async function updateLetterComment(commentId: string, content: string) {
  try {
    await updateDoc(doc(db, "comments", commentId), {
      content,
      updatedAt: serverTimestamp(),
      isEdited: true,
    })

    return { success: true, message: "Message updated successfully!" }
  } catch (error: any) {
    console.error("Error updating comment:", error)
    throw new Error(`Failed to update message: ${error.message}`)
  }
}

export async function deleteLetterComment(
  commentId: string,
  letterId: string,
  totalCommentsToDelete: number,
  currentCommentCount: number,
) {
  try {
    await deleteDoc(doc(db, "comments", commentId))

    // Update comment count on letter
    await updateDoc(doc(db, "letters", letterId), {
      commentCount: Math.max(0, currentCommentCount - totalCommentsToDelete),
    })

    return { success: true, message: "Message deleted successfully!" }
  } catch (error: any) {
    console.error("Error deleting comment:", error)
    throw new Error(`Failed to delete message: ${error.message}`)
  }
}
