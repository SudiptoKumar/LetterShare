"use client"

import { useState, useEffect } from "react"

export function useScrollHeader(threshold = 50): boolean {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // Determine if we should show or hide based on scroll direction and threshold
      if (currentScrollY > lastScrollY && currentScrollY > threshold) {
        // Scrolling down and past threshold
        setIsVisible(false)
      } else {
        // Scrolling up or at top
        setIsVisible(true)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [lastScrollY, threshold])

  return isVisible
}
