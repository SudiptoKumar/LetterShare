import { type User, sendEmailVerification as firebaseSendEmailVerification } from "firebase/auth"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

/**
 * Sends a verification email with enhanced error handling and logging
 */
export async function sendEnhancedVerificationEmail(user: User): Promise<boolean> {
  try {
    // Create a custom action URL that will properly handle the verification
    // We'll use a direct URL structure that preserves all parameters
    const actionCodeSettings = {
      // This URL will receive the verification code directly
      url: `${window.location.origin}/verify-email-handler`,
      // Don't handle code in app - let Firebase handle the deep linking
      handleCodeInApp: false,
    }

    console.log("Sending verification email with settings:", actionCodeSettings)

    // Send the verification email
    await firebaseSendEmailVerification(user, actionCodeSettings)

    // Log success for debugging
    console.log("Verification email sent successfully to:", user.email)

    return true
  } catch (error) {
    // Log detailed error information
    console.error("Failed to send verification email:", error)
    return false
  }
}

/**
 * Updates the user's email verification status in Firestore
 */
export async function updateUserVerificationStatus(userId: string, isVerified: boolean): Promise<boolean> {
  try {
    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, {
      emailVerified: isVerified,
      updatedAt: new Date(),
    })
    return true
  } catch (error) {
    console.error("Failed to update user verification status:", error)
    return false
  }
}

/**
 * Extracts verification parameters from URL with fallbacks
 */
export function extractVerificationParams(url: string): {
  oobCode: string | null
  mode: string | null
  continueUrl: string | null
} {
  try {
    // Create URL object to parse parameters
    const parsedUrl = new URL(url)

    // Try to get oobCode from query parameters
    let oobCode = parsedUrl.searchParams.get("oobCode")
    const mode = parsedUrl.searchParams.get("mode")
    let continueUrl = parsedUrl.searchParams.get("continueUrl")

    // If oobCode is not in query params, check URL hash (fragment)
    if (!oobCode && parsedUrl.hash) {
      const hashParams = new URLSearchParams(parsedUrl.hash.substring(1))
      oobCode = hashParams.get("oobCode")

      // If continueUrl is not in query params, check hash
      if (!continueUrl) {
        continueUrl = hashParams.get("continueUrl")
      }
    }

    // Log extracted parameters for debugging
    console.log("Extracted verification parameters:", { oobCode, mode, continueUrl })

    return { oobCode, mode, continueUrl }
  } catch (error) {
    console.error("Error extracting verification parameters:", error)
    return { oobCode: null, mode: null, continueUrl: null }
  }
}
