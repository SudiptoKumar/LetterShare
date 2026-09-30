"use client"

import { useState, useEffect } from "react"
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"

export function OnlineActivitySection() {
  const [onlineUsers, setOnlineUsers] = useState<any[]>([])

  useEffect(() => {
    // Query for users who are online
    const presenceQuery = query(
      collection(db, "presence"),
      where("status", "==", "online"),
      orderBy("lastSeen", "desc"),
      limit(10),
    )

    const unsubscribe = onSnapshot(presenceQuery, async (snapshot) => {
      const onlineUserIds = snapshot.docs.map((doc) => doc.data().userId)

      if (onlineUserIds.length === 0) {
        setOnlineUsers([])
        return
      }

      // Get user profiles for the online users
      const usersQuery = query(collection(db, "users"), where("uid", "in", onlineUserIds))

      const usersSnapshot = await onSnapshot(usersQuery, (usersSnap) => {
        const users = usersSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setOnlineUsers(users)
      })
    })

    return () => unsubscribe()
  }, [])

  if (onlineUsers.length === 0) return null

  return (
    <div className="online-activity-section">
      <Card className="p-4 glass-card">
        <h3 className="text-lg font-medium mb-3">Online Now</h3>
        <div className="flex flex-wrap gap-2">
          {onlineUsers.map((user) => (
            <div key={user.id} className="flex flex-col items-center">
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.photoURL} alt={user.displayName || "User"} />
                  <AvatarFallback className="bg-violet-100 text-violet-700">
                    {user.displayName?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-1 ring-white"></span>
              </div>
              <span className="text-xs mt-1 text-center">{user.displayName?.split(" ")[0] || "User"}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
