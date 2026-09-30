"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, ShieldAlert } from "lucide-react"
import { auth, db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ContentModeration } from "@/components/admin/content-moderation"
import { PlatformAnalytics } from "@/components/admin/platform-analytics"
import { SystemSettings } from "@/components/admin/system-settings"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { UserManagement } from "@/components/admin/user-management"
import { LetterManagement } from "@/components/admin/letter-management"

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("dashboard")
  const router = useRouter()

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        setLoading(true)
        setError(null)

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
          if (!currentUser) {
            router.push("/login")
            return
          }

          try {
            setUser(currentUser)

            // Check if user is an admin
            const userRef = doc(db, "users", currentUser.uid)
            const userSnap = await getDoc(userRef)

            if (userSnap.exists()) {
              const userData = userSnap.data()
              if (userData.role === "admin") {
                setIsAdmin(true)
              } else {
                setError("Access denied. Admin privileges required.")
                setTimeout(() => router.push("/feed"), 2000)
              }
            } else if (currentUser.email === "admin@lettershare.com") {
              // Fallback for default admin
              setIsAdmin(true)
            } else {
              setError("Access denied. Admin privileges required.")
              setTimeout(() => router.push("/feed"), 2000)
            }
          } catch (err) {
            console.error("Error checking admin status:", err)
            setError("Failed to verify admin status. Please try again.")
          } finally {
            setLoading(false)
          }
        })

        return () => unsubscribe()
      } catch (err) {
        console.error("Error in admin check:", err)
        setError("Authentication error. Please try again.")
        setLoading(false)
      }
    }

    checkAdminStatus()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>You do not have permission to access the admin panel.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4 max-w-7xl">
        <div className="flex items-center mb-6">
          <ShieldAlert className="h-8 w-8 mr-3 text-violet-600" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-violet-900">Letter Share Admin Panel</h1>
            <p className="text-sm text-gray-600">Welcome back, {user?.displayName || user?.email}</p>
          </div>
        </div>

        <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-2 md:grid-cols-6 gap-2 bg-white">
            <TabsTrigger value="dashboard" className="text-xs md:text-sm">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="users" className="text-xs md:text-sm">
              Users
            </TabsTrigger>
            <TabsTrigger value="letters" className="text-xs md:text-sm">
              Letters
            </TabsTrigger>
            <TabsTrigger value="content" className="text-xs md:text-sm">
              Moderation
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs md:text-sm">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs md:text-sm">
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <AdminDashboard />
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <UserManagement />
          </TabsContent>

          <TabsContent value="letters" className="space-y-4">
            <LetterManagement />
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            <ContentModeration />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <PlatformAnalytics />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <SystemSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
