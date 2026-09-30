"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export function useRegistrationSuccess(isSuccess: boolean, redirectDelay = 5000) {
  const router = useRouter()
  const [countdown, setCountdown] = useState(redirectDelay / 1000)

  useEffect(() => {
    if (!isSuccess) return

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          router.push("/registration-success")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isSuccess, router, redirectDelay])

  return { countdown, redirectNow: () => router.push("/registration-success") }
}
