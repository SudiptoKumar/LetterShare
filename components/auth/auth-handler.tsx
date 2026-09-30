"use client"

import { useEffect } from "react"
import { auth } from "@/lib/firebase"
import { signInWithCustomToken } from "firebase/auth"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"

export function AuthHandler() {
  const router = useRouter()

  useEffect(() => {
    const handleEmailVerificationToken = async () => {
      try {
        // Check if we have an email verification token
        const token = Cookies.get("emailVerificationToken")

        if (token) {
          // Sign in with the custom token
          await signInWithCustomToken(auth, token)

          // Remove the token
          Cookies.remove("emailVerificationToken")

          // Redirect to feed if not already there
          if (window.location.pathname !== "/feed") {
            router.push("/feed")
          }
        }
      } catch (error) {
        console.error("Error handling email verification token:", error)
      }
    }

    handleEmailVerificationToken()
  }, [router])

  return null
}
