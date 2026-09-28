"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ConversationList } from "@/components/messages/conversation-list"
import { auth } from "@/lib/firebase"
import { MessageCircle } from "lucide-react"

export default function MessagesPage() {
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push("/login")
      } else {
        setIsLoading(false)
      }
    })

    return () => unsubscribe()
  }, [router])

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-5xl h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="rounded-full bg-slate-200 h-16 w-16 mb-4"></div>
          <div className="h-4 bg-slate-200 rounded w-48 mb-2"></div>
          <div className="h-3 bg-slate-200 rounded w-32"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-5xl h-screen">
      <div className="bg-white rounded-xl shadow-md overflow-hidden h-[calc(100vh-2rem)]">
        <div className="border-b p-4">
          <h1 className="text-xl font-semibold text-violet-900 flex items-center">
            <MessageCircle className="h-5 w-5 mr-2" />
            Messages
          </h1>
        </div>

        <ConversationList />
      </div>
    </div>
  )
}
