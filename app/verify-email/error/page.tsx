"use client"

import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { auth } from "@/lib/firebase"
import { sendEmailVerification } from "firebase/auth"
import { XCircle, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function VerificationErrorPage() {
  const searchParams = useSearchParams()
  const errorMessage = searchParams.get("message") || "An unknown error occurred during email verification."
  const [isResendingEmail, setIsResendingEmail] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendError, setResendError] = useState("")

  const handleResendVerification = async () => {
    try {
      setIsResendingEmail(true)
      setResendSuccess(false)
      setResendError("")

      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser, {
          url: `${window.location.origin}/feed`,
          handleCodeInApp: false,
        })
        setResendSuccess(true)
      } else {
        setResendError("You need to be logged in to request a new verification email. Please log in and try again.")
      }
    } catch (error: any) {
      console.error("Error sending verification email:", error)
      setResendError("Failed to send verification email. Please try again later.")
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
                <XCircle className="w-10 h-10 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-2xl md:text-3xl font-playfair text-center bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent font-semibold">
              Verification Failed
            </CardTitle>
            <CardDescription className="text-center text-violet-500">
              We encountered an issue verifying your email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert variant="destructive" className="bg-red-50 text-red-800 border border-red-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>

              {resendSuccess && (
                <Alert className="bg-green-50 text-green-800 border border-green-200">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>A new verification email has been sent. Please check your inbox.</AlertDescription>
                </Alert>
              )}

              {resendError && (
                <Alert variant="destructive" className="bg-red-50 text-red-800 border border-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{resendError}</AlertDescription>
                </Alert>
              )}

              <div className="text-center space-y-2">
                <p className="text-sm text-violet-600">Need a new verification email?</p>
                <Button
                  onClick={handleResendVerification}
                  variant="outline"
                  className="w-full"
                  disabled={isResendingEmail}
                >
                  {isResendingEmail ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Resend Verification Email"
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center pb-6">
            <div className="text-sm text-violet-600 text-center">
              <Link href="/login" className="text-violet-700 font-medium underline-offset-4 hover:underline">
                Return to login
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
