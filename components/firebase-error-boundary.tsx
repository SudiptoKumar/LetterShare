"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { toast } from "@/components/ui/use-toast"

interface FirebaseErrorBoundaryProps {
  children: React.ReactNode
}

export function FirebaseErrorBoundary({ children }: FirebaseErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    // Global error handler for Firebase errors
    const originalConsoleError = console.error

    console.error = (...args) => {
      // Check if this is a Firebase index error
      const errorString = args.join(" ")
      if (errorString.includes("@firebase/firestore") && errorString.includes("requires an index")) {
        // Extract the index URL if possible
        const urlMatch = errorString.match(/https:\/\/console\.firebase\.google\.com[^\s]+/)
        const indexUrl = urlMatch ? urlMatch[0] : null

        // Only show the toast once per session for this specific error
        if (!sessionStorage.getItem("firebase-index-error-shown")) {
          toast({
            title: "Database Optimization Needed",
            description:
              "Some features may not work optimally. The application will continue to function with reduced performance.",
            duration: 10000,
          })

          // Log the URL for developers
          if (indexUrl) {
            console.info("Firebase index creation URL:", indexUrl)
          }

          sessionStorage.setItem("firebase-index-error-shown", "true")
        }

        // Don't set error state as we're handling it gracefully
        return
      }

      // Call the original console.error
      originalConsoleError.apply(console, args)
    }

    // Restore original on cleanup
    return () => {
      console.error = originalConsoleError
    }
  }, [])

  if (hasError) {
    return (
      <div className="p-4 bg-destructive/10 rounded-md">
        <h3 className="font-medium text-destructive">Something went wrong</h3>
        <p className="text-sm mt-1">Please try refreshing the page. If the problem persists, please contact support.</p>
        <button onClick={() => window.location.reload()} className="mt-2 text-sm underline">
          Refresh Page
        </button>
      </div>
    )
  }

  return children
}
