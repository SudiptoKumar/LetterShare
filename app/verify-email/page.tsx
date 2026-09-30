"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { auth } from "@/lib/firebase"
import { sendEnhancedVerificationEmail } from "@/lib/auth-utils"
import { CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState("")
  const [errorCode, setErrorCode] = useState("")
  const [isResendingEmail, setIsResendingEmail] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    // Check for error parameter in URL
    const error = searchParams.get("error")

    if (error) {
      console.log("Error parameter found:", error)
      setStatus("error")
      setErrorCode(error)

      // Set appropriate error message based on error code
      if (error === "missing-code") {
        setErrorMessage(
          "Verification code is missing. Please check your email link or request a new verification email.",
        )
      } else if (error === "auth/invalid-action-code") {
        setErrorMessage(
          "This verification link has expired or already been used. Please request a new verification email.",
        )
      } else if (error === "auth/user-not-found") {
        setErrorMessage("User account not found. Please register again.")
      } else {
        setErrorMessage("Failed to verify email. Please try again or contact support.")
      }
    } else {
      // Check if we have a success flag in session storage
      const successFlag = typeof window !== "undefined" ? sessionStorage.getItem("emailVerificationSuccess") : null

      if (successFlag === "true") {
        setStatus("success")
        // Clear the flag
        sessionStorage.removeItem("emailVerificationSuccess")

        // Redirect to registration success page after a short delay
        setTimeout(() => {
          router.push("/registration-success")
        }, 1500)
      } else {
        // No error or success flag, show generic verification page
        setStatus("loading")
        setErrorMessage("")

        // After a short delay, redirect to login if there's no specific state
        setTimeout(() => {
          setStatus("error")
          setErrorMessage("No verification in progress. Please check your email for a verification link or log in.")
        }, 2000)
      }
    }
  }, [searchParams, router])

  // Countdown timer for resend button
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [countdown])

  const handleResendVerification = async () => {
    if (countdown > 0) return

    setIsResendingEmail(true)
    try {
      const user = auth.currentUser
      if (user) {
        const verificationSent = await sendEnhancedVerificationEmail(user)

        if (verificationSent) {
          setResendSuccess(true)
          setCountdown(60) // 60 seconds countdown for resend
          setErrorMessage("A new verification email has been sent. Please check your inbox.")
        } else {
          throw new Error("Failed to send verification email. Please try again.")
        }
      } else {
        setErrorMessage("You need to be logged in to request a new verification email. Please log in and try again.")
      }
    } catch (error: any) {
      console.error("Error sending verification email:", error)
      setErrorMessage("Failed to send verification email. Please try again later.")
    } finally {
      setIsResendingEmail(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-b from-white to-violet-50">
      <div className="w-full max-w-md">
        <Card className="glass-card border-0 rounded-3xl shadow-xl overflow-hidden">
          <CardHeader className="space-y-1 pb-2">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-purple-100 rounded-full flex items-center justify-center text-violet-600 shadow-inner">
                {status === "loading" ? (
                  <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
                ) : status === "success" ? (
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                ) : (
                  <XCircle className="w-10 h-10 text-red-600" />
                )}
              </div>
            </div>
            <CardTitle className="text-2xl md:text-3xl font-playfair text-center bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent font-semibold">
              {status === "loading"
                ? "Verifying Your Email"
                : status === "success"
                  ? "Email Verified!"
                  : "Verification Failed"}
            </CardTitle>
            <CardDescription className="text-center text-violet-500">
              {status === "loading"
                ? "Please wait while we verify your email address"
                : status === "success"
                  ? "Your email has been successfully verified"
                  : "We encountered an issue verifying your email"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {status === "loading" && (
              <div className="flex justify-center py-8">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="h-2 w-24 bg-violet-200 rounded mb-2"></div>
                  <div className="h-2 w-32 bg-violet-200 rounded"></div>
                </div>
              </div>
            )}

            {status === "success" && (
              <Alert className="bg-green-50 text-green-800 border border-green-200">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  <p>Your email has been successfully verified. You can now access all features of Letter Share.</p>
                  <p className="mt-2">Redirecting to the celebration page...</p>
                </AlertDescription>
              </Alert>
            )}

            {status === "error" && (
              <div className="space-y-4">
                <Alert variant="destructive" className="bg-red-50 text-red-800 border border-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <p>{errorMessage}</p>
                    {errorCode && <p className="mt-1 text-xs opacity-80">Error code: {errorCode}</p>}
                  </AlertDescription>
                </Alert>

                {resendSuccess && (
                  <Alert className="bg-green-50 text-green-800 border border-green-200">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      A new verification email has been sent. Please check your inbox.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="text-center space-y-2">
                  <p className="text-sm text-violet-600">Need a new verification email?</p>
                  <Button
                    onClick={handleResendVerification}
                    variant="outline"
                    className="w-full"
                    disabled={isResendingEmail || countdown > 0}
                  >
                    {isResendingEmail ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : countdown > 0 ? (
                      `Resend in ${countdown}s`
                    ) : (
                      "Resend Verification Email"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-center pb-6">
            <div className="text-sm text-violet-600 text-center">
              {status === "error" && (
                <Link href="/login" className="text-violet-700 font-medium underline-offset-4 hover:underline">
                  Return to login
                </Link>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
