"use client"

import type React from "react"
import { createContext, useState, useCallback } from "react"
import confetti from "canvas-confetti"
import { useWindowSize } from "@/hooks/use-window-size"

type ConfettiContextType = {
  triggerConfetti: () => void
}

export const ConfettiContext = createContext<ConfettiContextType | null>(null)

export function ConfettiProvider({ children }: { children: React.ReactNode }) {
  const { width, height } = useWindowSize()
  const [isConfettiActive, setIsConfettiActive] = useState(false)

  const triggerConfetti = useCallback(() => {
    if (typeof window === "undefined" || isConfettiActive) return

    setIsConfettiActive(true)

    const duration = 3 * 1000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min
    }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        setIsConfettiActive(false)
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)

      // Use either the window dimensions or fallback to reasonable defaults
      const canvasWidth = width || window.innerWidth || 1000
      const canvasHeight = height || window.innerHeight || 800

      // Launch confetti from both sides
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ["#8B5CF6", "#A78BFA", "#C4B5FD", "#DDD6FE", "#EDE9FE"],
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ["#8B5CF6", "#A78BFA", "#C4B5FD", "#DDD6FE", "#EDE9FE"],
      })
    }, 250)
  }, [width, height, isConfettiActive])

  return <ConfettiContext.Provider value={{ triggerConfetti }}>{children}</ConfettiContext.Provider>
}
