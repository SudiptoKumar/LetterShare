"use client"

import React from "react"

import type { FunctionComponent } from "react"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Send, UserRound } from "lucide-react"
import { auth, db } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp } from "firebase/firestore"
import type { ChatMessage } from "@/types/chat"
import { format, isToday, isYesterday, isSameDay } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
// Import the ChatMessageOptions component
import { ChatMessageOptions } from "@/components/chat-message-options"

const ChatPage: FunctionComponent = () => {
  const [user, setUser] = useState<any>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  // Add state for active message
  const [activeMessage, setActiveMessage] = useState<string | null>(null)

  useEffect(() => {
    let unsubscribe: () => void

    const authStateChanged = async () => {
      unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser)

        if (!currentUser) {
          router.push("/login")
        } else {
          setLoading(false)
        }
      })
    }

    authStateChanged()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [router])

  useEffect(() => {
    if (!user) return

    const messagesQuery = query(collection(db, "chat"), orderBy("createdAt", "asc"), limit(50))

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const fetchedMessages: ChatMessage[] = []
      snapshot.forEach((doc) => {
        fetchedMessages.push({
          id: doc.id,
          ...doc.data(),
        } as ChatMessage)
      })

      setMessages(fetchedMessages)
      scrollToBottom()
    })

    return () => unsubscribe()
  }, [user])

  useEffect(() => {
    // Scroll to bottom when component mounts
    scrollToBottom()
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim() || !user) return

    try {
      // Make sure we have a valid name to use
      const authorName = user.displayName || localStorage.getItem("userName") || "User"

      await addDoc(collection(db, "chat"), {
        content: newMessage,
        authorId: user.uid,
        authorName: authorName,
        createdAt: serverTimestamp(),
      })

      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  // Function to determine if we should show a date separator
  const shouldShowDateSeparator = (currentMsg: ChatMessage, prevMsg: ChatMessage | null) => {
    if (!prevMsg || !currentMsg.createdAt || !prevMsg.createdAt) return true

    const currentDate = new Date(currentMsg.createdAt.toDate())
    const prevDate = prevMsg?.createdAt?.toDate() ? new Date(prevMsg.createdAt.toDate()) : null

    return !prevDate || !isSameDay(currentDate, prevDate)
  }

  // Function to format the date for the separator
  const formatDateSeparator = (timestamp: any) => {
    if (!timestamp) return ""

    const date = new Date(timestamp.toDate())

    if (isToday(date)) return "Today"
    if (isYesterday(date)) return "Yesterday"

    return format(date, "MMMM d, yyyy")
  }

  // Add a function to toggle active message
  const toggleActiveMessage = (messageId: string) => {
    if (activeMessage === messageId) {
      setActiveMessage(null)
    } else {
      setActiveMessage(messageId)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col h-screen content-container">
        <div className="flex-1 overflow-y-auto p-4 mb-4 glass-card mx-4 rounded-xl">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`flex gap-2 mb-4 ${i % 2 === 0 ? "justify-end" : ""}`}>
              {i % 2 !== 0 && <Skeleton className="h-8 w-8 rounded-full" />}
              <Skeleton className={`h-12 ${i % 2 === 0 ? "w-64" : "w-80"} rounded-lg`} />
            </div>
          ))}
        </div>

        <div className="glass-card rounded-xl p-2 mx-4 mb-4">
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen content-container">
      <div className="flex-1 overflow-y-auto p-4 mb-4 glass-card mx-4 rounded-xl shadow-md" ref={chatContainerRef}>
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-violet-600">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((message, index) => {
              const prevMessage = index > 0 ? messages[index - 1] : null
              const showDateSeparator = shouldShowDateSeparator(message, prevMessage)
              const isCurrentUser = message.authorId === user?.uid
              const currentUser = user

              return (
                <React.Fragment key={message.id}>
                  {showDateSeparator && message.createdAt && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex justify-center my-4"
                    >
                      <div className="bg-gradient-to-r from-violet-100 to-purple-100 text-violet-800 px-4 py-1 rounded-full text-xs font-medium shadow-sm">
                        {formatDateSeparator(message.createdAt)}
                      </div>
                    </motion.div>
                  )}

                  {/* Update the message rendering to include options when active */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className={`flex gap-2 mb-4 ${isCurrentUser ? "justify-end" : ""}`}
                  >
                    {!isCurrentUser && (
                      <div className="h-8 w-8 bg-gradient-to-br from-violet-100 to-purple-100 rounded-full flex items-center justify-center shadow-sm">
                        <UserRound className="h-4 w-4 text-violet-600" />
                      </div>
                    )}

                    <div className="flex flex-col">
                      <div
                        className={`chat-bubble ${isCurrentUser ? "sent" : "received"}`}
                        onClick={() => toggleActiveMessage(message.id)}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div className="font-semibold text-xs">{message.authorName || "User"}</div>
                          <div className="text-xs text-violet-600 ml-2">
                            {message.createdAt ? format(new Date(message.createdAt.toDate()), "h:mm a") : ""}
                          </div>
                        </div>
                        <p className="whitespace-pre-line text-sm">{message.content}</p>
                      </div>

                      {activeMessage === message.id && (
                        <ChatMessageOptions
                          messageId={message.id}
                          content={message.content}
                          isAuthor={message.authorId === currentUser?.uid}
                          isAdmin={currentUser?.email === "admin@lettershare.com"}
                          onClose={() => setActiveMessage(null)}
                        />
                      )}
                    </div>
                  </motion.div>
                </React.Fragment>
              )
            })}
            <div ref={messagesEndRef} />
          </AnimatePresence>
        )}
      </div>

      <form onSubmit={handleSendMessage} className="glass-card rounded-xl p-2 flex gap-2 mx-4 mb-4">
        <Input
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 px-4 py-3 rounded-xl border-2 border-violet-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all"
        />
        <Button
          type="submit"
          disabled={!newMessage.trim()}
          className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl hover:shadow-md transition-all"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}

export default ChatPage
