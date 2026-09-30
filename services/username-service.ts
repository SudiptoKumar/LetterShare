import { db } from "@/lib/firebase"
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore"

// Check if a username is available
export async function isUsernameAvailable(username: string): Promise<boolean> {
  try {
    // Normalize username (lowercase to ensure case-insensitive uniqueness)
    const normalizedUsername = username.toLowerCase()

    // Check the usernames collection
    const usernamesRef = collection(db, "usernames")
    const q = query(usernamesRef, where("username", "==", normalizedUsername))
    const querySnapshot = await getDocs(q)

    return querySnapshot.empty
  } catch (error) {
    console.error("Error checking username availability:", error)
    throw error
  }
}

// Reserve a username for a user
export async function reserveUsername(userId: string, username: string): Promise<boolean> {
  try {
    // Normalize username
    const normalizedUsername = username.toLowerCase()

    // Check if username is available
    const isAvailable = await isUsernameAvailable(normalizedUsername)
    if (!isAvailable) {
      return false
    }

    // Add to usernames collection (for quick lookups)
    await setDoc(doc(db, "usernames", normalizedUsername), {
      userId: userId,
      username: normalizedUsername,
      createdAt: serverTimestamp(),
    })

    // Add to user document
    await setDoc(
      doc(db, "users", userId),
      {
        username: normalizedUsername,
        displayName: username, // Use the original case for display
        lastUsernameChange: serverTimestamp(),
      },
      { merge: true },
    )

    return true
  } catch (error) {
    console.error("Error reserving username:", error)
    throw error
  }
}

// Update a user's username
export async function updateUsername(
  userId: string,
  newUsername: string,
): Promise<{ success: boolean; message: string }> {
  try {
    // Normalize username
    const normalizedNewUsername = newUsername.toLowerCase()

    // Check if new username is available
    const isAvailable = await isUsernameAvailable(normalizedNewUsername)
    if (!isAvailable) {
      return {
        success: false,
        message: "This username is already taken. Please choose another one.",
      }
    }

    // Get user document to check last change date
    const userDoc = await getDoc(doc(db, "users", userId))
    if (!userDoc.exists()) {
      return {
        success: false,
        message: "User not found.",
      }
    }

    const userData = userDoc.data()
    const lastChange = userData.lastUsernameChange as Timestamp

    // Check if user can change username (only once per month)
    if (lastChange) {
      const oneMonthAgo = new Date()
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

      if (lastChange.toDate() > oneMonthAgo) {
        const nextAvailableDate = new Date(lastChange.toDate())
        nextAvailableDate.setMonth(nextAvailableDate.getMonth() + 1)

        return {
          success: false,
          message: `You can only change your username once per month. Next available change: ${nextAvailableDate.toLocaleDateString()}`,
        }
      }
    }

    // Get the old username to delete from usernames collection
    const oldNormalizedUsername = userData.username

    // Add new username to usernames collection
    await setDoc(doc(db, "usernames", normalizedNewUsername), {
      userId: userId,
      username: normalizedNewUsername,
      createdAt: serverTimestamp(),
    })

    // Update user document
    await setDoc(
      doc(db, "users", userId),
      {
        username: normalizedNewUsername,
        displayName: newUsername, // Use the original case for display
        lastUsernameChange: serverTimestamp(),
      },
      { merge: true },
    )

    // Delete old username from usernames collection
    if (oldNormalizedUsername) {
      await setDoc(doc(db, "usernames", oldNormalizedUsername), {
        userId: null,
        deleted: true,
        deletedAt: serverTimestamp(),
      })
    }

    return {
      success: true,
      message: "Username updated successfully!",
    }
  } catch (error) {
    console.error("Error updating username:", error)
    return {
      success: false,
      message: "An error occurred while updating your username. Please try again.",
    }
  }
}

// Get a user's username
export async function getUsernameById(userId: string): Promise<string | null> {
  try {
    const userDoc = await getDoc(doc(db, "users", userId))
    if (!userDoc.exists()) {
      return null
    }

    return userDoc.data().username || null
  } catch (error) {
    console.error("Error getting username:", error)
    return null
  }
}

// Get a user ID by username
export async function getUserIdByUsername(username: string): Promise<string | null> {
  try {
    const normalizedUsername = username.toLowerCase()
    const usernameDoc = await getDoc(doc(db, "usernames", normalizedUsername))

    if (!usernameDoc.exists()) {
      return null
    }

    return usernameDoc.data().userId || null
  } catch (error) {
    console.error("Error getting user by username:", error)
    return null
  }
}
