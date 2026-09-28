"use client"

import type React from "react"

import { createContext, useState, useEffect } from "react"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth"
import { auth } from "../firebase"
import type { User } from "firebase/auth"

interface AuthContextProps {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  isAdmin: () => boolean
}

export const AuthContext = createContext<AuthContextProps>({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  isAdmin: () => false,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error: any) {
      throw new Error(error.message)
    }
  }

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          updateProfile(userCredential.user, {
            displayName: displayName,
          })
        })
        .catch((error: any) => {
          throw new Error(error.message)
        })
    } catch (error: any) {
      throw new Error(error.message)
    }
  }

  const signOutUser = async () => {
    try {
      await signOut(auth)
    } catch (error: any) {
      throw new Error(error.message)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error: any) {
      throw new Error(error.message)
    }
  }

  // Add the isAdmin function
  const isAdmin = () => {
    return user?.email === "admin@example.com"
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut: signOutUser,
    resetPassword,
    isAdmin,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
