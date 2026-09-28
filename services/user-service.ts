import { auth, db, storage } from "@/lib/firebase"
import { deleteUser } from "firebase/auth"
import { doc, collection, query, where, getDocs, writeBatch } from "firebase/firestore"
import { ref, listAll, deleteObject } from "firebase/storage"

export async function deleteUserAccount(userId: string, isAdmin = false) {
  try {
    // If not admin, verify current user is deleting their own account
    if (!isAdmin && auth.currentUser?.uid !== userId) {
      throw new Error("Unauthorized deletion attempt")
    }

    // Start a batch write
    const batch = writeBatch(db)

    // Delete user's letters
    const lettersQuery = query(collection(db, "letters"), where("authorId", "==", userId))
    const lettersSnapshot = await getDocs(lettersQuery)

    // Track letter IDs for related data deletion
    const letterIds = lettersSnapshot.docs.map((doc) => doc.id)

    // Delete each letter
    lettersSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })

    // Delete user's comments
    const commentsQuery = query(collection(db, "comments"), where("authorId", "==", userId))
    const commentsSnapshot = await getDocs(commentsQuery)
    commentsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })

    // Delete comments on user's letters
    for (const letterId of letterIds) {
      const letterCommentsQuery = query(collection(db, "comments"), where("letterId", "==", letterId))
      const letterCommentsSnapshot = await getDocs(letterCommentsQuery)
      letterCommentsSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref)
      })
    }

    // Delete user's likes
    const likesQuery = query(collection(db, "likes"), where("userId", "==", userId))
    const likesSnapshot = await getDocs(likesQuery)
    likesSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })

    // Delete user's chat messages
    const sentMessagesQuery = query(collection(db, "messages"), where("senderId", "==", userId))
    const sentMessagesSnapshot = await getDocs(sentMessagesQuery)
    sentMessagesSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })

    // Delete user's chat conversations
    const conversationsQuery = query(collection(db, "conversations"), where("participants", "array-contains", userId))
    const conversationsSnapshot = await getDocs(conversationsQuery)
    conversationsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })

    // Delete user's activity logs
    const activityQuery = query(collection(db, "activity"), where("userId", "==", userId))
    const activitySnapshot = await getDocs(activityQuery)
    activitySnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })

    // Delete admin activity logs related to this user
    const adminActivityQuery = query(collection(db, "activity"), where("targetUserId", "==", userId))
    const adminActivitySnapshot = await getDocs(adminActivityQuery)
    adminActivitySnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })

    // Delete user's profile document
    batch.delete(doc(db, "users", userId))

    // Commit all the batch operations
    await batch.commit()

    // Delete user's storage files (profile pictures, etc.)
    try {
      const storageRef = ref(storage, `users/${userId}`)
      const filesList = await listAll(storageRef)

      const deletePromises = filesList.items.map((fileRef) => deleteObject(fileRef))
      await Promise.all(deletePromises)
    } catch (storageError) {
      console.log("No storage files found or error deleting storage:", storageError)
      // Continue with account deletion even if storage deletion fails
    }

    // If not admin deleting a user, delete the Firebase Auth user
    if (!isAdmin) {
      await deleteUser(auth.currentUser!)
    }

    // Set a flag in localStorage to show the deletion message on login page
    if (!isAdmin) {
      localStorage.setItem("accountDeleted", "true")
    }

    return { success: true }
  } catch (error) {
    console.error("Error deleting user account:", error)
    throw error
  }
}
