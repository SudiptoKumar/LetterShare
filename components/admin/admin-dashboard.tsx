"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { db } from "@/lib/firebase"
import { collection, query, where, orderBy, limit, getDocs, Timestamp, onSnapshot } from "firebase/firestore"
import { Users, FileText, MessageSquare, AlertTriangle, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { RecentActivityFeed } from "./recent-activity-feed"

interface DashboardStats {
  totalUsers: number
  newUsersToday: number
  totalLetters: number
  newLettersToday: number
  totalComments: number
  newCommentsToday: number
  reportedContent: number
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    newUsersToday: 0,
    totalLetters: 0,
    newLettersToday: 0,
    totalComments: 0,
    newCommentsToday: 0,
    reportedContent: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [trendingLetters, setTrendingLetters] = useState<any[]>([])
  const [retryCount, setRetryCount] = useState(0)

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get today's start timestamp
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayTimestamp = Timestamp.fromDate(today)

      // Initialize stats
      const newStats: DashboardStats = {
        totalUsers: 0,
        newUsersToday: 0,
        totalLetters: 0,
        newLettersToday: 0,
        totalComments: 0,
        newCommentsToday: 0,
        reportedContent: 0,
      }

      // Fetch user stats with error handling
      try {
        const usersRef = collection(db, "users")
        const usersSnapshot = await getDocs(usersRef)
        newStats.totalUsers = usersSnapshot.size

        const newUsersQuery = query(usersRef, where("createdAt", ">=", todayTimestamp))
        const newUsersSnapshot = await getDocs(newUsersQuery)
        newStats.newUsersToday = newUsersSnapshot.size
      } catch (err) {
        console.warn("Error fetching user stats:", err)
      }

      // Fetch letter stats with error handling
      try {
        const lettersRef = collection(db, "letters")
        const lettersSnapshot = await getDocs(lettersRef)
        newStats.totalLetters = lettersSnapshot.size

        const newLettersQuery = query(lettersRef, where("createdAt", ">=", todayTimestamp))
        const newLettersSnapshot = await getDocs(newLettersQuery)
        newStats.newLettersToday = newLettersSnapshot.size

        // Fetch trending letters
        const trendingQuery = query(lettersRef, orderBy("createdAt", "desc"), limit(5))
        const trendingSnapshot = await getDocs(trendingQuery)
        const trendingData = trendingSnapshot.docs.map((doc) => ({
          id: doc.id,
          title: doc.data().title || "Untitled Letter",
          authorName: doc.data().authorName || "Unknown Author",
          commentCount: doc.data().commentCount || 0,
          likes: doc.data().likes?.length || 0,
          createdAt: doc.data().createdAt,
        }))
        setTrendingLetters(trendingData)
      } catch (err) {
        console.warn("Error fetching letter stats:", err)
      }

      // Fetch comment stats with error handling
      try {
        const commentsRef = collection(db, "comments")
        const commentsSnapshot = await getDocs(commentsRef)
        newStats.totalComments = commentsSnapshot.size

        const newCommentsQuery = query(commentsRef, where("createdAt", ">=", todayTimestamp))
        const newCommentsSnapshot = await getDocs(newCommentsQuery)
        newStats.newCommentsToday = newCommentsSnapshot.size
      } catch (err) {
        console.warn("Error fetching comment stats:", err)
      }

      // Fetch reported content with error handling
      try {
        const reportsRef = collection(db, "reports")
        const reportsSnapshot = await getDocs(reportsRef)
        newStats.reportedContent = reportsSnapshot.size
      } catch (err) {
        console.warn("Error fetching report stats:", err)
      }

      setStats(newStats)
      setLoading(false)
      setRetryCount(0)
    } catch (err) {
      console.error("Error fetching admin stats:", err)
      setError("Failed to load dashboard data. Please try again.")
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()

    // Set up real-time listener for reports with error handling
    let unsubscribeReports: (() => void) | null = null

    try {
      const reportsRef = collection(db, "reports")
      unsubscribeReports = onSnapshot(
        reportsRef,
        (snapshot) => {
          setStats((prev) => ({
            ...prev,
            reportedContent: snapshot.size,
          }))
        },
        (error) => {
          console.warn("Error in reports listener:", error)
        },
      )
    } catch (err) {
      console.warn("Error setting up reports listener:", err)
    }

    return () => {
      if (unsubscribeReports) {
        unsubscribeReports()
      }
    }
  }, [])

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
    fetchStats()
  }

  if (loading) {
    return <DashboardSkeleton />
  }

  if (error && retryCount < 3) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Loading Dashboard</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={handleRetry}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-violet-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+{stats.newUsersToday} today</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Letters</CardTitle>
            <FileText className="h-4 w-4 text-violet-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLetters.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+{stats.newLettersToday} today</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
            <MessageSquare className="h-4 w-4 text-violet-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalComments.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+{stats.newCommentsToday} today</p>
          </CardContent>
        </Card>

        <Card
          className={`hover:shadow-md transition-shadow ${stats.reportedContent > 0 ? "border-red-200 bg-red-50" : ""}`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reported Content</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${stats.reportedContent > 0 ? "text-red-500" : "text-violet-600"}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reportedContent}</div>
            <p className="text-xs text-muted-foreground">
              {stats.reportedContent > 0 ? "Requires attention" : "All clear"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Letters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Recent Letters
          </CardTitle>
          <CardDescription>Latest letters posted on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {trendingLetters.length > 0 ? (
              trendingLetters.map((letter, index) => (
                <div key={letter.id} className="flex items-center justify-between border-b pb-3 last:border-b-0">
                  <div className="flex-1">
                    <h3 className="font-medium text-sm line-clamp-1">{letter.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      By {letter.authorName} • {letter.commentCount} comments • {letter.likes} likes
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs bg-transparent">
                    View
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No recent letters found</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <CardDescription>Live feed of platform activity</CardDescription>
        </CardHeader>
        <CardContent>
          <RecentActivityFeed />
        </CardContent>
      </Card>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40 mb-1" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between border-b pb-2 mb-2 last:border-b-0">
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4 mb-1" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32 mb-1" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}
