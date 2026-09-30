"use client"

import { useState, useEffect } from "react"
import { collection, query, where, onSnapshot, orderBy, getDoc } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { User, Clock } from "lucide-react"

export function ConversationList() {
  const [conversations, setConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentUser = auth.currentUser
    if (!currentUser) return

    const conversationsRef = collection(db, "conversations")
    const q = query(
      conversationsRef,
      where("participants", "array-contains", currentUser.uid),
      orderBy("updatedAt", "desc"),
    )

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const conversationsData: any[] = []

      for (const doc of snapshot.docs) {
        const conversation = doc.data()
        conversation.id = doc.id

        // Find the other participant
        const otherParticipantId = conversation.participants.find((id: string) => id !== currentUser.uid)

        if (otherParticipantId) {
          // Try to get the name from participantNames first (new structure)
          if (conversation.participantNames && conversation.participantNames[otherParticipantId]) {
            conversation.otherParticipantName = conversation.participantNames[otherParticipantId]
          } else {
            // Fall back to fetching from users collection (old structure)
            try {
              const userDoc = await getDoc(doc(db, "users", otherParticipantId))
              if (userDoc.exists()) {
                const userData = userDoc.data()
                conversation.otherParticipantName = userData.displayName || "User"
              } else {
                conversation.otherParticipantName = "Unknown User"
              }
            } catch (err) {
              console.error("Error fetching user:", err)
              conversation.otherParticipantName = "Unknown User"
            }
          }

          // Get unread count for current user
          if (conversation.unreadCount && conversation.unreadCount[currentUser.uid] !== undefined) {
            conversation.unreadCount = conversation.unreadCount[currentUser.uid]
          } else {
            conversation.unreadCount = 0
          }
        }

        conversationsData.push(conversation)
      }

      setConversations(conversationsData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center p-3 rounded-lg border">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="ml-3 space-y-2 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="h-3 w-10" />
          </div>
        ))}
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No conversations yet</p>
        <p className="text-sm text-gray-400 mt-2">Start a conversation by messaging someone from their profile</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {conversations.map((conversation) => {
        const lastMessage = conversation.lastMessage || {}
        const timestamp = lastMessage.timestamp?.toDate()
        const timeAgo = timestamp ? formatDistanceToNow(timestamp, { addSuffix: true }) : "Just now"

        return (
          <Link
            key={conversation.id}
            href={`/messages/${conversation.id}`}
            className="flex items-center p-3 rounded-lg border hover:bg-gray-50 transition-colors"
          >
            <div className="bg-violet-100 h-10 w-10 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-violet-600" />
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-gray-900 truncate">{conversation.otherParticipantName}</h3>
                <span className="text-xs text-gray-500 flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {timeAgo}
                </span>
              </div>
              <p className="text-sm text-gray-500 truncate">{lastMessage.text || "Start a conversation..."}</p>
            </div>
            {conversation.unreadCount > 0 && (
              <span className="ml-2 bg-violet-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                {conversation.unreadCount}
              </span>
            )}
          </Link>
        )
      })}
    </div>
  )
}
