"use client"

import { useState, useEffect } from "react"
import { db } from "@/lib/firebase"
import { collection, query, where, orderBy, getDocs, Timestamp } from "firebase/firestore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts"
import { MessageSquare, TrendingUp, Heart } from "lucide-react"
import { format, subDays, eachDayOfInterval, startOfDay } from "date-fns"

export function PlatformAnalytics() {
  const [timeframe, setTimeframe] = useState("7_days")
  const [loading, setLoading] = useState(true)
  const [userStats, setUserStats] = useState<any[]>([])
  const [contentStats, setContentStats] = useState<any[]>([])
  const [engagementStats, setEngagementStats] = useState<any[]>([])
  const [categoryData, setCategoryData] = useState<any[]>([])
  const [topUsers, setTopUsers] = useState<any[]>([])
  const [topLetters, setTopLetters] = useState<any[]>([])

  // Colors for charts
  const COLORS = ["#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe", "#f5f3ff"]

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)

        // Calculate date range based on timeframe
        const now = new Date()
        let startDate: Date

        switch (timeframe) {
          case "7_days":
            startDate = subDays(now, 7)
            break
          case "30_days":
            startDate = subDays(now, 30)
            break
          case "90_days":
            startDate = subDays(now, 90)
            break
          default:
            startDate = subDays(now, 7)
        }

        const dateRange = eachDayOfInterval({ start: startDate, end: now })

        // Initialize data arrays with dates
        const userData = dateRange.map((date) => ({
          date: format(date, "MMM dd"),
          newUsers: 0,
          activeUsers: 0,
        }))

        const contentData = dateRange.map((date) => ({
          date: format(date, "MMM dd"),
          letters: 0,
          comments: 0,
        }))

        const engagementData = dateRange.map((date) => ({
          date: format(date, "MMM dd"),
          reactions: 0,
          comments: 0,
          views: 0,
        }))

        // Fetch user data
        const usersRef = collection(db, "users")
        const usersSnapshot = await getDocs(usersRef)

        // Process user data
        usersSnapshot.docs.forEach((doc) => {
          const userData = doc.data()

          if (userData.createdAt) {
            const createdDate = userData.createdAt.toDate ? userData.createdAt.toDate() : new Date(userData.createdAt)

            // Check if within timeframe
            if (createdDate >= startDate && createdDate <= now) {
              const dateIndex = dateRange.findIndex(
                (date) => startOfDay(date).getTime() === startOfDay(createdDate).getTime(),
              )

              if (dateIndex !== -1) {
                userData[dateIndex].newUsers += 1
              }
            }
          }

          if (userData.lastLogin) {
            const lastLoginDate = userData.lastLogin.toDate ? userData.lastLogin.toDate() : new Date(userData.lastLogin)

            // Check if within timeframe
            if (lastLoginDate >= startDate && lastLoginDate <= now) {
              const dateIndex = dateRange.findIndex(
                (date) => startOfDay(date).getTime() === startOfDay(lastLoginDate).getTime(),
              )

              if (dateIndex !== -1) {
                userData[dateIndex].activeUsers += 1
              }
            }
          }
        })

        // Fetch letter data
        const lettersRef = collection(db, "letters")
        const lettersQuery = query(
          lettersRef,
          where("createdAt", ">=", Timestamp.fromDate(startDate)),
          orderBy("createdAt", "desc"),
        )
        const lettersSnapshot = await getDocs(lettersQuery)

        // Process letter data
        lettersSnapshot.docs.forEach((doc) => {
          const letterData = doc.data()

          if (letterData.createdAt) {
            const createdDate = letterData.createdAt.toDate
              ? letterData.createdAt.toDate()
              : new Date(letterData.createdAt)

            const dateIndex = dateRange.findIndex(
              (date) => startOfDay(date).getTime() === startOfDay(createdDate).getTime(),
            )

            if (dateIndex !== -1) {
              contentData[dateIndex].letters += 1
            }
          }
        })

        // Fetch comment data
        const commentsRef = collection(db, "comments")
        const commentsQuery = query(
          commentsRef,
          where("createdAt", ">=", Timestamp.fromDate(startDate)),
          orderBy("createdAt", "desc"),
        )
        const commentsSnapshot = await getDocs(commentsQuery)

        // Process comment data
        commentsSnapshot.docs.forEach((doc) => {
          const commentData = doc.data()

          if (commentData.createdAt) {
            const createdDate = commentData.createdAt.toDate
              ? commentData.createdAt.toDate()
              : new Date(commentData.createdAt)

            const dateIndex = dateRange.findIndex(
              (date) => startOfDay(date).getTime() === startOfDay(createdDate).getTime(),
            )

            if (dateIndex !== -1) {
              contentData[dateIndex].comments += 1
              engagementData[dateIndex].comments += 1
            }
          }
        })

        // Fetch reaction data
        const reactionsRef = collection(db, "reactions")
        const reactionsQuery = query(
          reactionsRef,
          where("createdAt", ">=", Timestamp.fromDate(startDate)),
          orderBy("createdAt", "desc"),
        )
        const reactionsSnapshot = await getDocs(reactionsQuery)

        // Process reaction data
        reactionsSnapshot.docs.forEach((doc) => {
          const reactionData = doc.data()

          if (reactionData.createdAt) {
            const createdDate = reactionData.createdAt.toDate
              ? reactionData.createdAt.toDate()
              : new Date(reactionData.createdAt)

            const dateIndex = dateRange.findIndex(
              (date) => startOfDay(date).getTime() === startOfDay(createdDate).getTime(),
            )

            if (dateIndex !== -1) {
              engagementData[dateIndex].reactions += 1
            }
          }
        })

        // Fetch view data
        const viewsRef = collection(db, "views")
        const viewsQuery = query(
          viewsRef,
          where("timestamp", ">=", Timestamp.fromDate(startDate)),
          orderBy("timestamp", "desc"),
        )
        const viewsSnapshot = await getDocs(viewsQuery)

        // Process view data
        viewsSnapshot.docs.forEach((doc) => {
          const viewData = doc.data()

          if (viewData.timestamp) {
            const viewDate = viewData.timestamp.toDate ? viewData.timestamp.toDate() : new Date(viewData.timestamp)

            const dateIndex = dateRange.findIndex(
              (date) => startOfDay(date).getTime() === startOfDay(viewDate).getTime(),
            )

            if (dateIndex !== -1) {
              engagementData[dateIndex].views += 1
            }
          }
        })

        // Fetch category data
        const categoryStats: Record<string, number> = {}

        lettersSnapshot.docs.forEach((doc) => {
          const letterData = doc.data()

          if (letterData.category) {
            categoryStats[letterData.category] = (categoryStats[letterData.category] || 0) + 1
          } else {
            categoryStats["uncategorized"] = (categoryStats["uncategorized"] || 0) + 1
          }
        })

        const categoryChartData = Object.entries(categoryStats).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
        }))

        // Fetch top users
        const userActivity: Record<
          string,
          { userId: string; name: string; letters: number; comments: number; reactions: number }
        > = {}

        // Add letter counts
        lettersSnapshot.docs.forEach((doc) => {
          const letterData = doc.data()

          if (letterData.authorId) {
            if (!userActivity[letterData.authorId]) {
              userActivity[letterData.authorId] = {
                userId: letterData.authorId,
                name: letterData.authorName || "Unknown User",
                letters: 0,
                comments: 0,
                reactions: 0,
              }
            }

            userActivity[letterData.authorId].letters += 1
          }
        })

        // Add comment counts
        commentsSnapshot.docs.forEach((doc) => {
          const commentData = doc.data()

          if (commentData.authorId) {
            if (!userActivity[commentData.authorId]) {
              userActivity[commentData.authorId] = {
                userId: commentData.authorId,
                name: commentData.authorName || "Unknown User",
                letters: 0,
                comments: 0,
                reactions: 0,
              }
            }

            userActivity[commentData.authorId].comments += 1
          }
        })

        // Calculate top users
        const topUsersData = Object.values(userActivity)
          .sort((a, b) => b.letters + b.comments - (a.letters + a.comments))
          .slice(0, 5)

        // Fetch top letters
        const topLettersData = lettersSnapshot.docs
          .map((doc) => {
            const data = doc.data()
            return {
              id: doc.id,
              title: data.title || "Untitled Letter",
              authorName: data.authorName || "Unknown User",
              likes: data.likes?.length || 0,
              commentCount: data.commentCount || 0,
              views: data.viewCount || 0,
              engagement: (data.likes?.length || 0) + (data.commentCount || 0) + (data.viewCount || 0),
            }
          })
          .sort((a, b) => b.engagement - a.engagement)
          .slice(0, 5)

        // Set state
        setUserStats(userData)
        setContentStats(contentData)
        setEngagementStats(engagementData)
        setCategoryData(categoryChartData)
        setTopUsers(topUsersData)
        setTopLetters(topLettersData)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching analytics:", error)
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [timeframe])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Platform Analytics</CardTitle>
              <CardDescription>Insights and statistics about platform usage and engagement</CardDescription>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-muted-foreground mr-2">Timeframe:</span>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                <option value="7_days">Last 7 Days</option>
                <option value="30_days">Last 30 Days</option>
                <option value="90_days">Last 90 Days</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="engagement">Engagement</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-[300px] w-full" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Skeleton className="h-[200px] w-full" />
                    <Skeleton className="h-[200px] w-full" />
                  </div>
                </div>
              ) : (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Activity Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={contentStats} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="letters"
                              stroke="#8b5cf6"
                              activeDot={{ r: 8 }}
                              name="Letters"
                            />
                            <Line type="monotone" dataKey="comments" stroke="#a78bfa" name="Comments" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Content Categories</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[200px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={categoryData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              >
                                {categoryData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Top Contributors</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[200px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={topUsers}
                              layout="vertical"
                              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis type="number" />
                              <YAxis dataKey="name" type="category" width={100} />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="letters" name="Letters" fill="#8b5cf6" />
                              <Bar dataKey="comments" name="Comments" fill="#a78bfa" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              {loading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">User Growth</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={userStats} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="newUsers"
                            stroke="#8b5cf6"
                            activeDot={{ r: 8 }}
                            name="New Users"
                          />
                          <Line type="monotone" dataKey="activeUsers" stroke="#a78bfa" name="Active Users" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-[300px] w-full" />
                  <Skeleton className="h-[200px] w-full" />
                </div>
              ) : (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Content Creation</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={contentStats} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="letters" name="Letters" fill="#8b5cf6" />
                            <Bar dataKey="comments" name="Comments" fill="#a78bfa" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Top Performing Letters</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {topLetters.map((letter, index) => (
                          <div key={letter.id} className="flex items-center justify-between border-b pb-2">
                            <div className="flex items-start gap-2">
                              <div className="h-6 w-6 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-violet-600 text-xs font-medium">{index + 1}</span>
                              </div>
                              <div>
                                <div className="font-medium text-sm">{letter.title}</div>
                                <div className="text-xs text-muted-foreground">By {letter.authorName}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center text-xs">
                                <Heart className="h-3 w-3 mr-1 text-red-500" />
                                {letter.likes}
                              </div>
                              <div className="flex items-center text-xs">
                                <MessageSquare className="h-3 w-3 mr-1 text-blue-500" />
                                {letter.commentCount}
                              </div>
                              <div className="flex items-center text-xs">
                                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                                {letter.views}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            <TabsContent value="engagement" className="space-y-4">
              {loading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Engagement Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={engagementStats} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="reactions"
                            stroke="#8b5cf6"
                            activeDot={{ r: 8 }}
                            name="Reactions"
                          />
                          <Line type="monotone" dataKey="comments" stroke="#a78bfa" name="Comments" />
                          <Line type="monotone" dataKey="views" stroke="#c4b5fd" name="Views" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
