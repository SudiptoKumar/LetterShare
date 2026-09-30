"use client"

import { useEffect } from "react"
import { useConfettiContext } from "./confetti-provider"

type CelebrationProps = {
  trigger?: boolean
  duration?: number
  particleCount?: number
  colors?: string[]
  origin?: { x: number; y: number }
  spread?: number
}

export function Celebration({
  trigger = true,
  duration = 4000,
  particleCount = 150,
  colors,
  origin = { x: 0.5, y: 0.5 },
  spread = 70,
}: CelebrationProps) {
  const { fireConfetti } = useConfettiContext()

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return

    if (trigger) {
      fireConfetti({
        duration,
        particleCount,
        colors,
        origin,
        spread,
      })
    }
  }, [trigger, duration, particleCount, colors, origin, spread, fireConfetti])

  return null
}
