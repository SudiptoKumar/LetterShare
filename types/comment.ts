import type { Timestamp } from "firebase/firestore"

export interface Comment {
  id: string
  letterId: string
  content: string
  authorId: string
  authorName: string
  createdAt: Timestamp
  updatedAt?: Timestamp
  likes: string[]
  replies?: Reply[]
  isEdited?: boolean
  parentId?: string
  quotedContent?: string
  quotedAuthor?: string
}

export interface Reply {
  id: string
  content: string
  authorId: string
  authorName: string
  createdAt: Timestamp
  likes: string[]
  isEdited?: boolean
  quotedContent?: string
  quotedAuthor?: string
}
