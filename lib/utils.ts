import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Timestamp } from "firebase/firestore"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | Timestamp): string {
  if (date instanceof Timestamp) {
    date = date.toDate()
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

export const formatMessageTime = (timestamp: any) => {
  if (!timestamp) return "Invalid Date"

  try {
    const date = new Date(timestamp.toDate())
    return format(date, "MMM d, yyyy h:mm a")
  } catch (error) {
    console.error("Error formatting timestamp:", error)
    return "Invalid Date"
  }
}
