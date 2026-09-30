"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { auth } from "@/lib/firebase"
import { Mail, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useEmailVerification } from "@/hooks/useEmailVerification"

export default function EmailVerificationRequiredPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)
  const { sendVerificationEmail, checkEmailVerified } = useEmailVerification()

  // Check if email is already verified
  useEffect(() => {
    const checkVerification = async () => {
      if (auth.currentUser) {
        // Force refresh to get latest status
        await auth.currentUser.reload()

        if (auth.currentUser.emailVerified) {
          // If verified, redirect to feed
          router.push("/feed")
        }
      }
    }

    checkVerification()

    // Set up interval to check periodically
    const interval = setInterval(async () => {
      const isVerified = await checkEmailVerified()
      if (isVerified) {
        router.push("/feed")
      }
    }, 5000) // Check every 5 seconds

    return () => clearInterval(interval)
  }, [router, checkEmailVerified])

  const handleResendVerification = async () => {
    if (countdown > 0) return

    setLoading(true)
    setError(null)

    try {
      if (auth.currentUser) {
        const sent = await sendVerificationEmail(auth.currentUser, {
          redirectUrl: `${window.location.origin}/verify-email?continueUrl=${encodeURIComponent(`${window.location.origin}/feed`)}`,
          handleCodeInApp: false,
        })

        if (sent) {
          setCountdown(60)
        } else {
          throw new Error("Failed to send verification email")
        }
      } else {
        throw new Error("You need to be logged in to request a verification email")
      }
    } catch (error: any) {
      console.error("Error sending verification email:", error)
      setError(error.message || "Failed to send verification email. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [countdown])

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-b from-white to-violet-50">
      <div className="w-full max-w-md">
        <Card className="glass-card border-0 rounded-3xl shadow-xl overflow-hidden">
          <CardHeader className="space-y-1 pb-2">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-purple-100 rounded-full flex items-center justify-center text-violet-600 shadow-inner">
                <Mail className="w-10 h-10 text-violet-600" />
              </div>
            </div>
            <CardTitle className="text-2xl md:text-3xl font-playfair text-center bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent font-semibold">
              Email Verification Required
            </CardTitle>
            <CardDescription className="text-center text-violet-500">
              Please verify your email to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert className="bg-amber-50 text-amber-800 border border-amber-200">
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  <p>You need to verify your email address before accessing this page.</p>
                  <p className="mt-2">Please check your inbox for the verification link we sent you.</p>
                </AlertDescription>
              </Alert>

              {error && (
                <Alert variant="destructive" className="bg-red-50 text-red-800 border border-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="text-center space-y-4">
                <p className="text-sm text-violet-600">
                  Didn't receive the email? Check your spam folder or click below to resend.
                </p>
                <Button
                  onClick={handleResendVerification}
                  disabled={countdown > 0 || loading}
                  variant="outline"
                  className="w-full"
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : "Resend Verification Email"}
                </Button>

                <p className="text-xs text-violet-500 mt-2">
                  This page will automatically redirect you once your email is verified.
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center pb-6">
            <div className="text-sm text-violet-600 text-center">
              <Link href="/logout" className="text-violet-700 font-medium underline-offset-4 hover:underline">
                Sign out
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
