import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"

export async function updateUserPresence(status: "online" | "offline") {
  if (!auth.currentUser) return

  const userPresenceRef = doc(db, "presence", auth.currentUser.uid)

  try {
    await setDoc(userPresenceRef, {
      userId: auth.currentUser.uid,
      status,
      lastSeen: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error updating presence:", error)
  }
}

export function setupPresenceTracking() {
  if (!auth.currentUser) return

  // Set user as online
  updateUserPresence("online")

  // Set up event listeners for online/offline status
  const handleBeforeUnload = () => {
    updateUserPresence("offline")
  }

  window.addEventListener("beforeunload", handleBeforeUnload)

  // Set up periodic updates to keep presence fresh
  const intervalId = setInterval(() => updateUserPresence("online"), 5 * 60 * 1000) // Every 5 minutes

  return () => {
    clearInterval(intervalId)
    window.removeEventListener("beforeunload", handleBeforeUnload)
    updateUserPresence("offline")
  }
}
