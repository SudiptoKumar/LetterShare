import type { Timestamp } from "firebase/firestore"

export interface Letter {
  id: string
  title: string
  content: string
  authorId: string
  authorName: string
  createdAt: Timestamp
  updatedAt?: Timestamp
  category?: string
  tags?: string[]
  likes?: string[]
  commentCount?: number
  viewCount?: number
  isHidden?: boolean
  isFlagged?: boolean
  featured?: boolean
  featuredAt?: Timestamp | Date
  status?: "draft" | "published" | "archived"
  authorHeadline?: string
  authorEmail?: string
  isAdminLetter?: boolean
  letterDate?: string
  reactions?: Record<string, string[]>
}

export interface LetterContent {
  id: string
  title: string
  content: string
  authorId: string
  authorName: string
  createdAt: Timestamp
  updatedAt?: Timestamp
  category?: string
  tags?: string[]
  likes?: string[]
  commentCount?: number
  viewCount?: number
  isHidden?: boolean
  isFlagged?: boolean
  featured?: boolean
  featuredAt?: Timestamp | Date
  status?: "draft" | "published" | "archived"
  salutation?: string
  closing?: string
}
