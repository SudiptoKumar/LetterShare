"use client"

import { useState } from "react"
import { auth, db } from "@/lib/firebase"
import { sendEmailVerification as firebaseSendEmailVerification, applyActionCode, type User } from "firebase/auth"
import { doc, updateDoc } from "firebase/firestore"

interface EmailVerificationOptions {
  redirectUrl?: string
  handleCodeInApp?: boolean
}

export function useEmailVerification() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Send verification email with custom options
  const sendVerificationEmail = async (user: User, options: EmailVerificationOptions = {}) => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Default redirect URL points directly to the verification page
      const { redirectUrl = `${window.location.origin}/verify-email`, handleCodeInApp = true } = options

      // Make sure the redirectUrl is properly formatted
      // Firebase will append the oobCode to this URL
      const finalRedirectUrl = new URL(redirectUrl)

      // If there's a continueUrl in the options, add it as a query parameter
      if (options.redirectUrl && options.redirectUrl.includes("continueUrl")) {
        // The redirectUrl already contains the continueUrl, so we don't need to modify it
        console.log("Using provided redirectUrl with continueUrl:", options.redirectUrl)
      } else if (finalRedirectUrl.pathname === "/verify-email") {
        // Add a continueUrl parameter to redirect to the feed page after verification
        finalRedirectUrl.searchParams.set("continueUrl", `${window.location.origin}/feed`)
        console.log("Added continueUrl to redirectUrl:", finalRedirectUrl.toString())
      }

      // Send verification email
      await firebaseSendEmailVerification(user, {
        url: finalRedirectUrl.toString(),
        handleCodeInApp,
      })

      console.log("Verification email sent with redirectUrl:", finalRedirectUrl.toString())

      setSuccess(true)
      return true
    } catch (error: any) {
      console.error("Error sending verification email:", error)
      setError(error.message || "Failed to send verification email. Please try again.")
      return false
    } finally {
      setLoading(false)
    }
  }

  // Verify email with action code
  const verifyEmail = async (actionCode: string) => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Apply the verification code
      await applyActionCode(auth, actionCode)

      // Update user document in Firestore if user is logged in
      if (auth.currentUser) {
        const userRef = doc(db, "users", auth.currentUser.uid)
        await updateDoc(userRef, {
          emailVerified: true,
          updatedAt: new Date(),
        })
      }

      setSuccess(true)
      return true
    } catch (error: any) {
      console.error("Email verification error:", error)

      if (error.code === "auth/invalid-action-code") {
        setError("This verification link has expired or already been used. Please request a new verification email.")
      } else if (error.code === "auth/user-not-found") {
        setError("User account not found. Please register again.")
      } else {
        setError(error.message || "Failed to verify email. Please try again or contact support.")
      }

      return false
    } finally {
      setLoading(false)
    }
  }

  // Check if email is verified
  const checkEmailVerified = async () => {
    try {
      // Force refresh the token to get the latest user info
      if (auth.currentUser) {
        await auth.currentUser.reload()
        return auth.currentUser.emailVerified
      }
      return false
    } catch (error) {
      console.error("Error checking email verification status:", error)
      return false
    }
  }

  return {
    sendVerificationEmail,
    verifyEmail,
    checkEmailVerified,
    loading,
    error,
    success,
  }
}
