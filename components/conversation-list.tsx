import type React from "react"
import { cn } from "@/lib/utils"
import { formatMessageTime } from "@/lib/utils"
import { UserRound, UserIcon as UserPresenceIndicator } from "lucide-react"
import Link from "next/link"

interface ConversationListProps {
  conversations: any[]
  activeConversationId: string | null
  currentUser: any
}

const ConversationList: React.FC<ConversationListProps> = ({ conversations, activeConversationId, currentUser }) => {
  // Helper function to get the other participant's ID
  const getOtherParticipantId = (participantIds: string[], currentUserId: string) => {
    return participantIds.find((id) => id !== currentUserId) || ""
  }

  // Helper function to get participant name
  const getParticipantName = (conversation: any, userId: string) => {
    // Handle both old and new data structures
    if (conversation.participantNames && typeof conversation.participantNames === "object") {
      // New structure (object with user IDs as keys)
      return conversation.participantNames[userId] || "User"
    } else if (Array.isArray(conversation.participantNames)) {
      // Old structure (array of names)
      const index = conversation.participantIds.indexOf(userId)
      return index !== -1 ? conversation.participantNames[index] : "User"
    }
    return "User"
  }

  // Helper function to get unread count
  const getUnreadCount = (conversation: any, userId: string) => {
    if (!conversation.unreadCount) return 0

    if (typeof conversation.unreadCount === "object") {
      return conversation.unreadCount[userId] || 0
    }

    return conversation.unreadCount || 0
  }

  return (
    <div className="space-y-2">
      {conversations.map((conversation) => {
        const otherParticipantId = getOtherParticipantId(conversation.participantIds, currentUser.uid)
        const otherParticipantName = getParticipantName(conversation, otherParticipantId)
        const unreadCount = getUnreadCount(conversation, currentUser.uid)

        return (
          <Link
            key={conversation.id}
            href={`/messages/${conversation.id}`}
            className={cn(
              "flex items-center p-3 rounded-lg transition-colors",
              conversation.id === activeConversationId ? "bg-violet-100" : "hover:bg-violet-50",
            )}
          >
            <div className="relative mr-3">
              <div className="h-10 w-10 bg-violet-100 rounded-full flex items-center justify-center">
                <UserRound className="h-5 w-5 text-violet-600" />
              </div>
              <UserPresenceIndicator userId={otherParticipantId} className="absolute bottom-0 right-0" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline">
                <h3 className="font-medium text-gray-900 truncate">{otherParticipantName}</h3>
                {conversation.lastMessageTime && (
                  <span className="text-xs text-gray-500">{formatMessageTime(conversation.lastMessageTime)}</span>
                )}
              </div>
              <p className="text-sm text-gray-500 truncate">
                {conversation.lastMessageContent || "Start a conversation"}
              </p>
            </div>
            {unreadCount > 0 && (
              <div className="ml-2 bg-violet-600 text-white text-xs font-medium rounded-full h-5 min-w-5 flex items-center justify-center px-1.5">
                {unreadCount}
              </div>
            )}
          </Link>
        )
      })}
    </div>
  )
}

export default ConversationList
