"use client"

import { useEffect, useState } from "react"
import { useConfettiContext } from "./confetti-provider"

export function RegistrationCelebration() {
  const { fireConfetti } = useConfettiContext()
  const [hasTriggered, setHasTriggered] = useState(false)

  useEffect(() => {
    if (!hasTriggered) {
      // First burst from the top center
      fireConfetti({
        origin: { x: 0.5, y: 0.1 },
        spread: 90,
        particleCount: 80,
        colors: ["#FF577F", "#FF884B", "#FFBD59", "#82CD47", "#3EC1D3", "#9336FD"],
        startVelocity: 30,
        gravity: 0.8,
        duration: 3000,
      })

      // Second burst from the bottom
      setTimeout(() => {
        fireConfetti({
          origin: { x: 0.2, y: 0.9 },
          spread: 120,
          particleCount: 60,
          colors: ["#FF577F", "#FF884B", "#FFBD59", "#82CD47", "#3EC1D3", "#9336FD"],
          startVelocity: 45,
          gravity: 0.7,
          duration: 3500,
        })
      }, 250)

      // Third burst from the right
      setTimeout(() => {
        fireConfetti({
          origin: { x: 0.8, y: 0.9 },
          spread: 120,
          particleCount: 60,
          colors: ["#FF577F", "#FF884B", "#FFBD59", "#82CD47", "#3EC1D3", "#9336FD"],
          startVelocity: 45,
          gravity: 0.7,
          duration: 3500,
        })
      }, 500)

      // Final burst from the center
      setTimeout(() => {
        fireConfetti({
          origin: { x: 0.5, y: 0.5 },
          spread: 360,
          particleCount: 100,
          colors: ["#FF577F", "#FF884B", "#FFBD59", "#82CD47", "#3EC1D3", "#9336FD"],
          startVelocity: 30,
          gravity: 0.5,
          duration: 4000,
        })
      }, 750)

      setHasTriggered(true)
    }
  }, [fireConfetti, hasTriggered])

  return null
}
