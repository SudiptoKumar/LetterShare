"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertCircle,
  UserRound,
  CheckCircle2,
  Settings,
  Trash,
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react"
import { auth, db } from "@/lib/firebase"
import { onAuthStateChanged, updateProfile, deleteUser, signOut } from "firebase/auth"
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { isUsernameAvailable, updateUsername } from "@/services/username-service"
import { MessageUserButton } from "@/components/message-user-button"

export default function ProfilePage() {
  const searchParams = useSearchParams()
  const userId = searchParams.get("userId")
  const [user, setUser] = useState<any>(null)
  const [isCurrentUser, setIsCurrentUser] = useState(true)
  const [displayName, setDisplayName] = useState("")
  const [username, setUsername] = useState("")
  const [originalUsername, setOriginalUsername] = useState("")
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [usernameChecking, setUsernameChecking] = useState(false)
  const [canChangeUsername, setCanChangeUsername] = useState(true)
  const [nextUsernameChangeDate, setNextUsernameChangeDate] = useState<Date | null>(null)
  const [headline, setHeadline] = useState("")
  const [bio, setBio] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmationText, setConfirmationText] = useState("")
  const [countdownActive, setCountdownActive] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login")
        return
      }

      // If userId is provided and it's not the current user, fetch that user's profile
      if (userId && userId !== currentUser.uid) {
        setIsCurrentUser(false)
        try {
          const userDoc = await getDoc(doc(db, "users", userId))
          if (userDoc.exists()) {
            const userData = userDoc.data()
            setDisplayName(userData.displayName || "")
            setBio(userData.bio || "")
            setHeadline(userData.headline || "")
            setUsername(userData.username || "")
            setUser({ uid: userId, ...userData })
          } else {
            // User not found
            setError("User not found")
          }
        } catch (error) {
          console.error("Error fetching user profile:", error)
          setError("Error loading user profile")
        }
        setLoading(false)
        return
      }

      // Otherwise, load the current user's profile
      setIsCurrentUser(true)
      setUser(currentUser)
      setDisplayName(currentUser.displayName || "")

      // Fetch user profile from Firestore
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          setBio(userData.bio || "")
          setHeadline(userData.headline || "")

          // Set username
          const userUsername = userData.username || ""
          setUsername(userUsername)
          setOriginalUsername(userUsername)

          // Check if user can change username
          if (userData.lastUsernameChange) {
            const lastChange = userData.lastUsernameChange as Timestamp
            const oneMonthAgo = new Date()
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

            if (lastChange.toDate() > oneMonthAgo) {
              setCanChangeUsername(false)

              const nextDate = new Date(lastChange.toDate())
              nextDate.setMonth(nextDate.getMonth() + 1)
              setNextUsernameChangeDate(nextDate)
            } else {
              setCanChangeUsername(true)
              setNextUsernameChangeDate(null)
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user profile:", error)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [router, userId])

  // Check username availability when username changes
  useEffect(() => {
    // Only check if username has changed from original
    if (username === originalUsername || username.length < 3) {
      setUsernameAvailable(null)
      return
    }

    const checkUsername = async () => {
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
  }, [username, originalUsername])

  // Cleanup countdown timer when component unmounts
  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current)
      }
    }
  }, [])

  // Function to update all letters by this user with new profile data
  const updateUserLetters = async (updatedData: any) => {
    try {
      // Query all letters by this user
      const lettersQuery = query(collection(db, "letters"), where("authorId", "==", user.uid))
      const lettersSnapshot = await getDocs(lettersQuery)

      if (!lettersSnapshot.empty) {
        const batch = writeBatch(db)

        lettersSnapshot.forEach((letterDoc) => {
          const letterRef = doc(db, "letters", letterDoc.id)

          // Update only the fields that have changed
          const updates: any = {
            updatedAt: serverTimestamp(),
          }

          if (updatedData.displayName) {
            updates.authorName = updatedData.displayName
          }

          if (updatedData.headline) {
            updates.authorHeadline = updatedData.headline
          }

          batch.update(letterRef, updates)
        })

        // Commit the batch update
        await batch.commit()
        console.log("Updated all user letters with new profile data")
      }
    } catch (error) {
      console.error("Error updating user letters:", error)
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSaving(true)

    try {
      // Check if username has changed and needs to be updated
      const usernameChanged = username !== originalUsername

      if (usernameChanged) {
        // Validate username
        if (username.length < 3) {
          throw new Error("Username must be at least 3 characters long.")
        }

        if (!usernameAvailable) {
          throw new Error("This username is already taken. Please choose another one.")
        }

        if (!canChangeUsername) {
          throw new Error(
            `You can only change your username once per month. Next available change: ${nextUsernameChangeDate?.toLocaleDateString()}`,
          )
        }

        // Update username
        const result = await updateUsername(user.uid, username)
        if (!result.success) {
          throw new Error(result.message)
        }
      }

      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName,
      })

      // Update Firestore user document
      const userRef = doc(db, "users", user.uid)
      const userDoc = await getDoc(userRef)

      if (userDoc.exists()) {
        await updateDoc(userRef, {
          displayName,
          headline,
          bio,
          updatedAt: serverTimestamp(),
        })
      } else {
        await setDoc(userRef, {
          displayName,
          headline,
          bio,
          email: user.email,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      }

      // Update all letters by this user with new profile data
      await updateUserLetters({
        displayName,
        headline,
      })

      // Store in localStorage for easy access
      localStorage.setItem("userName", displayName)
      localStorage.setItem("userHeadline", headline)

      // Update original username if it was changed
      if (usernameChanged) {
        setOriginalUsername(username)
        setCanChangeUsername(false)

        const nextDate = new Date()
        nextDate.setMonth(nextDate.getMonth() + 1)
        setNextUsernameChangeDate(nextDate)
      }

      setSuccess("Profile updated successfully!")
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully and all your letters have been updated.",
        variant: "default",
        className: "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0",
      })

      // Update user object
      setUser({
        ...user,
        displayName,
      })
    } catch (error: any) {
      console.error("Error updating profile:", error)
      setError(error.message || "Failed to update profile. Please try again.")
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const startDeletionCountdown = () => {
    setCountdownActive(true)
    setCountdown(5)

    // Start countdown
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Time's up, proceed with deletion
          if (countdownRef.current) clearInterval(countdownRef.current)
          handleDeleteAccount()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const cancelDeletion = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
    }
    setCountdownActive(false)
    setConfirmationText("")
    toast({
      title: "Deletion Cancelled",
      description: "Your account deletion has been cancelled.",
      variant: "default",
    })
  }

  // Update the handleDeleteAccount function to redirect to welcome page and prevent back button access
  const handleDeleteAccount = async () => {
    if (!user) return

    // Clear any existing countdown
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
    }

    setCountdownActive(false)
    setIsDeleting(true)

    try {
      // Create a batch to delete all user data
      const batch = writeBatch(db)

      // 1. Delete user's letters
      const lettersQuery = query(collection(db, "letters"), where("authorId", "==", user.uid))
      const lettersSnapshot = await getDocs(lettersQuery)
      lettersSnapshot.forEach((doc) => {
        batch.delete(doc.ref)
      })

      // 2. Delete user's comments
      const commentsQuery = query(collection(db, "comments"), where("authorId", "==", user.uid))
      const commentsSnapshot = await getDocs(commentsQuery)
      commentsSnapshot.forEach((doc) => {
        batch.delete(doc.ref)
      })

      // 3. Delete user's chat messages
      const messagesQuery = query(collection(db, "messages"), where("senderId", "==", user.uid))
      const messagesSnapshot = await getDocs(messagesQuery)
      messagesSnapshot.forEach((doc) => {
        batch.delete(doc.ref)
      })

      // 4. Delete user's reactions from letters
      // This is more complex as reactions are stored in arrays within letters
      // We'll need to fetch all letters with this user's reactions and update them
      const reactionsQuery = query(collection(db, "letters"))
      const reactionsSnapshot = await getDocs(reactionsQuery)

      reactionsSnapshot.forEach((letterDoc) => {
        const letterData = letterDoc.data()
        let updated = false

        // Check likes array
        if (letterData.likes && letterData.likes.includes(user.uid)) {
          letterData.likes = letterData.likes.filter((id: string) => id !== user.uid)
          updated = true
        }

        // Check reactions object
        if (letterData.reactions) {
          Object.keys(letterData.reactions).forEach((reactionType) => {
            if (letterData.reactions[reactionType].includes(user.uid)) {
              letterData.reactions[reactionType] = letterData.reactions[reactionType].filter(
                (id: string) => id !== user.uid,
              )
              updated = true
            }
          })
        }

        if (updated) {
          batch.update(letterDoc.ref, {
            likes: letterData.likes || [],
            reactions: letterData.reactions || {},
            updatedAt: serverTimestamp(),
          })
        }
      })

      // 5. Delete user document
      const userRef = doc(db, "users", user.uid)
      batch.delete(userRef)

      // 6. Delete username from usernames collection
      if (originalUsername) {
        await setDoc(doc(db, "usernames", originalUsername.toLowerCase()), {
          userId: null,
          deleted: true,
          deletedAt: serverTimestamp(),
        })
      }

      // Commit all the batch operations
      await batch.commit()

      // Finally, delete the user authentication account
      await deleteUser(user)

      // Clear local storage
      localStorage.removeItem("userName")
      localStorage.removeItem("userEmail")
      localStorage.removeItem("userHeadline")

      // Set a flag to show deletion message on login page
      localStorage.setItem("accountDeleted", "true")

      toast({
        title: "Account Deleted",
        description: "Your account and all associated data have been permanently deleted.",
        variant: "default",
        className: "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0",
      })

      // Auto-logout and redirect to welcome page
      await signOut(auth)

      // Use window.location.href to force a full page reload and prevent back button
      window.location.href = "/welcome"
    } catch (error: any) {
      console.error("Error deleting account:", error)
      setIsDeleting(false)
      setShowDeleteAlert(false)

      toast({
        title: "Error",
        description: error.message || "Failed to delete account. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="container max-w-2xl mx-auto content-container">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center mb-6">
              <Skeleton className="h-32 w-32 rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-24 w-full" />
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl mx-auto content-container">
      {countdownActive ? (
        <Card className="bg-red-50 border-red-200 mb-4">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mb-2" />
              <h2 className="text-xl font-bold text-red-700 mb-2">Account Deletion in Progress</h2>
              <p className="text-red-600 mb-4">
                Your account will be permanently deleted in <span className="font-bold">{countdown}</span> seconds
              </p>
              <Button
                onClick={cancelDeletion}
                className="bg-white text-red-600 border border-red-300 hover:bg-red-50 flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" /> Undo Deletion
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-playfair text-violet-900">
                {isCurrentUser ? "Profile Settings" : `${displayName}'s Profile`}
              </CardTitle>
              <CardDescription>{isCurrentUser ? "Update your profile information" : headline}</CardDescription>
            </div>
            {!isCurrentUser && user && (
              <MessageUserButton
                userId={user.uid}
                userName={displayName}
                className="bg-violet-600 hover:bg-violet-700 text-white"
              />
            )}
          </div>
        </CardHeader>

        {isCurrentUser ? (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="bg-green-50 text-green-800 border-green-200">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="h-32 w-32 bg-violet-100 rounded-full flex items-center justify-center">
                    <UserRound className="h-16 w-16 text-violet-600" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className="px-4 py-3 rounded-xl border-2 border-violet-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="flex items-center justify-between">
                  <span>Username</span>
                  {username !== originalUsername && username.length >= 3 && (
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
                  value={username}
                  onChange={(e) => setUsername(e.target.value.trim())}
                  required
                  disabled={!canChangeUsername}
                  minLength={3}
                  maxLength={20}
                  pattern="^[a-zA-Z0-9_]+$"
                  title="Username can only contain letters, numbers, and underscores"
                  className={`px-4 py-3 rounded-xl border-2 transition-all ${
                    !canChangeUsername
                      ? "bg-gray-100 border-gray-200"
                      : username !== originalUsername && username.length >= 3
                        ? usernameAvailable
                          ? "border-green-300 focus:border-green-500 focus:ring-4 focus:ring-green-100"
                          : "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                        : "border-violet-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                  }`}
                />
                {!canChangeUsername && nextUsernameChangeDate ? (
                  <div className="flex items-center text-xs text-amber-600">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>
                      Username can be changed once per month. Next available change:{" "}
                      {nextUsernameChangeDate.toLocaleDateString()}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Username must be at least 3 characters and can only contain letters, numbers, and underscores. You
                    can change your username once per month.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="headline">Headline</Label>
                <Input
                  id="headline"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Your professional headline (e.g., Writer, Poet, Storyteller)"
                  maxLength={100}
                  className="px-4 py-3 rounded-xl border-2 border-violet-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all"
                />
                <p className="text-xs text-muted-foreground">
                  A brief description that appears under your name (max 100 characters)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  className="min-h-[100px] px-4 py-3 rounded-xl border-2 border-violet-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user?.email || ""} disabled className="bg-muted px-4 py-3 rounded-xl" />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg transition-all hover:-translate-y-0.5"
                disabled={saving || (username !== originalUsername && !usernameAvailable)}
              >
                {saving ? "Saving Changes..." : "Save Changes"}
              </Button>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="settings" className="border-none">
                  <AccordionTrigger className="py-2 px-4 rounded-lg hover:bg-violet-50 transition-all">
                    <span className="flex items-center text-violet-800 group">
                      <Settings className="h-4 w-4 mr-2" />
                      Account Settings
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="p-4 space-y-4">
                      <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                        <h3 className="text-red-700 font-medium flex items-center mb-2">
                          <Trash className="h-4 w-4 mr-2" />
                          Delete Account
                        </h3>
                        <p className="text-sm text-red-600 mb-4">
                          This action cannot be undone. This will permanently delete your account and remove all your
                          data from our servers.
                        </p>
                        <Button
                          variant="destructive"
                          onClick={() => setShowDeleteAlert(true)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardFooter>
          </form>
        ) : (
          <CardContent className="space-y-4">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="h-32 w-32 bg-violet-100 rounded-full flex items-center justify-center">
                  <UserRound className="h-16 w-16 text-violet-600" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-gray-700">Username</h3>
              <p className="px-4 py-3 rounded-xl border-2 border-violet-100 bg-violet-50">@{username || "username"}</p>
            </div>

            {bio && (
              <div className="space-y-2">
                <h3 className="font-medium text-gray-700">Bio</h3>
                <div className="px-4 py-3 rounded-xl border-2 border-violet-100 bg-violet-50">
                  <p className="whitespace-pre-wrap">{bio}</p>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Are you absolutely sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                This action cannot be undone. This will permanently delete your account and remove all your data from
                our servers, including:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>All your letters</li>
                <li>All your comments</li>
                <li>All your chat messages</li>
                <li>All your reactions and likes</li>
                <li>Your profile information</li>
              </ul>
              <div className="pt-2">
                <Label htmlFor="confirmDelete" className="text-sm font-medium text-red-700">
                  Type "DELETE" to confirm:
                </Label>
                <Input
                  id="confirmDelete"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  className="mt-1 border-red-300 focus:border-red-500 focus:ring-red-200"
                  placeholder="DELETE"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting || countdownActive}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={startDeletionCountdown}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting || confirmationText !== "DELETE" || countdownActive}
            >
              {isDeleting ? "Deleting..." : "Delete Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
