"use client"

import { useState, useEffect, useRef } from "react"
import { collection, query, orderBy, onSnapshot, doc, updateDoc, where } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { formatDistanceToNow } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"

interface MessageListProps {
  conversationId: string
}

export function MessageList({ conversationId }: MessageListProps) {
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const currentUser = auth.currentUser

  useEffect(() => {
    if (!currentUser) return

    const messagesRef = collection(db, "messages")
    const q = query(messagesRef, where("conversationId", "==", conversationId), orderBy("timestamp", "asc"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setMessages(messagesData)
      setLoading(false)

      // Mark messages as read
      const unreadMessages = snapshot.docs.filter(
        (doc) => doc.data().recipientId === currentUser.uid && !doc.data().read,
      )

      unreadMessages.forEach((docSnapshot) => {
        updateDoc(doc(db, "messages", docSnapshot.id), {
          read: true,
        })
      })

      // Update unread count in conversation
      if (unreadMessages.length > 0) {
        updateDoc(doc(db, "conversations", conversationId), {
          [`unreadCount.${currentUser.uid}`]: 0,
        }).catch((err) => console.error("Error updating unread count:", err))
      }
    })

    return () => unsubscribe()
  }, [conversationId, currentUser])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
            <Skeleton className={`h-12 w-3/4 rounded-lg ${i % 2 === 0 ? "rounded-br-none" : "rounded-bl-none"}`} />
          </div>
        ))}
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500 text-center">No messages yet. Start the conversation by sending a message below.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-2">
      {messages.map((message) => {
        const isSent = message.senderId === currentUser?.uid
        const timestamp = message.timestamp?.toDate()
        const timeAgo = timestamp ? formatDistanceToNow(timestamp, { addSuffix: true }) : "Just now"

        return (
          <div key={message.id} className={`flex ${isSent ? "justify-end" : "justify-start"}`}>
            <div className={`chat-bubble ${isSent ? "sent" : "received"}`}>
              {message.text}
              <div className="text-xs text-gray-500 mt-1 text-right">
                {timeAgo}
                {isSent && message.read && <span className="ml-1 text-blue-500">✓</span>}
              </div>
            </div>
          </div>
        )
      })}
      <div ref={messagesEndRef} />
    </div>
  )
}
