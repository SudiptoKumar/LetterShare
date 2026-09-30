"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { doc, getDoc, onSnapshot } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { MessageList } from "@/components/messages/message-list"
import { MessageInput } from "@/components/messages/message-input"
import { ArrowLeft, User } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"

export default function DirectMessagePage() {
  const { conversationId } = useParams()
  const [conversation, setConversation] = useState<any>(null)
  const [otherUser, setOtherUser] = useState<{ id: string; name: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const currentUser = auth.currentUser
    if (!currentUser) {
      router.push("/login")
      return
    }

    const unsubscribe = onSnapshot(
      doc(db, "conversations", conversationId as string),
      async (docSnapshot) => {
        if (docSnapshot.exists()) {
          const conversationData = docSnapshot.data()
          setConversation(conversationData)

          // Find the other participant
          const participants = conversationData.participants || []
          const otherParticipantId = participants.find((id: string) => id !== currentUser.uid)

          if (otherParticipantId) {
            // Try to get the name from participantNames first (new structure)
            if (conversationData.participantNames && conversationData.participantNames[otherParticipantId]) {
              setOtherUser({
                id: otherParticipantId,
                name: conversationData.participantNames[otherParticipantId],
              })
            } else {
              // Fall back to fetching from users collection (old structure)
              try {
                const userDoc = await getDoc(doc(db, "users", otherParticipantId))
                if (userDoc.exists()) {
                  const userData = userDoc.data()
                  setOtherUser({
                    id: otherParticipantId,
                    name: userData.displayName || "User",
                  })
                } else {
                  setOtherUser({
                    id: otherParticipantId,
                    name: "Unknown User",
                  })
                }
              } catch (err) {
                console.error("Error fetching user:", err)
                setOtherUser({
                  id: otherParticipantId,
                  name: "Unknown User",
                })
              }
            }
          }
          setLoading(false)
        } else {
          setError("Conversation not found")
          setLoading(false)
          toast({
            title: "Error",
            description: "This conversation doesn't exist or has been deleted.",
            variant: "destructive",
          })
          router.push("/messages")
        }
      },
      (err) => {
        console.error("Error fetching conversation:", err)
        setError("Failed to load conversation")
        setLoading(false)
        toast({
          title: "Error",
          description: "Failed to load conversation. Please try again.",
          variant: "destructive",
        })
      },
    )

    return () => unsubscribe()
  }, [conversationId, router, toast])

  if (loading) {
    return (
      <div className="content-container">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="sm" className="mr-2" asChild>
            <Link href="/messages">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-12 w-5/6" />
          </div>
        </div>
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="content-container">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="sm" className="mr-2" asChild>
            <Link href="/messages">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 text-center">
          <p className="text-red-500">{error}</p>
          <Button className="mt-4" onClick={() => router.push("/messages")}>
            Return to Messages
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="content-container">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" className="mr-2" asChild>
          <Link href="/messages">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Link>
        </Button>
        {otherUser && (
          <div className="flex items-center">
            <h2 className="text-lg font-semibold">{otherUser.name}</h2>
            <Button variant="ghost" size="sm" className="ml-2" asChild>
              <Link href={`/profile/${otherUser.id}`}>
                <User className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </div>

      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-4 mb-4 h-[calc(100vh-240px)] flex flex-col">
        {conversation && conversationId && <MessageList conversationId={conversationId as string} />}
      </div>

      {conversation && conversationId && otherUser && (
        <MessageInput
          conversationId={conversationId as string}
          recipientId={otherUser.id}
          recipientName={otherUser.name}
        />
      )}
    </div>
  )
}
