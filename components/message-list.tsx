import type React from "react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  senderId: string
  content: string
  timestamp: string
}

interface MessageListProps {
  messages: Message[]
  currentUser: { uid: string }
  conversation: any // Replace 'any' with a more specific type if possible
}

const MessageList: React.FC<MessageListProps> = ({ messages, currentUser, conversation }) => {
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

  const formatMessageTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      return format(date, "MMM d, yyyy h:mm a")
    } catch (error) {
      console.error("Error formatting timestamp:", error)
      return "Invalid Date"
    }
  }

  return (
    <div className="space-y-2 p-4">
      {messages.map((message) => (
        <div key={message.id} className="flex flex-col">
          <div
            className={cn(
              "flex flex-col max-w-[75%]",
              message.senderId === currentUser.uid ? "items-end ml-auto" : "items-start",
            )}
          >
            {message.senderId !== currentUser.uid && (
              <span className="text-xs text-gray-500 mb-1">{getParticipantName(conversation, message.senderId)}</span>
            )}
            <div
              className={cn(
                "rounded-lg px-3 py-2 break-words",
                message.senderId === currentUser.uid
                  ? "bg-violet-600 text-white rounded-br-none"
                  : "bg-gray-100 text-gray-800 rounded-bl-none",
              )}
            >
              {message.content}
            </div>
            <span className="text-xs text-gray-500 mt-1">{formatMessageTime(message.timestamp)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default MessageList
