"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell } from "lucide-react"

export default function NotificationsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [notifications, setNotifications] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push("/login")
      } else {
        setIsLoading(false)

        // In a real implementation, you would fetch notifications from Firestore
        // For now, we'll just set some placeholder notifications
        setNotifications([
          {
            id: "1",
            type: "message",
            content: "You have a new message",
            timestamp: new Date(),
            read: false,
          },
          {
            id: "2",
            type: "like",
            content: "Someone liked your letter",
            timestamp: new Date(Date.now() - 3600000),
            read: true,
          },
          {
            id: "3",
            type: "comment",
            content: "Someone commented on your letter",
            timestamp: new Date(Date.now() - 7200000),
            read: true,
          },
        ])
      }
    })

    return () => unsubscribe()
  }, [router])

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-5xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="h-24 bg-slate-200 rounded"></div>
          <div className="h-24 bg-slate-200 rounded"></div>
          <div className="h-24 bg-slate-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <Card className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-playfair text-violet-900 flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">You have no notifications</p>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border ${
                    notification.read ? "bg-white" : "bg-violet-50 border-violet-200"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <p className={notification.read ? "text-gray-700" : "text-violet-900 font-medium"}>
                      {notification.content}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {new Date(notification.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
