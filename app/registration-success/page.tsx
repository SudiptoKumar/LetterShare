"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"
import { useConfetti } from "@/hooks/useConfetti"

export default function RegistrationSuccessPage() {
  const router = useRouter()
  const { triggerConfetti } = useConfetti()
  const [countdown, setCountdown] = useState(5)
  const [redirectUrl, setRedirectUrl] = useState("/feed")
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false)

  useEffect(() => {
    // Only trigger confetti once
    if (!hasTriggeredConfetti) {
      console.log("Triggering confetti animation")
      triggerConfetti()
      setHasTriggeredConfetti(true)
    }

    // Check if there's a stored redirect URL
    const storedRedirectUrl = typeof window !== "undefined" ? sessionStorage.getItem("redirectAfterSuccess") : null

    if (storedRedirectUrl) {
      setRedirectUrl(storedRedirectUrl)
      // Clear the stored URL
      sessionStorage.removeItem("redirectAfterSuccess")
    }

    // Start countdown for automatic redirect
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push(redirectUrl)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router, triggerConfetti, hasTriggeredConfetti])

  const handleContinue = () => {
    router.push(redirectUrl)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-b from-white to-violet-50">
      <div className="w-full max-w-md">
        <Card className="glass-card border-0 rounded-3xl shadow-xl overflow-hidden">
          <CardHeader className="space-y-1 pb-2">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center text-green-600 shadow-inner">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl md:text-3xl font-playfair text-center bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent font-semibold">
              Welcome to Letter Share!
            </CardTitle>
            <CardDescription className="text-center text-green-500">
              Your account has been successfully created and verified
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-gray-600">
                Thank you for joining our community. You can now start sharing and discovering letters.
              </p>
              <p className="text-sm text-gray-500">Redirecting to the home page in {countdown} seconds...</p>
            </div>
            <Button
              onClick={handleContinue}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg transition-all hover:-translate-y-0.5"
            >
              Continue to Letter Share
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
