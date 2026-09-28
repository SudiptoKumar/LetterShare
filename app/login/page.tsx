"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  browserPopupRedirectResolver,
} from "firebase/auth"
import { auth, db, checkUserStatus } from "@/lib/firebase"
import { AlertCircle, LogIn, Info, ExternalLink, CheckCircle2 } from "lucide-react"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showDomainError, setShowDomainError] = useState(false)
  const [detailedError, setDetailedError] = useState<{ code: string; message: string } | null>(null)
  const [showDeletedMessage, setShowDeletedMessage] = useState(false)
  const router = useRouter()

  // Check for redirect result on component mount
  useEffect(() => {
    // Check if account was just deleted
    const accountDeleted = localStorage.getItem("accountDeleted")
    if (accountDeleted === "true") {
      setShowDeletedMessage(true)
      // Clear the flag
      localStorage.removeItem("accountDeleted")
    }

    const checkRedirectResult = async () => {
      try {
        setGoogleLoading(true)
        const result = await getRedirectResult(auth)

        if (result?.user) {
          // Check if user is blocked or banned
          const { isBlocked, isBanned } = await checkUserStatus(result.user.uid)

          if (isBlocked) {
            setError("Your account has been temporarily blocked. Please contact support.")
            await auth.signOut()
            return
          }

          if (isBanned) {
            setError("Your account has been permanently banned for violating our terms of service.")
            await auth.signOut()
            return
          }

          // Handle successful sign-in after redirect
          await handleGoogleUserData(result.user)
          // Check if this is a new user
          const userRef = doc(db, "users", result.user.uid)
          const userDoc = await getDoc(userRef)
          if (!userDoc.exists()) {
            // This is a new user, set the firstTimeUser flag
            sessionStorage.setItem("firstTimeUser", "true")
            router.push("/feed?welcome=true")
          } else {
            router.push("/feed")
          }
        }
      } catch (error: any) {
        console.error("Redirect result error:", error)
        setDetailedError({
          code: error.code || "unknown",
          message: error.message || "An unknown error occurred",
        })

        if (error.code === "auth/unauthorized-domain") {
          setShowDomainError(true)
        } else {
          setError(error.message || "Failed to complete Google sign-in. Please try again.")
        }
      } finally {
        setGoogleLoading(false)
      }
    }

    checkRedirectResult()
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setDetailedError(null)
    setLoading(true)

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Check if user is blocked or banned
      const { isBlocked, isBanned } = await checkUserStatus(user.uid)

      if (isBlocked) {
        setError("Your account has been temporarily blocked. Please contact support.")
        await auth.signOut()
        setLoading(false)
        return
      }

      if (isBanned) {
        setError("Your account has been permanently banned for violating our terms of service.")
        await auth.signOut()
        setLoading(false)
        return
      }

      // Store user email in localStorage for signature customization
      localStorage.setItem("userEmail", email)
      if (user.displayName) {
        localStorage.setItem("userName", user.displayName)
      }

      // Redirect to feed page after successful login
      router.push("/feed")
    } catch (error: any) {
      console.error("Login error:", error)
      setDetailedError({
        code: error.code || "unknown",
        message: error.message || "An unknown error occurred",
      })

      // Provide more specific error messages
      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        setError("Invalid email or password. Please try again.")
      } else if (error.code === "auth/too-many-requests") {
        setError("Too many failed login attempts. Please try again later or reset your password.")
      } else {
        setError(error.message || "Failed to login. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  // Helper function to handle Google user data
  const handleGoogleUserData = async (user: any) => {
    try {
      // Check if user exists in Firestore
      const userRef = doc(db, "users", user.uid)
      const userDoc = await getDoc(userRef)

      // If user doesn't exist, create a new user document
      if (!userDoc.exists()) {
        await setDoc(userRef, {
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          isBlocked: false,
          isBanned: false,
          authProvider: "google",
        })
      }

      // Store user info in localStorage
      if (user.email) {
        localStorage.setItem("userEmail", user.email)
      }
      if (user.displayName) {
        localStorage.setItem("userName", user.displayName)
      }

      return true
    } catch (error) {
      console.error("Error handling Google user data:", error)
      throw error
    }
  }

  const handleGoogleSignIn = async () => {
    setError(null)
    setDetailedError(null)
    setGoogleLoading(true)
    setShowDomainError(false)

    try {
      const provider = new GoogleAuthProvider()

      // Add scopes for better profile information
      provider.addScope("profile")
      provider.addScope("email")

      // Set custom parameters
      provider.setCustomParameters({
        prompt: "select_account",
      })

      // Try popup first (works better in most browsers)
      try {
        const result = await signInWithPopup(auth, provider, browserPopupRedirectResolver)
        if (result?.user) {
          // Check if user is blocked or banned
          const { isBlocked, isBanned } = await checkUserStatus(result.user.uid)

          if (isBlocked) {
            setError("Your account has been temporarily blocked. Please contact support.")
            await auth.signOut()
            return
          }

          if (isBanned) {
            setError("Your account has been permanently banned for violating our terms of service.")
            await auth.signOut()
            return
          }

          await handleGoogleUserData(result.user)
          // Check if this is a new user
          const userRef = doc(db, "users", result.user.uid)
          const userDoc = await getDoc(userRef)
          if (!userDoc.exists()) {
            // This is a new user, set the firstTimeUser flag
            sessionStorage.setItem("firstTimeUser", "true")
            router.push("/feed?welcome=true")
          } else {
            router.push("/feed")
          }
        }
      } catch (popupError: any) {
        console.log("Popup sign-in failed, trying redirect...", popupError)

        // If popup fails with unauthorized domain, show error
        if (popupError.code === "auth/unauthorized-domain") {
          throw popupError
        }

        // Otherwise fall back to redirect
        await signInWithRedirect(auth, provider, browserPopupRedirectResolver)
      }
    } catch (error: any) {
      console.error("Google sign in error:", error)
      setDetailedError({
        code: error.code || "unknown",
        message: error.message || "An unknown error occurred",
      })

      // Handle specific error for unauthorized domain
      if (error.code === "auth/unauthorized-domain") {
        setShowDomainError(true)
      } else {
        setError(error.message || "Failed to sign in with Google. Please try again.")
      }
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-b from-white to-violet-50">
      {showDeletedMessage && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertTitle className="text-green-700">Success</AlertTitle>
          <AlertDescription className="text-green-600">Your account has been deleted successfully.</AlertDescription>
        </Alert>
      )}
      <div className="w-full max-w-md">
        <Card className="glass-card border-0 rounded-3xl shadow-xl overflow-hidden">
          <CardHeader className="space-y-1 pb-2">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-purple-100 rounded-full flex items-center justify-center text-violet-600 shadow-inner">
                <LogIn className="w-10 h-10 text-violet-600" />
              </div>
            </div>
            <CardTitle className="text-2xl md:text-3xl font-playfair text-center bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent font-semibold">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-center text-violet-500">Sign in to your account</CardDescription>
          </CardHeader>
          <CardContent>
            {showDomainError && (
              <Alert className="mb-4 bg-amber-50 text-amber-800 border border-amber-200">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <p>Google sign-in is not available on this domain.</p>
                  <p className="mt-1">
                    This is typically because the current domain is not authorized in the Firebase console.
                  </p>
                  <div className="mt-2">
                    <Link
                      href="/auth-diagnostics"
                      className="text-amber-900 font-medium flex items-center hover:underline"
                    >
                      <span>Run authentication diagnostics</span>
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </Link>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive" className="mb-4 bg-red-50 text-red-800 border border-red-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p>{error}</p>
                  {detailedError && (
                    <div className="mt-2 text-xs opacity-80">
                      <p>Error code: {detailedError.code}</p>
                      <Link
                        href="/auth-diagnostics"
                        className="text-red-900 font-medium flex items-center hover:underline mt-1"
                      >
                        <span>Run authentication diagnostics</span>
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </Link>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-violet-700">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="px-4 py-3 rounded-xl border-2 border-violet-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-violet-700">
                    Password
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-violet-600 hover:text-violet-800 hover:underline underline-offset-4"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="px-4 py-3 rounded-xl border-2 border-violet-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg transition-all hover:-translate-y-0.5"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign in with Email"}
              </Button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-violet-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-violet-500">OR</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full py-3 rounded-xl flex items-center justify-center gap-2 border-2 border-violet-200 hover:border-violet-300 hover:bg-violet-50 transition-all"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || showDomainError}
            >
              {googleLoading ? (
                <svg
                  className="animate-spin h-4 w-4 text-violet-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              Sign in with Google
            </Button>

            {showDomainError && (
              <p className="mt-2 text-xs text-center text-amber-600">
                Google sign-in is disabled. Please use email login.
              </p>
            )}
          </CardContent>
          <CardFooter className="flex justify-center pb-6">
            <div className="text-sm text-violet-600 text-center">
              Don't have an account?{" "}
              <Link href="/register" className="text-violet-700 font-medium underline-offset-4 hover:underline">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
