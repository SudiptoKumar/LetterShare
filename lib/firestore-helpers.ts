import { FirebaseError } from "firebase/app"
import { toast } from "@/components/ui/use-toast"

/**
 * Extracts the index creation URL from a Firestore error message
 */
export function extractIndexUrl(error: FirebaseError): string | null {
  if (error.code === "failed-precondition" && error.message.includes("requires an index")) {
    const match = error.message.match(/https:\/\/console\.firebase\.google\.com[^\s]+/)
    return match ? match[0] : null
  }
  return null
}

/**
 * Shows a toast with instructions for creating a Firestore index
 */
export function showIndexErrorToast(error: FirebaseError) {
  const indexUrl = extractIndexUrl(error)

  if (indexUrl) {
    toast({
      title: "Database Index Required",
      description:
        "This feature requires a database index to work properly. Please contact the administrator with this information.",
      variant: "destructive",
      duration: 10000,
    })

    console.info("Index creation URL:", indexUrl)
    return true
  }

  return false
}

/**
 * Handles common Firestore errors with appropriate user feedback
 */
export function handleFirestoreError(error: unknown): string {
  if (error instanceof FirebaseError) {
    // Check for index error first
    if (showIndexErrorToast(error)) {
      return "This feature requires additional setup. Please try again later."
    }

    // Handle other common Firebase errors
    switch (error.code) {
      case "permission-denied":
        return "You do not have permission to perform this action."
      case "not-found":
        return "The requested data could not be found."
      case "resource-exhausted":
        return "The service is temporarily unavailable. Please try again later."
      default:
        return "An error occurred. Please try again later."
    }
  }

  return "An unexpected error occurred. Please try again later."
}
