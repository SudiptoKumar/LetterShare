"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useConfetti } from "@/hooks/useConfetti"

type ConfettiOptions = {
  duration?: number
  particleCount?: number
  spread?: number
  startVelocity?: number
  colors?: string[]
  origin?: { x: number; y: number }
  fadeOut?: boolean
  gravity?: number
  ticks?: number
  zIndex?: number
  disableForReducedMotion?: boolean
}

type ConfettiContextType = {
  fireConfetti: (options?: ConfettiOptions) => void
  stopConfetti: () => void
}

// Create a default context value for SSR
const defaultContextValue: ConfettiContextType = {
  fireConfetti: () => {},
  stopConfetti: () => {},
}

const ConfettiContext = createContext<ConfettiContextType>(defaultContextValue)

export function useConfettiContext() {
  return useContext(ConfettiContext)
}

type ConfettiProviderProps = {
  children: ReactNode
}

export function ConfettiProvider({ children }: ConfettiProviderProps) {
  const { fire, stop } = useConfetti()

  return (
    <ConfettiContext.Provider
      value={{
        fireConfetti: fire,
        stopConfetti: stop,
      }}
    >
      {children}
    </ConfettiContext.Provider>
  )
}
