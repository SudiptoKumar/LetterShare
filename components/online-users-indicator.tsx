"use client"

import { useEffect, useState } from "react"
import { db, auth } from "@/lib/firebase"
import { doc, setDoc, onSnapshot, collection, Timestamp, deleteDoc } from "firebase/firestore"
import { Users } from "lucide-react"

export function OnlineUsersIndicator() {
  const [onlineCount, setOnlineCount] = useState(0)

  useEffect(() => {
    // Skip if no authenticated user
    if (!auth.currentUser) return

    // Reference to the presence collection
    const presenceRef = collection(db, "presence")

    // Create a document for this user's presence
    const userPresenceRef = doc(presenceRef, auth.currentUser.uid)

    // Set user as online
    const setUserOnline = async () => {
      await setDoc(userPresenceRef, {
        userId: auth.currentUser?.uid,
        status: "online",
        lastSeen: Timestamp.now(),
      })
    }

    // Set user as offline when they leave
    const setUserOffline = async () => {
      if (auth.currentUser) {
        try {
          await deleteDoc(userPresenceRef)
        } catch (e) {
          console.error("Error removing presence document:", e)
        }
      }
    }

    // Set up presence
    setUserOnline()

    // Set up listener for online users count
    const unsubscribe = onSnapshot(presenceRef, (snapshot) => {
      setOnlineCount(snapshot.size)
    })

    // Clean up presence when component unmounts
    window.addEventListener("beforeunload", setUserOffline)

    // Set up interval to refresh presence every minute
    const interval = setInterval(setUserOnline, 60000)

    return () => {
      unsubscribe()
      clearInterval(interval)
      window.removeEventListener("beforeunload", setUserOffline)
      setUserOffline()
    }
  }, [])

  if (onlineCount <= 1) return null

  return (
    <div className="real-time-indicator flex items-center bg-violet-50 px-2 py-1 rounded-full shadow-sm">
      <span className="pulse-dot mr-2 h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
      <span className="flex items-center">
        <Users className="h-3 w-3 mr-1 text-violet-600" />
        <span className="text-xs font-medium text-violet-700">{onlineCount} online</span>
      </span>
    </div>
  )
}
