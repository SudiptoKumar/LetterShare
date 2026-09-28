"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MessageSquare } from "lucide-react"
import { useRouter } from "next/navigation"
import { auth, db } from "@/lib/firebase"
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

interface MessageUserButtonProps {
  userId: string
  userName: string
  className?: string
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
}

export function MessageUserButton({
  userId,
  userName,
  className,
  variant = "default",
  size = "default",
}: MessageUserButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleClick = async () => {
    try {
      setIsLoading(true)
      const currentUser = auth.currentUser

      if (!currentUser) {
        toast({
          title: "Authentication required",
          description: "Please sign in to send messages",
          variant: "destructive",
        })
        router.push("/login")
        return
      }

      if (currentUser.uid === userId) {
        toast({
          title: "Cannot message yourself",
          description: "You cannot send messages to yourself",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Check if a conversation already exists
      const conversationsRef = collection(db, "conversations")
      const q = query(conversationsRef, where("participants", "array-contains", currentUser.uid))

      const querySnapshot = await getDocs(q)
      let existingConversationId = null

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        if (data.participants && data.participants.includes(userId)) {
          existingConversationId = doc.id
        }
      })

      if (existingConversationId) {
        router.push(`/messages/${existingConversationId}`)
      } else {
        // Get current user's display name
        const currentUserDoc = await getDoc(doc(db, "users", currentUser.uid))
        const currentUserData = currentUserDoc.data()
        const currentUserName = currentUserData?.displayName || "User"

        // Create a new conversation with updated structure
        const newConversation = {
          participants: [currentUser.uid, userId],
          participantNames: {
            [currentUser.uid]: currentUserName,
            [userId]: userName,
          },
          lastMessage: {
            text: "Start a conversation...",
            timestamp: serverTimestamp(),
            senderId: "system",
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          unreadCount: {
            [currentUser.uid]: 0,
            [userId]: 0,
          },
        }

        const conversationRef = await addDoc(conversationsRef, newConversation)
        router.push(`/messages/${conversationRef.id}`)
      }
    } catch (error) {
      console.error("Error creating conversation:", error)
      toast({
        title: "Error",
        description: "Failed to start conversation. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleClick} className={className} variant={variant} size={size} disabled={isLoading}>
      {isLoading ? (
        <div className="flex items-center">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          <span className="ml-2">Loading...</span>
        </div>
      ) : (
        <>
          <MessageSquare className="mr-2 h-4 w-4" />
          Message
        </>
      )}
    </Button>
  )
}
