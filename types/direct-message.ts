import type { Timestamp } from "firebase/firestore"

export interface DirectMessage {
  id: string
  conversationId: string
  content: string
  senderId: string
  senderName: string
  recipientId: string
  recipientName: string
  createdAt: Timestamp
  read: boolean
  readAt?: Timestamp
}

export interface Conversation {
  id: string
  participantIds: string[]
  participantNames: string[]
  lastMessageContent: string
  lastMessageTime: Timestamp
  lastMessageSenderId: string
  unreadCount: number
  starterId: string
  createdAt: Timestamp
}
