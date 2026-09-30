import type { FirebaseError } from "firebase/app"

// Error types
export type FirestoreErrorType = "permission-denied" | "missing-index" | "not-found" | "network" | "unknown"

export interface FirestoreErrorInfo {
  type: FirestoreErrorType
  message: string
  indexUrl?: string
  originalError: FirebaseError
}

/**
 * Handles Firestore errors and returns structured error information
 */
export function handleFirestoreError(error: any): FirestoreErrorInfo {
  // Default error info
  const defaultError: FirestoreErrorInfo = {
    type: "unknown",
    message: "An unexpected error occurred. Please try again later.",
    originalError: error as FirebaseError,
  }

  // If it's not a Firebase error, return the default
  if (!error || !error.code) {
    return defaultError
  }

  // Handle specific error codes
  switch (error.code) {
    case "permission-denied":
      return {
        type: "permission-denied",
        message: "You don't have permission to access this data. Please check your account permissions.",
        originalError: error,
      }

    case "failed-precondition":
      // Check if it's an index error
      if (error.message.includes("The query requires an index")) {
        const indexUrl = error.message.match(/https:\/\/console\.firebase\.google\.com[^\s]+/)
        return {
          type: "missing-index",
          message: "This query requires a Firestore index. Please contact the administrator.",
          indexUrl: indexUrl ? indexUrl[0] : undefined,
          originalError: error,
        }
      }
      return {
        type: "unknown",
        message: "Operation failed. The system may not be in the right state for this operation.",
        originalError: error,
      }

    case "not-found":
      return {
        type: "not-found",
        message: "The requested document was not found.",
        originalError: error,
      }

    case "unavailable":
    case "deadline-exceeded":
      return {
        type: "network",
        message: "Network error. Please check your connection and try again.",
        originalError: error,
      }

    default:
      return {
        type: "unknown",
        message: error.message || defaultError.message,
        originalError: error,
      }
  }
}

/**
 * Safely executes a Firestore operation with error handling
 */
export async function safeFirestoreOperation<T>(
  operation: () => Promise<T>,
  fallbackValue: T,
  onError?: (error: FirestoreErrorInfo) => void,
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    const errorInfo = handleFirestoreError(error)

    // Call the error handler if provided
    if (onError) {
      onError(errorInfo)
    } else {
      // Log the error if no handler is provided
      console.error("Firestore operation failed:", errorInfo.message, errorInfo.originalError)
    }

    return fallbackValue
  }
}
