"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { auth, db, checkUserStatus } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

interface AuthContextType {
  user: any
  userProfile: any
  loading: boolean
  isBlocked: boolean
  isBanned: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  isBlocked: false,
  isBanned: false,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isBlocked, setIsBlocked] = useState(false)
  const [isBanned, setIsBanned] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)

      if (currentUser) {
        try {
          // Check if user is blocked or banned
          const { isBlocked: blocked, isBanned: banned } = await checkUserStatus(currentUser.uid)
          setIsBlocked(blocked)
          setIsBanned(banned)

          // If user is blocked or banned, show message and redirect
          if (blocked || banned) {
            const message = blocked
              ? "Your account has been temporarily blocked. Please contact support for assistance."
              : "Your account has been banned for violating our terms of service."

            toast({
              title: blocked ? "Account Blocked" : "Account Banned",
              description: message,
              variant: "destructive",
            })

            // Sign out and redirect to home
            await auth.signOut()
            router.push("/")
            return
          }

          // Fetch user profile
          const userDoc = await getDoc(doc(db, "users", currentUser.uid))
          if (userDoc.exists()) {
            setUserProfile(userDoc.data())

            // Update localStorage with latest user data
            if (userDoc.data().displayName) {
              localStorage.setItem("userName", userDoc.data().displayName)
            }
            if (userDoc.data().headline) {
              localStorage.setItem("userHeadline", userDoc.data().headline)
            }
          }
        } catch (error) {
          console.error("Error fetching user profile:", error)
        }
      } else {
        setUserProfile(null)
        setIsBlocked(false)
        setIsBanned(false)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [router, toast])

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, isBlocked, isBanned }}>{children}</AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
