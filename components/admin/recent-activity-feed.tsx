"use client"

import { useState, useEffect } from "react"
import { db } from "@/lib/firebase"
import { collection, query, orderBy, limit, getDocs, onSnapshot } from "firebase/firestore"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { FileText, MessageSquare, UserPlus, AlertTriangle, RefreshCw } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface ActivityItem {
  id: string
  type: string
  userId?: string
  userName?: string
  letterId?: string
  letterTitle?: string
  timestamp: any
  details?: string
}

export function RecentActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchActivities = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch recent letters
      const lettersRef = collection(db, "letters")
      const lettersQuery = query(lettersRef, orderBy("createdAt", "desc"), limit(10))
      const lettersSnapshot = await getDocs(lettersQuery)

      // Fetch recent comments
      const commentsRef = collection(db, "comments")
      const commentsQuery = query(commentsRef, orderBy("createdAt", "desc"), limit(10))
      const commentsSnapshot = await getDocs(commentsQuery)

      // Fetch recent users
      const usersRef = collection(db, "users")
      const usersQuery = query(usersRef, orderBy("createdAt", "desc"), limit(5))
      const usersSnapshot = await getDocs(usersQuery)

      const activityItems: ActivityItem[] = []

      // Process letters
      lettersSnapshot.docs.forEach((doc) => {
        const data = doc.data()
        activityItems.push({
          id: `letter-${doc.id}`,
          type: "letter_created",
          userId: data.authorId,
          userName: data.authorName || "Unknown User",
          letterId: doc.id,
          letterTitle: data.title || "Untitled Letter",
          timestamp: data.createdAt,
        })
      })

      // Process comments
      commentsSnapshot.docs.forEach((doc) => {
        const data = doc.data()
        activityItems.push({
          id: `comment-${doc.id}`,
          type: "comment_created",
          userId: data.authorId,
          userName: data.authorName || "Unknown User",
          letterId: data.letterId,
          timestamp: data.createdAt,
          details: data.content?.substring(0, 100) + (data.content?.length > 100 ? "..." : ""),
        })
      })

      // Process users
      usersSnapshot.docs.forEach((doc) => {
        const data = doc.data()
        activityItems.push({
          id: `user-${doc.id}`,
          type: "user_registered",
          userId: doc.id,
          userName: data.displayName || data.email || "Unknown User",
          timestamp: data.createdAt,
        })
      })

      // Sort by timestamp
      activityItems.sort((a, b) => {
        const aTime = a.timestamp?.seconds || 0
        const bTime = b.timestamp?.seconds || 0
        return bTime - aTime
      })

      setActivities(activityItems.slice(0, 15))
      setLoading(false)
    } catch (err) {
      console.error("Error fetching activities:", err)
      setError("Failed to load recent activity")
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities()

    // Set up real-time listener for new activities
    const unsubscribes: (() => void)[] = []

    try {
      // Listen for new letters
      const lettersRef = collection(db, "letters")
      const lettersQuery = query(lettersRef, orderBy("createdAt", "desc"), limit(5))
      const unsubscribeLetters = onSnapshot(lettersQuery, () => {
        fetchActivities()
      })
      unsubscribes.push(unsubscribeLetters)

      // Listen for new comments
      const commentsRef = collection(db, "comments")
      const commentsQuery = query(commentsRef, orderBy("createdAt", "desc"), limit(5))
      const unsubscribeComments = onSnapshot(commentsQuery, () => {
        fetchActivities()
      })
      unsubscribes.push(unsubscribeComments)
    } catch (err) {
      console.warn("Error setting up activity listeners:", err)
    }

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe())
    }
  }, [])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "letter_created":
        return <FileText className="h-4 w-4 text-violet-500" />
      case "comment_created":
        return <MessageSquare className="h-4 w-4 text-blue-500" />
      case "user_registered":
        return <UserPlus className="h-4 w-4 text-green-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  const getActivityText = (activity: ActivityItem) => {
    switch (activity.type) {
      case "letter_created":
        return (
          <span>
            <strong>{activity.userName}</strong> posted a new letter: "{activity.letterTitle}"
          </span>
        )
      case "comment_created":
        return (
          <span>
            <strong>{activity.userName}</strong> commented on a letter
            {activity.details && <div className="text-xs text-muted-foreground mt-1 italic">"{activity.details}"</div>}
          </span>
        )
      case "user_registered":
        return (
          <span>
            <strong>{activity.userName}</strong> joined the platform
          </span>
        )
      default:
        return <span>Unknown activity</span>
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
            <div className="flex-1">
              <Skeleton className="h-4 w-3/4 mb-1" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={fetchActivities}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No recent activity found</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="flex-shrink-0 mt-0.5">{getActivityIcon(activity.type)}</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm">{getActivityText(activity)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {activity.timestamp
                ? formatDistanceToNow(
                    activity.timestamp.toDate ? activity.timestamp.toDate() : new Date(activity.timestamp),
                    { addSuffix: true },
                  )
                : "Unknown time"}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
