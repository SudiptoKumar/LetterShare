"use client"

import { useState, useEffect } from "react"
import { db } from "@/lib/firebase"
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  where,
  getDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  FileText,
  MessageSquare,
  AlertTriangle,
  MoreHorizontal,
  Eye,
  Trash,
  CheckCircle,
  XCircle,
  Flag,
  User,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"

interface Report {
  id: string
  contentId: string
  contentType: "letter" | "comment"
  reportedUserId: string
  reportedUserName: string
  reportReason: string
  reportedBy: string
  reportedByName: string
  createdAt: any
  status: "pending" | "reviewed" | "dismissed"
  content?: any
}

interface ContentItem {
  id: string
  type: "letter" | "comment"
  title?: string
  content: string
  authorId: string
  authorName: string
  createdAt: any
  reportCount: number
  isHidden?: boolean
  isFlagged?: boolean
}

export function ContentModeration() {
  const [reports, setReports] = useState<Report[]>([])
  const [flaggedContent, setFlaggedContent] = useState<ContentItem[]>([])
  const [recentContent, setRecentContent] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("reported")
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null)
  const [showReportDetails, setShowReportDetails] = useState(false)
  const [showContentDetails, setShowContentDetails] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { toast } = useToast()

  // Fetch reports and content
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch reports
        const reportsQuery = query(collection(db, "reports"), orderBy("createdAt", "desc"), limit(20))

        const reportsSnapshot = await getDocs(reportsQuery)

        const reportsData = await Promise.all(
          reportsSnapshot.docs.map(async (doc) => {
            const report = { id: doc.id, ...doc.data() } as Report

            // Get the reported content
            if (report.contentType === "letter") {
              const letterRef = doc(db, "letters", report.contentId)
              const letterSnap = await getDoc(letterRef)

              if (letterSnap.exists()) {
                report.content = { id: letterSnap.id, ...letterSnap.data() }
              }
            } else if (report.contentType === "comment") {
              const commentRef = doc(db, "comments", report.contentId)
              const commentSnap = await getDoc(commentRef)

              if (commentSnap.exists()) {
                report.content = { id: commentSnap.id, ...commentSnap.data() }
              }
            }

            return report
          }),
        )

        setReports(reportsData)

        // Fetch flagged content
        const flaggedLettersQuery = query(
          collection(db, "letters"),
          where("isFlagged", "==", true),
          orderBy("createdAt", "desc"),
          limit(10),
        )

        const flaggedCommentsQuery = query(
          collection(db, "comments"),
          where("isFlagged", "==", true),
          orderBy("createdAt", "desc"),
          limit(10),
        )

        const [flaggedLettersSnapshot, flaggedCommentsSnapshot] = await Promise.all([
          getDocs(flaggedLettersQuery),
          getDocs(flaggedCommentsQuery),
        ])

        const flaggedLetters = flaggedLettersSnapshot.docs.map((doc) => ({
          id: doc.id,
          type: "letter" as const,
          ...doc.data(),
          reportCount: doc.data().reportCount || 0,
        }))

        const flaggedComments = flaggedCommentsSnapshot.docs.map((doc) => ({
          id: doc.id,
          type: "comment" as const,
          ...doc.data(),
          reportCount: doc.data().reportCount || 0,
        }))

        setFlaggedContent(
          [...flaggedLetters, ...flaggedComments].sort((a, b) => {
            return b.createdAt.seconds - a.createdAt.seconds
          }),
        )

        // Fetch recent content
        const recentLettersQuery = query(collection(db, "letters"), orderBy("createdAt", "desc"), limit(10))

        const recentCommentsQuery = query(collection(db, "comments"), orderBy("createdAt", "desc"), limit(10))

        const [recentLettersSnapshot, recentCommentsSnapshot] = await Promise.all([
          getDocs(recentLettersQuery),
          getDocs(recentCommentsQuery),
        ])

        const recentLetters = recentLettersSnapshot.docs.map((doc) => ({
          id: doc.id,
          type: "letter" as const,
          ...doc.data(),
          reportCount: doc.data().reportCount || 0,
        }))

        const recentComments = recentCommentsSnapshot.docs.map((doc) => ({
          id: doc.id,
          type: "comment" as const,
          ...doc.data(),
          reportCount: doc.data().reportCount || 0,
        }))

        setRecentContent(
          [...recentLetters, ...recentComments].sort((a, b) => {
            return b.createdAt.seconds - a.createdAt.seconds
          }),
        )

        setLoading(false)
      } catch (error) {
        console.error("Error fetching content moderation data:", error)
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Handle report actions
  const dismissReport = async (report: Report) => {
    try {
      const reportRef = doc(db, "reports", report.id)

      await updateDoc(reportRef, {
        status: "dismissed",
        reviewedAt: serverTimestamp(),
      })

      // Update local state
      setReports(reports.map((r) => (r.id === report.id ? { ...r, status: "dismissed" } : r)))

      toast({
        title: "Report dismissed",
        description: "The report has been marked as dismissed.",
        variant: "default",
      })

      // Close dialog if open
      if (showReportDetails) {
        setShowReportDetails(false)
      }
    } catch (error) {
      console.error("Error dismissing report:", error)
      toast({
        title: "Error",
        description: "Failed to dismiss report. Please try again.",
        variant: "destructive",
      })
    }
  }

  const reviewReport = async (report: Report) => {
    try {
      const reportRef = doc(db, "reports", report.id)

      await updateDoc(reportRef, {
        status: "reviewed",
        reviewedAt: serverTimestamp(),
      })

      // Update local state
      setReports(reports.map((r) => (r.id === report.id ? { ...r, status: "reviewed" } : r)))

      toast({
        title: "Report reviewed",
        description: "The report has been marked as reviewed.",
        variant: "default",
      })

      // Close dialog if open
      if (showReportDetails) {
        setShowReportDetails(false)
      }
    } catch (error) {
      console.error("Error reviewing report:", error)
      toast({
        title: "Error",
        description: "Failed to review report. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle content actions
  const deleteContent = async () => {
    if (!selectedContent) return

    try {
      // Delete the content
      if (selectedContent.type === "letter") {
        await deleteDoc(doc(db, "letters", selectedContent.id))

        // Also delete associated comments
        const commentsQuery = query(collection(db, "comments"), where("letterId", "==", selectedContent.id))

        const commentsSnapshot = await getDocs(commentsQuery)

        const deletePromises = commentsSnapshot.docs.map((doc) => deleteDoc(doc.ref))

        await Promise.all(deletePromises)
      } else {
        await deleteDoc(doc(db, "comments", selectedContent.id))
      }

      // Add activity log
      await addDoc(collection(db, "activity"), {
        type: "content_deleted",
        contentId: selectedContent.id,
        contentType: selectedContent.type,
        adminId: "admin", // Should be the current admin's ID
        timestamp: serverTimestamp(),
        reason: "Content moderation",
      })

      // Update local state
      if (activeTab === "flagged") {
        setFlaggedContent(
          flaggedContent.filter((c) => !(c.id === selectedContent.id && c.type === selectedContent.type)),
        )
      } else if (activeTab === "recent") {
        setRecentContent(recentContent.filter((c) => !(c.id === selectedContent.id && c.type === selectedContent.type)))
      }

      // Also update in reports if present
      const updatedReports = reports.map((report) => {
        if (report.contentId === selectedContent.id && report.contentType === selectedContent.type) {
          return {
            ...report,
            content: {
              ...report.content,
              isDeleted: true,
            },
          }
        }
        return report
      })

      setReports(updatedReports)

      toast({
        title: "Content deleted",
        description: `The ${selectedContent.type} has been permanently deleted.`,
        variant: "default",
      })

      // Close dialogs
      setShowDeleteDialog(false)
      setShowContentDetails(false)
    } catch (error) {
      console.error("Error deleting content:", error)
      toast({
        title: "Error",
        description: "Failed to delete content. Please try again.",
        variant: "destructive",
      })
    }
  }

  const hideContent = async (content: ContentItem) => {
    try {
      const contentRef = doc(db, content.type === "letter" ? "letters" : "comments", content.id)

      await updateDoc(contentRef, {
        isHidden: true,
      })

      // Update local state
      if (activeTab === "flagged") {
        setFlaggedContent(
          flaggedContent.map((c) => (c.id === content.id && c.type === content.type ? { ...c, isHidden: true } : c)),
        )
      } else if (activeTab === "recent") {
        setRecentContent(
          recentContent.map((c) => (c.id === content.id && c.type === content.type ? { ...c, isHidden: true } : c)),
        )
      }

      // Also update in reports if present
      const updatedReports = reports.map((report) => {
        if (report.contentId === content.id && report.contentType === content.type) {
          return {
            ...report,
            content: {
              ...report.content,
              isHidden: true,
            },
          }
        }
        return report
      })

      setReports(updatedReports)

      toast({
        title: "Content hidden",
        description: `The ${content.type} has been hidden from public view.`,
        variant: "default",
      })
    } catch (error) {
      console.error("Error hiding content:", error)
      toast({
        title: "Error",
        description: "Failed to hide content. Please try again.",
        variant: "destructive",
      })
    }
  }

  const showContent = async (content: ContentItem) => {
    try {
      const contentRef = doc(db, content.type === "letter" ? "letters" : "comments", content.id)

      await updateDoc(contentRef, {
        isHidden: false,
      })

      // Update local state
      if (activeTab === "flagged") {
        setFlaggedContent(
          flaggedContent.map((c) => (c.id === content.id && c.type === content.type ? { ...c, isHidden: false } : c)),
        )
      } else if (activeTab === "recent") {
        setRecentContent(
          recentContent.map((c) => (c.id === content.id && c.type === content.type ? { ...c, isHidden: false } : c)),
        )
      }

      // Also update in reports if present
      const updatedReports = reports.map((report) => {
        if (report.contentId === content.id && report.contentType === content.type) {
          return {
            ...report,
            content: {
              ...report.content,
              isHidden: false,
            },
          }
        }
        return report
      })

      setReports(updatedReports)

      toast({
        title: "Content visible",
        description: `The ${content.type} is now visible to the public.`,
        variant: "default",
      })
    } catch (error) {
      console.error("Error showing content:", error)
      toast({
        title: "Error",
        description: "Failed to show content. Please try again.",
        variant: "destructive",
      })
    }
  }

  const unflagContent = async (content: ContentItem) => {
    try {
      const contentRef = doc(db, content.type === "letter" ? "letters" : "comments", content.id)

      await updateDoc(contentRef, {
        isFlagged: false,
      })

      // Update local state
      if (activeTab === "flagged") {
        setFlaggedContent(flaggedContent.filter((c) => !(c.id === content.id && c.type === content.type)))
      } else if (activeTab === "recent") {
        setRecentContent(
          recentContent.map((c) => (c.id === content.id && c.type === content.type ? { ...c, isFlagged: false } : c)),
        )
      }

      // Also update in reports if present
      const updatedReports = reports.map((report) => {
        if (report.contentId === content.id && report.contentType === content.type) {
          return {
            ...report,
            content: {
              ...report.content,
              isFlagged: false,
            },
          }
        }
        return report
      })

      setReports(updatedReports)

      toast({
        title: "Content unflagged",
        description: `The ${content.type} has been unflagged.`,
        variant: "default",
      })
    } catch (error) {
      console.error("Error unflagging content:", error)
      toast({
        title: "Error",
        description: "Failed to unflag content. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Content Moderation</CardTitle>
          <CardDescription>Review and moderate user-generated content across the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-3 w-full md:w-auto">
              <TabsTrigger value="reported" className="text-xs md:text-sm">
                Reported Content
                {reports.filter((r) => r.status === "pending").length > 0 && (
                  <Badge className="ml-2 bg-red-500 text-white">
                    {reports.filter((r) => r.status === "pending").length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="flagged" className="text-xs md:text-sm">
                Flagged Content
                {flaggedContent.length > 0 && (
                  <Badge className="ml-2 bg-orange-500 text-white">{flaggedContent.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="recent" className="text-xs md:text-sm">
                Recent Content
              </TabsTrigger>
            </TabsList>

            <TabsContent value="reported" className="space-y-4">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between">
                          <Skeleton className="h-5 w-40" />
                          <Skeleton className="h-5 w-20" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-16 w-full mb-2" />
                        <div className="flex justify-between">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-8 w-20" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : reports.filter((r) => r.status === "pending").length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <h3 className="text-lg font-medium">No pending reports</h3>
                  <p className="text-muted-foreground">All reports have been reviewed</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports
                    .filter((r) => r.status === "pending")
                    .map((report) => (
                      <Card key={report.id} className="overflow-hidden">
                        <CardHeader className="pb-2 bg-red-50">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center">
                                <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                                <CardTitle className="text-sm font-medium">
                                  {report.contentType === "letter" ? "Letter" : "Comment"} Reported
                                </CardTitle>
                              </div>
                              <CardDescription>Reason: {report.reportReason}</CardDescription>
                            </div>
                            <Badge variant="outline" className="bg-red-100 text-red-700 text-xs">
                              {formatDistanceToNow(
                                typeof report.createdAt.toDate === "function"
                                  ? report.createdAt.toDate()
                                  : new Date(report.createdAt),
                                { addSuffix: true },
                              )}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                                <User className="h-4 w-4 text-violet-600" />
                              </div>
                              <div>
                                <div className="font-medium text-sm">{report.reportedUserName}</div>
                                <div className="text-xs text-muted-foreground">
                                  {report.content?.createdAt &&
                                    formatDistanceToNow(
                                      typeof report.content.createdAt.toDate === "function"
                                        ? report.content.createdAt.toDate()
                                        : new Date(report.content.createdAt),
                                      { addSuffix: true },
                                    )}
                                </div>
                              </div>
                            </div>

                            <div className="bg-gray-50 p-3 rounded-md text-sm">
                              {report.contentType === "letter" ? (
                                <>
                                  <div className="font-medium mb-1">{report.content?.title || "Untitled Letter"}</div>
                                  <div className="line-clamp-3">{report.content?.content || "Content unavailable"}</div>
                                </>
                              ) : (
                                <div className="line-clamp-3">{report.content?.content || "Content unavailable"}</div>
                              )}
                            </div>

                            <div className="flex justify-between items-center pt-2">
                              <div className="text-xs text-muted-foreground">Reported by: {report.reportedByName}</div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedReport(report)
                                    setShowReportDetails(true)
                                  }}
                                  className="text-xs"
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => dismissReport(report)}
                                  className="text-xs"
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Dismiss
                                </Button>
                                <Button size="sm" onClick={() => reviewReport(report)} className="text-xs">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Review
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="flagged" className="space-y-4">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between">
                          <Skeleton className="h-5 w-40" />
                          <Skeleton className="h-5 w-20" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-16 w-full mb-2" />
                        <div className="flex justify-between">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-8 w-20" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : flaggedContent.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <h3 className="text-lg font-medium">No flagged content</h3>
                  <p className="text-muted-foreground">All content has been reviewed</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {flaggedContent.map((content) => (
                    <Card key={`${content.type}-${content.id}`} className="overflow-hidden">
                      <CardHeader className="pb-2 bg-orange-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center">
                              <Flag className="h-4 w-4 text-orange-500 mr-2" />
                              <CardTitle className="text-sm font-medium">
                                Flagged {content.type === "letter" ? "Letter" : "Comment"}
                              </CardTitle>
                            </div>
                            <CardDescription>
                              {content.reportCount} report{content.reportCount !== 1 ? "s" : ""}
                            </CardDescription>
                          </div>
                          <Badge
                            variant={content.isHidden ? "outline" : "default"}
                            className={`text-xs ${content.isHidden ? "bg-gray-100 text-gray-700" : "bg-orange-500"}`}
                          >
                            {content.isHidden ? "Hidden" : "Visible"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                              <User className="h-4 w-4 text-violet-600" />
                            </div>
                            <div>
                              <div className="font-medium text-sm">{content.authorName}</div>
                              <div className="text-xs text-muted-foreground">
                                {content.createdAt &&
                                  formatDistanceToNow(
                                    typeof content.createdAt.toDate === "function"
                                      ? content.createdAt.toDate()
                                      : new Date(content.createdAt),
                                    { addSuffix: true },
                                  )}
                              </div>
                            </div>
                          </div>

                          <div className="bg-gray-50 p-3 rounded-md text-sm">
                            {content.type === "letter" ? (
                              <>
                                <div className="font-medium mb-1">{content.title || "Untitled Letter"}</div>
                                <div className="line-clamp-3">{content.content}</div>
                              </>
                            ) : (
                              <div className="line-clamp-3">{content.content}</div>
                            )}
                          </div>

                          <div className="flex justify-end items-center pt-2 gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedContent(content)
                                setShowContentDetails(true)
                              }}
                              className="text-xs"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => unflagContent(content)}
                              className="text-xs"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Unflag
                            </Button>
                            {content.isHidden ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => showContent(content)}
                                className="text-xs"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Show
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => hideContent(content)}
                                className="text-xs text-orange-600"
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Hide
                              </Button>
                            )}
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setSelectedContent(content)
                                setShowDeleteDialog(true)
                              }}
                              className="text-xs"
                            >
                              <Trash className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="recent" className="space-y-4">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between">
                          <Skeleton className="h-5 w-40" />
                          <Skeleton className="h-5 w-20" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-16 w-full mb-2" />
                        <div className="flex justify-between">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-8 w-20" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : recentContent.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No recent content</h3>
                  <p className="text-muted-foreground">No content has been posted recently</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentContent.map((content) => (
                    <Card key={`${content.type}-${content.id}`} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center">
                              {content.type === "letter" ? (
                                <FileText className="h-4 w-4 text-violet-500 mr-2" />
                              ) : (
                                <MessageSquare className="h-4 w-4 text-blue-500 mr-2" />
                              )}
                              <CardTitle className="text-sm font-medium">
                                {content.type === "letter" ? "Letter" : "Comment"}
                              </CardTitle>
                            </div>
                            {content.reportCount > 0 && (
                              <CardDescription className="text-red-500">
                                {content.reportCount} report{content.reportCount !== 1 ? "s" : ""}
                              </CardDescription>
                            )}
                          </div>
                          <div className="flex gap-1">
                            {content.isFlagged && <Badge className="bg-orange-500 text-xs">Flagged</Badge>}
                            {content.isHidden && (
                              <Badge variant="outline" className="bg-gray-100 text-gray-700 text-xs">
                                Hidden
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                              <User className="h-4 w-4 text-violet-600" />
                            </div>
                            <div>
                              <div className="font-medium text-sm">{content.authorName}</div>
                              <div className="text-xs text-muted-foreground">
                                {content.createdAt &&
                                  formatDistanceToNow(
                                    typeof content.createdAt.toDate === "function"
                                      ? content.createdAt.toDate()
                                      : new Date(content.createdAt),
                                    { addSuffix: true },
                                  )}
                              </div>
                            </div>
                          </div>

                          <div className="bg-gray-50 p-3 rounded-md text-sm">
                            {content.type === "letter" ? (
                              <>
                                <div className="font-medium mb-1">{content.title || "Untitled Letter"}</div>
                                <div className="line-clamp-3">{content.content}</div>
                              </>
                            ) : (
                              <div className="line-clamp-3">{content.content}</div>
                            )}
                          </div>

                          <div className="flex justify-end items-center pt-2 gap-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="text-xs">
                                  <MoreHorizontal className="h-3 w-3 mr-1" />
                                  Actions
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedContent(content)
                                    setShowContentDetails(true)
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                {content.isHidden ? (
                                  <DropdownMenuItem onClick={() => showContent(content)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Show Content
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => hideContent(content)}>
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Hide Content
                                  </DropdownMenuItem>
                                )}
                                {content.isFlagged && (
                                  <DropdownMenuItem onClick={() => unflagContent(content)}>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Unflag Content
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedContent(content)
                                    setShowDeleteDialog(true)
                                  }}
                                  className="text-red-600"
                                >
                                  <Trash className="h-4 w-4 mr-2" />
                                  Delete Content
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Report Details Dialog */}
      <Dialog open={showReportDetails} onOpenChange={setShowReportDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
            <DialogDescription>Detailed information about the reported content</DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Report Information</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm text-muted-foreground">Report Type:</div>
                  <div className="text-sm">{selectedReport.contentType === "letter" ? "Letter" : "Comment"}</div>

                  <div className="text-sm text-muted-foreground">Reason:</div>
                  <div className="text-sm">{selectedReport.reportReason}</div>

                  <div className="text-sm text-muted-foreground">Reported By:</div>
                  <div className="text-sm">{selectedReport.reportedByName}</div>

                  <div className="text-sm text-muted-foreground">Date Reported:</div>
                  <div className="text-sm">
                    {selectedReport.createdAt &&
                      formatDistanceToNow(
                        typeof selectedReport.createdAt.toDate === "function"
                          ? selectedReport.createdAt.toDate()
                          : new Date(selectedReport.createdAt),
                        { addSuffix: true },
                      )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Reported Content</h3>
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-violet-600" />
                        <div className="font-medium text-sm">{selectedReport.reportedUserName}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {selectedReport.content?.createdAt &&
                          formatDistanceToNow(
                            typeof selectedReport.content.createdAt.toDate === "function"
                              ? selectedReport.content.createdAt.toDate()
                              : new Date(selectedReport.content.createdAt),
                            { addSuffix: true },
                          )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {selectedReport.contentType === "letter" ? (
                      <>
                        <h4 className="font-medium mb-2">{selectedReport.content?.title || "Untitled Letter"}</h4>
                        <p className="whitespace-pre-line">
                          {selectedReport.content?.content || "Content unavailable"}
                        </p>
                      </>
                    ) : (
                      <p className="whitespace-pre-line">{selectedReport.content?.content || "Content unavailable"}</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => dismissReport(selectedReport)}>
                  Dismiss Report
                </Button>
                <Button variant="outline" onClick={() => reviewReport(selectedReport)}>
                  Mark as Reviewed
                </Button>
                {selectedReport.content && (
                  <>
                    {selectedReport.content.isHidden ? (
                      <Button
                        variant="outline"
                        onClick={() =>
                          showContent({
                            id: selectedReport.contentId,
                            type: selectedReport.contentType,
                            ...selectedReport.content,
                          })
                        }
                      >
                        Show Content
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() =>
                          hideContent({
                            id: selectedReport.contentId,
                            type: selectedReport.contentType,
                            ...selectedReport.content,
                          })
                        }
                      >
                        Hide Content
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setSelectedContent({
                          id: selectedReport.contentId,
                          type: selectedReport.contentType,
                          ...selectedReport.content,
                        })
                        setShowReportDetails(false)
                        setShowDeleteDialog(true)
                      }}
                    >
                      Delete Content
                    </Button>
                  </>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Content Details Dialog */}
      <Dialog open={showContentDetails} onOpenChange={setShowContentDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Content Details</DialogTitle>
            <DialogDescription>Detailed information about the selected content</DialogDescription>
          </DialogHeader>

          {selectedContent && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Content Information</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm text-muted-foreground">Content Type:</div>
                  <div className="text-sm">{selectedContent.type === "letter" ? "Letter" : "Comment"}</div>

                  <div className="text-sm text-muted-foreground">Author:</div>
                  <div className="text-sm">{selectedContent.authorName}</div>

                  <div className="text-sm text-muted-foreground">Date Posted:</div>
                  <div className="text-sm">
                    {selectedContent.createdAt &&
                      formatDistanceToNow(
                        typeof selectedContent.createdAt.toDate === "function"
                          ? selectedContent.createdAt.toDate()
                          : new Date(selectedContent.createdAt),
                        { addSuffix: true },
                      )}
                  </div>

                  <div className="text-sm text-muted-foreground">Status:</div>
                  <div className="text-sm">
                    {selectedContent.isHidden ? "Hidden" : "Visible"}
                    {selectedContent.isFlagged && ", Flagged"}
                  </div>

                  {selectedContent.reportCount > 0 && (
                    <>
                      <div className="text-sm text-muted-foreground">Reports:</div>
                      <div className="text-sm text-red-500">{selectedContent.reportCount}</div>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Content</h3>
                <Card>
                  <CardContent className="pt-4">
                    {selectedContent.type === "letter" ? (
                      <>
                        <h4 className="font-medium mb-2">{selectedContent.title || "Untitled Letter"}</h4>
                        <p className="whitespace-pre-line">{selectedContent.content}</p>
                      </>
                    ) : (
                      <p className="whitespace-pre-line">{selectedContent.content}</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setShowContentDetails(false)}>
                  Close
                </Button>
                {selectedContent.isHidden ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      showContent(selectedContent)
                      setShowContentDetails(false)
                    }}
                  >
                    Show Content
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => {
                      hideContent(selectedContent)
                      setShowContentDetails(false)
                    }}
                  >
                    Hide Content
                  </Button>
                )}
                {selectedContent.isFlagged && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      unflagContent(selectedContent)
                      setShowContentDetails(false)
                    }}
                  >
                    Unflag Content
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={() => {
                    setShowContentDetails(false)
                    setShowDeleteDialog(true)
                  }}
                >
                  Delete Content
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Content Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Content</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              {selectedContent?.type === "letter" ? " letter" : " comment"}
              {selectedContent?.type === "letter" && " and all its comments"}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteContent} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
