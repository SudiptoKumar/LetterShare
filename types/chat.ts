import type { Timestamp } from "firebase/firestore"

export interface ChatMessage {
  id: string
  content: string
  senderId: string
  senderName: string
  receiverId: string
  receiverName: string
  createdAt: Timestamp
  read: boolean
  readAt?: Timestamp
}
