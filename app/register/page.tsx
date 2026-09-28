"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  getRedirectResult,
  signInWithRedirect,
  browserPopupRedirectResolver,
} from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import { AlertCircle, UserPlus, Mail, Info, ExternalLink, CheckCircle, XCircle } from "lucide-react"
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore"
import { sendEnhancedVerificationEmail } from "@/lib/auth-utils"
import { isUsernameAvailable, reserveUsername } from "@/services/username-service"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [username, setUsername] = useState("")
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [usernameChecking, setUsernameChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [verificationSent, setVerificationSent] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [showDomainError, setShowDomainError] = useState(false)
  const [detailedError, setDetailedError] = useState<{ code: string; message: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [countdown])

  // Check for redirect result on component mount
  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        setGoogleLoading(true)
        const result = await getRedirectResult(auth)

        if (result?.user) {
          // Handle successful sign-in after redirect
          await handleGoogleUserData(result.user)
          router.push("/feed")
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

  // Check username availability when username changes
  useEffect(() => {
    const checkUsername = async () => {
      if (username.length < 3) {
        setUsernameAvailable(null)
        return
      }

      setUsernameChecking(true)
      try {
        const available = await isUsernameAvailable(username)
        setUsernameAvailable(available)
      } catch (error) {
        console.error("Error checking username:", error)
        setUsernameAvailable(null)
      } finally {
        setUsernameChecking(false)
      }
    }

    // Debounce the username check
    const timer = setTimeout(checkUsername, 500)
    return () => clearTimeout(timer)
  }, [username])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setDetailedError(null)
    setLoading(true)

    try {
      // Validate Firebase configuration
      if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY === "undefined") {
        throw new Error("Firebase configuration is missing. Please check your environment variables.")
      }

      // Validate username
      if (username.length < 3) {
        throw new Error("Username must be at least 3 characters long.")
      }

      if (!usernameAvailable) {
        throw new Error("This username is already taken. Please choose another one.")
      }

      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Update profile with display name
      await updateProfile(user, {
        displayName: displayName,
      })

      // Reserve the username
      const usernameReserved = await reserveUsername(user.uid, username)
      if (!usernameReserved) {
        throw new Error("Failed to reserve username. Please try again with a different username.")
      }

      // Create user document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        displayName: displayName,
        username: username.toLowerCase(),
        email: email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastUsernameChange: serverTimestamp(),
        isBlocked: false,
        isBanned: false,
        emailVerified: false,
        authProvider: "email",
      })

      // Send enhanced verification email
      const verificationSent = await sendEnhancedVerificationEmail(user)

      if (verificationSent) {
        setVerificationSent(true)
        setCountdown(60) // 60 seconds countdown for resend
      } else {
        throw new Error("Failed to send verification email. Please try again.")
      }
    } catch (error: any) {
      console.error("Registration error:", error)
      setDetailedError({
        code: error.code || "unknown",
        message: error.message || "An unknown error occurred",
      })

      // Provide more specific error messages
      if (error.code === "auth/invalid-api-key") {
        setError("Firebase API key is invalid. Please check your environment configuration.")
      } else if (error.code === "auth/email-already-in-use") {
        setError("This email is already registered. Please use a different email or try logging in.")
      } else if (error.code === "auth/weak-password") {
        setError("Password is too weak. Please use a stronger password.")
      } else {
        setError(error.message || "Failed to register. Please try again.")
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

      // If user doesn't exist, create a new user document and set firstTimeUser flag
      if (!userDoc.exists()) {
        // For Google sign-ups, we'll generate a username based on email
        const emailUsername = user.email.split("@")[0]
        let uniqueUsername = emailUsername
        let counter = 1

        // Keep trying until we find an available username
        while (!(await isUsernameAvailable(uniqueUsername))) {
          uniqueUsername = `${emailUsername}${counter}`
          counter++
        }

        // Reserve the username
        await reserveUsername(user.uid, uniqueUsername)

        await setDoc(userRef, {
          displayName: user.displayName,
          username: uniqueUsername.toLowerCase(),
          email: user.email,
          photoURL: user.photoURL,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastUsernameChange: serverTimestamp(),
          isBlocked: false,
          isBanned: false,
          emailVerified: user.emailVerified,
          authProvider: "google",
        })

        // Set firstTimeUser flag in sessionStorage
        sessionStorage.setItem("firstTimeUser", "true")
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

  const handleGoogleSignUp = async () => {
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
          await handleGoogleUserData(result.user)
          router.push("/feed?welcome=true")
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
      console.error("Google sign up error:", error)
      setDetailedError({
        code: error.code || "unknown",
        message: error.message || "An unknown error occurred",
      })

      // Handle specific error for unauthorized domain
      if (error.code === "auth/unauthorized-domain") {
        setShowDomainError(true)
      } else {
        setError(error.message || "Failed to sign up with Google. Please try again.")
      }
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleResendVerification = async () => {
    if (countdown > 0) return

    setLoading(true)
    try {
      const user = auth.currentUser
      if (user) {
        const verificationSent = await sendEnhancedVerificationEmail(user)

        if (verificationSent) {
          setCountdown(60)
          setError(null)
        } else {
          throw new Error("Failed to send verification email. Please try again.")
        }
      } else {
        setError("User session expired. Please try registering again.")
      }
    } catch (error: any) {
      console.error("Error sending verification email:", error)
      setError(error.message || "Failed to send verification email. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-b from-white to-violet-50">
      <div className="w-full max-w-md">
        <Card className="glass-card border-0 rounded-3xl shadow-xl overflow-hidden">
          <CardHeader className="space-y-1 pb-2">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-purple-100 rounded-full flex items-center justify-center text-violet-600 shadow-inner">
                {verificationSent ? (
                  <Mail className="w-10 h-10 text-violet-600" />
                ) : (
                  <UserPlus className="w-10 h-10 text-violet-600" />
                )}
              </div>
            </div>
            <CardTitle className="text-2xl md:text-3xl font-playfair text-center bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent font-semibold">
              {verificationSent ? "Verify Your Email" : "Join Letter Share"}
            </CardTitle>
            <CardDescription className="text-center text-violet-500">
              {verificationSent ? "Check your inbox for the verification link" : "Create an account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {verificationSent ? (
              <div className="space-y-4">
                <Alert className="bg-blue-50 text-blue-800 border border-blue-200">
                  <Mail className="h-4 w-4" />
                  <AlertDescription>
                    <p>
                      We've sent a verification email to <strong>{email}</strong>.
                    </p>
                    <p className="mt-2">
                      Please check your inbox and click the verification link to complete your registration.
                    </p>
                    <p className="mt-2 text-sm">
                      After verification, you'll be automatically logged in and redirected to the home page.
                    </p>
                  </AlertDescription>
                </Alert>

                <div className="text-center space-y-4">
                  <p className="text-sm text-violet-600">
                    Didn't receive the email? Check your spam folder or click below to resend.
                  </p>
                  <Button
                    onClick={handleResendVerification}
                    disabled={countdown > 0 || loading}
                    variant="outline"
                    className="w-full"
                  >
                    {countdown > 0 ? `Resend in ${countdown}s` : "Resend Verification Email"}
                  </Button>
                </div>
              </div>
            ) : (
              <>
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

                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName" className="text-violet-700">
                      Display Name
                    </Label>
                    <Input
                      id="displayName"
                      placeholder="Enter your display name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                      className="px-4 py-3 rounded-xl border-2 border-violet-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-violet-700 flex items-center justify-between">
                      <span>Username</span>
                      {username.length >= 3 && (
                        <span className="text-xs flex items-center">
                          {usernameChecking ? (
                            <span className="text-amber-500">Checking...</span>
                          ) : usernameAvailable ? (
                            <span className="text-green-600 flex items-center">
                              <CheckCircle className="h-3 w-3 mr-1" /> Available
                            </span>
                          ) : (
                            <span className="text-red-600 flex items-center">
                              <XCircle className="h-3 w-3 mr-1" /> Taken
                            </span>
                          )}
                        </span>
                      )}
                    </Label>
                    <Input
                      id="username"
                      placeholder="Choose a unique username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.trim())}
                      required
                      minLength={3}
                      maxLength={20}
                      pattern="^[a-zA-Z0-9_]+$"
                      title="Username can only contain letters, numbers, and underscores"
                      className={`px-4 py-3 rounded-xl border-2 transition-all ${
                        username.length >= 3
                          ? usernameAvailable
                            ? "border-green-300 focus:border-green-500 focus:ring-4 focus:ring-green-100"
                            : "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                          : "border-violet-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                      }`}
                    />
                    <p className="text-xs text-muted-foreground">
                      Username must be at least 3 characters and can only contain letters, numbers, and underscores. You
                      can change your username once per month.
                    </p>
                  </div>

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
                    <Label htmlFor="password" className="text-violet-700">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="px-4 py-3 rounded-xl border-2 border-violet-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg transition-all hover:-translate-y-0.5"
                    disabled={loading || !usernameAvailable || username.length < 3}
                  >
                    {loading ? "Creating account..." : "Sign up with Email"}
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
                  onClick={handleGoogleSignUp}
                  disabled={googleLoading || showDomainError}
                >
                  {googleLoading ? (
                    <svg
                      className="animate-spin h-4 w-4 text-violet-600"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
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
                  Sign up with Google
                </Button>

                {showDomainError && (
                  <p className="mt-2 text-xs text-center text-amber-600">
                    Google sign-in is disabled. Please use email registration.
                  </p>
                )}
              </>
            )}
          </CardContent>
          <CardFooter className="flex justify-center pb-6">
            <div className="text-sm text-violet-600 text-center">
              Already have an account?{" "}
              <Link href="/login" className="text-violet-700 font-medium underline-offset-4 hover:underline">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
