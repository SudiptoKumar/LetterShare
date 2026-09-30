"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, AlertCircle } from "lucide-react"
import { auth } from "@/lib/firebase"
import { applyActionCode, signInWithCustomToken } from "firebase/auth"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useConfetti } from "@/hooks/useConfetti"

export default function VerifyEmailHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { triggerConfetti } = useConfetti()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState("")
  const oobCode = searchParams.get("oobCode")
  const continueUrl = searchParams.get("continueUrl") || "/feed?welcome=true"
  const apiKey = searchParams.get("apiKey")

  useEffect(() => {
    const verifyEmail = async () => {
      if (!oobCode) {
        setStatus("error")
        setErrorMessage("No verification code provided.")
        return
      }

      try {
        // Apply the verification code
        await applyActionCode(auth, oobCode)

        // Get the current user
        const user = auth.currentUser

        if (user) {
          // Update the user's emailVerified status in Firestore
          const userRef = doc(db, "users", user.uid)
          const userDoc = await getDoc(userRef)

          if (userDoc.exists()) {
            await updateDoc(userRef, {
              emailVerified: true,
              updatedAt: new Date(),
            })
          }
        }

        // Try to get the custom token from cookies
        const tokenCookie = document.cookie
          .split("; ")
          .find((row) => row.startsWith("emailVerificationToken="))
          ?.split("=")[1]

        if (tokenCookie) {
          try {
            // Sign in with the custom token
            await signInWithCustomToken(auth, tokenCookie)
          } catch (tokenError) {
            console.error("Error signing in with custom token:", tokenError)
          }
        }

        // Set success status and trigger confetti
        setStatus("success")
        triggerConfetti()
      } catch (error: any) {
        console.error("Error verifying email:", error)
        setStatus("error")
        setErrorMessage(error.message || "Failed to verify email. Please try again.")
      }
    }

    verifyEmail()
  }, [oobCode, triggerConfetti])

  const handleContinue = () => {
    // Store the welcome flag in sessionStorage
    sessionStorage.setItem("firstTimeUser", "true")
    router.push(continueUrl)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-b from-white to-violet-50">
      <div className="w-full max-w-md">
        <Card className="glass-card border-0 rounded-3xl shadow-xl overflow-hidden">
          <CardHeader className="space-y-1 pb-2">
            <div className="flex justify-center mb-6">
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center shadow-inner ${
                  status === "success"
                    ? "bg-gradient-to-br from-green-100 to-emerald-100"
                    : status === "error"
                      ? "bg-gradient-to-br from-red-100 to-rose-100"
                      : "bg-gradient-to-br from-blue-100 to-indigo-100"
                }`}
              >
                {status === "loading" ? (
                  <div className="w-10 h-10 border-4 border-t-blue-600 border-b-blue-600 border-l-transparent border-r-transparent rounded-full animate-spin"></div>
                ) : status === "success" ? (
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                ) : (
                  <AlertCircle className="w-10 h-10 text-red-600" />
                )}
              </div>
            </div>
            <CardTitle
              className={`text-2xl md:text-3xl font-playfair text-center bg-clip-text text-transparent font-semibold ${
                status === "success"
                  ? "bg-gradient-to-r from-green-600 to-emerald-600"
                  : status === "error"
                    ? "bg-gradient-to-r from-red-600 to-rose-600"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600"
              }`}
            >
              {status === "loading"
                ? "Verifying Your Email"
                : status === "success"
                  ? "Email Verified!"
                  : "Verification Failed"}
            </CardTitle>
            <CardDescription
              className={`text-center ${
                status === "success" ? "text-green-500" : status === "error" ? "text-red-500" : "text-blue-500"
              }`}
            >
              {status === "loading"
                ? "Please wait while we verify your email address..."
                : status === "success"
                  ? "Your email has been successfully verified"
                  : "We couldn't verify your email address"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === "success" ? (
              <div className="text-center space-y-4">
                <p className="text-gray-600">
                  Thank you for verifying your email address. You can now access all features of Letter Share.
                </p>
                <Button
                  onClick={handleContinue}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg transition-all hover:-translate-y-0.5"
                >
                  Continue to Letter Share
                </Button>
              </div>
            ) : status === "error" ? (
              <div className="text-center space-y-4">
                <p className="text-gray-600">
                  {errorMessage ||
                    "There was a problem verifying your email address. Please try again or contact support."}
                </p>
                <Button
                  onClick={() => router.push("/login")}
                  className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg transition-all hover:-translate-y-0.5"
                >
                  Back to Login
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
