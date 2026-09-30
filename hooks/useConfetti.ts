"use client"

import { useContext, useEffect, useState, useCallback } from "react"
import { ConfettiContext } from "@/components/confetti-provider"

export function useConfetti() {
  const context = useContext(ConfettiContext)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Create a safe trigger function that works even during SSR
  const triggerConfetti = useCallback(() => {
    if (typeof window === "undefined") {
      console.log("Confetti not triggered (SSR)")
      return
    }

    if (!context) {
      console.warn("useConfetti must be used within a ConfettiProvider")
      return
    }

    // Call the actual trigger function from context
    context.triggerConfetti()
  }, [context])

  // Return a safe object that works in all environments
  return {
    triggerConfetti,
  }
}
