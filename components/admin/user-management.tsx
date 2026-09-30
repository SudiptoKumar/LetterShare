"use client"

import { useState, useEffect } from "react"
import { db } from "@/lib/firebase"
import { collection, query, orderBy, limit, startAfter, getDocs, doc, updateDoc, where } from "firebase/firestore"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Search,
  MoreHorizontal,
  Ban,
  UserCheck,
  Shield,
  AlertTriangle,
  Eye,
  FileText,
  MessageSquare,
  UserX,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"

interface User {
  id: string
  displayName: string
  email: string
  createdAt: any
  lastLogin: any
  role: string
  status: string
  letterCount: number
  commentCount: number
  reportCount: number
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [lastVisible, setLastVisible] = useState<any>(null)
  const [hasMore, setHasMore] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserDetails, setShowUserDetails] = useState(false)
  const [showBanDialog, setShowBanDialog] = useState(false)
  const [banReason, setBanReason] = useState("")
  const [banDuration, setBanDuration] = useState("permanent")
  const [activeTab, setActiveTab] = useState("all")
  const { toast } = useToast()

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)

        const userQuery = query(collection(db, "users"), orderBy("createdAt", "desc"), limit(20))

        const snapshot = await getDocs(userQuery)

        if (snapshot.empty) {
          setUsers([])
          setFilteredUsers([])
          setHasMore(false)
          setLoading(false)
          return
        }

        setLastVisible(snapshot.docs[snapshot.docs.length - 1])

        const userData = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const user = { id: doc.id, ...doc.data() } as User

            // Get letter count
            const letterQuery = query(collection(db, "letters"), where("authorId", "==", doc.id))
            const letterSnapshot = await getDocs(letterQuery)
            user.letterCount = letterSnapshot.size

            // Get comment count
            const commentQuery = query(collection(db, "comments"), where("authorId", "==", doc.id))
            const commentSnapshot = await getDocs(commentQuery)
            user.commentCount = commentSnapshot.size

            // Get report count
            const reportQuery = query(collection(db, "reports"), where("reportedUserId", "==", doc.id))
            const reportSnapshot = await getDocs(reportQuery)
            user.reportCount = reportSnapshot.size

            return user
          }),
        )

        setUsers(userData)
        setFilteredUsers(userData)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching users:", error)
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  // Handle search
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(users)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = users.filter(
      (user) => user.displayName?.toLowerCase().includes(query) || user.email?.toLowerCase().includes(query),
    )

    setFilteredUsers(filtered)
  }, [searchQuery, users])

  // Handle tab filtering
  useEffect(() => {
    if (activeTab === "all") {
      setFilteredUsers(users)
      return
    }

    let filtered = [...users]

    if (activeTab === "admin") {
      filtered = filtered.filter((user) => user.role === "admin")
    } else if (activeTab === "banned") {
      filtered = filtered.filter((user) => user.status === "banned")
    } else if (activeTab === "active") {
      filtered = filtered.filter((user) => user.status === "active")
    } else if (activeTab === "reported") {
      filtered = filtered.filter((user) => user.reportCount > 0)
    }

    setFilteredUsers(filtered)
  }, [activeTab, users])

  // Load more users
  const loadMoreUsers = async () => {
    if (!lastVisible) return

    try {
      setLoading(true)

      const userQuery = query(collection(db, "users"), orderBy("createdAt", "desc"), startAfter(lastVisible), limit(20))

      const snapshot = await getDocs(userQuery)

      if (snapshot.empty) {
        setHasMore(false)
        setLoading(false)
        return
      }

      setLastVisible(snapshot.docs[snapshot.docs.length - 1])

      const userData = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const user = { id: doc.id, ...doc.data() } as User

          // Get letter count
          const letterQuery = query(collection(db, "letters"), where("authorId", "==", doc.id))
          const letterSnapshot = await getDocs(letterQuery)
          user.letterCount = letterSnapshot.size

          // Get comment count
          const commentQuery = query(collection(db, "comments"), where("authorId", "==", doc.id))
          const commentSnapshot = await getDocs(commentQuery)
          user.commentCount = commentSnapshot.size

          // Get report count
          const reportQuery = query(collection(db, "reports"), where("reportedUserId", "==", doc.id))
          const reportSnapshot = await getDocs(reportQuery)
          user.reportCount = reportSnapshot.size

          return user
        }),
      )

      setUsers([...users, ...userData])

      // Apply current filters
      if (activeTab === "all") {
        setFilteredUsers([...filteredUsers, ...userData])
      } else {
        let filtered = [...userData]

        if (activeTab === "admin") {
          filtered = filtered.filter((user) => user.role === "admin")
        } else if (activeTab === "banned") {
          filtered = filtered.filter((user) => user.status === "banned")
        } else if (activeTab === "active") {
          filtered = filtered.filter((user) => user.status === "active")
        } else if (activeTab === "reported") {
          filtered = filtered.filter((user) => user.reportCount > 0)
        }

        setFilteredUsers([...filteredUsers, ...filtered])
      }

      setLoading(false)
    } catch (error) {
      console.error("Error loading more users:", error)
      setLoading(false)
    }
  }

  // Ban user
  const banUser = async () => {
    if (!selectedUser) return

    try {
      const userRef = doc(db, "users", selectedUser.id)

      await updateDoc(userRef, {
        status: "banned",
        banReason: banReason,
        banDuration: banDuration,
        bannedAt: new Date(),
      })

      // Update local state
      const updatedUsers = users.map((user) => (user.id === selectedUser.id ? { ...user, status: "banned" } : user))

      setUsers(updatedUsers)

      // Apply current filters
      if (activeTab === "all" || activeTab === "banned") {
        setFilteredUsers(
          filteredUsers.map((user) => (user.id === selectedUser.id ? { ...user, status: "banned" } : user)),
        )
      } else {
        setFilteredUsers(filteredUsers.filter((user) => user.id !== selectedUser.id))
      }

      setShowBanDialog(false)
      setBanReason("")
      setBanDuration("permanent")

      toast({
        title: "User banned",
        description: `${selectedUser.displayName} has been banned.`,
        variant: "default",
      })
    } catch (error) {
      console.error("Error banning user:", error)
      toast({
        title: "Error",
        description: "Failed to ban user. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Unban user
  const unbanUser = async (user: User) => {
    try {
      const userRef = doc(db, "users", user.id)

      await updateDoc(userRef, {
        status: "active",
        banReason: null,
        banDuration: null,
        bannedAt: null,
      })

      // Update local state
      const updatedUsers = users.map((u) => (u.id === user.id ? { ...u, status: "active" } : u))

      setUsers(updatedUsers)

      // Apply current filters
      if (activeTab === "all" || activeTab === "active") {
        setFilteredUsers(filteredUsers.map((u) => (u.id === user.id ? { ...u, status: "active" } : u)))
      } else {
        setFilteredUsers(filteredUsers.filter((u) => u.id !== user.id))
      }

      toast({
        title: "User unbanned",
        description: `${user.displayName} has been unbanned.`,
        variant: "default",
      })
    } catch (error) {
      console.error("Error unbanning user:", error)
      toast({
        title: "Error",
        description: "Failed to unban user. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Make admin
  const makeAdmin = async (user: User) => {
    try {
      const userRef = doc(db, "users", user.id)

      await updateDoc(userRef, {
        role: "admin",
      })

      // Update local state
      const updatedUsers = users.map((u) => (u.id === user.id ? { ...u, role: "admin" } : u))

      setUsers(updatedUsers)

      // Apply current filters
      if (activeTab === "all" || activeTab === "admin") {
        setFilteredUsers(filteredUsers.map((u) => (u.id === user.id ? { ...u, role: "admin" } : u)))
      } else if (activeTab === "reported" && user.reportCount > 0) {
        setFilteredUsers(filteredUsers.map((u) => (u.id === user.id ? { ...u, role: "admin" } : u)))
      } else {
        setFilteredUsers(filteredUsers.filter((u) => u.id !== user.id))
      }

      toast({
        title: "Admin role granted",
        description: `${user.displayName} is now an admin.`,
        variant: "default",
      })
    } catch (error) {
      console.error("Error making user admin:", error)
      toast({
        title: "Error",
        description: "Failed to grant admin role. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Remove admin
  const removeAdmin = async (user: User) => {
    try {
      const userRef = doc(db, "users", user.id)

      await updateDoc(userRef, {
        role: "user",
      })

      // Update local state
      const updatedUsers = users.map((u) => (u.id === user.id ? { ...u, role: "user" } : u))

      setUsers(updatedUsers)

      // Apply current filters
      if (activeTab === "admin") {
        setFilteredUsers(filteredUsers.filter((u) => u.id !== user.id))
      } else {
        setFilteredUsers(filteredUsers.map((u) => (u.id === user.id ? { ...u, role: "user" } : u)))
      }

      toast({
        title: "Admin role removed",
        description: `${user.displayName} is no longer an admin.`,
        variant: "default",
      })
    } catch (error) {
      console.error("Error removing admin role:", error)
      toast({
        title: "Error",
        description: "Failed to remove admin role. Please try again.",
        variant: "destructive",
      })
    }
  }

  // View user details
  const viewUserDetails = (user: User) => {
    setSelectedUser(user)
    setShowUserDetails(true)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Manage users, assign roles, and moderate user accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name or email"
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
              <TabsList className="grid grid-cols-5 w-full md:w-auto">
                <TabsTrigger value="all" className="text-xs">
                  All
                </TabsTrigger>
                <TabsTrigger value="active" className="text-xs">
                  Active
                </TabsTrigger>
                <TabsTrigger value="admin" className="text-xs">
                  Admins
                </TabsTrigger>
                <TabsTrigger value="banned" className="text-xs">
                  Banned
                </TabsTrigger>
                <TabsTrigger value="reported" className="text-xs">
                  Reported
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div>
                              <Skeleton className="h-4 w-24 mb-1" />
                              <Skeleton className="h-3 w-32" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-16" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-16" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="h-8 w-8 ml-auto" />
                        </TableCell>
                      </TableRow>
                    ))
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center">
                            <span className="text-violet-600 font-medium text-sm">
                              {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">{user.displayName || "Unnamed User"}</div>
                            <div className="text-xs text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.status === "banned" ? (
                          <Badge variant="destructive" className="text-xs">
                            Banned
                          </Badge>
                        ) : user.status === "suspended" ? (
                          <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700">
                            Suspended
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs bg-green-100 text-green-700">
                            Active
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.role === "admin" ? (
                          <Badge className="text-xs bg-violet-100 text-violet-700">Admin</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">User</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.createdAt ? (
                          <span className="text-xs">
                            {formatDistanceToNow(
                              typeof user.createdAt.toDate === "function"
                                ? user.createdAt.toDate()
                                : new Date(user.createdAt),
                              { addSuffix: true },
                            )}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Unknown</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center text-xs">
                            <FileText className="h-3 w-3 mr-1 text-violet-500" />
                            {user.letterCount || 0}
                          </div>
                          <div className="flex items-center text-xs">
                            <MessageSquare className="h-3 w-3 mr-1 text-blue-500" />
                            {user.commentCount || 0}
                          </div>
                          {user.reportCount > 0 && (
                            <div className="flex items-center text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1 text-red-500" />
                              {user.reportCount}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => viewUserDetails(user)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {user.status === "banned" ? (
                              <DropdownMenuItem onClick={() => unbanUser(user)}>
                                <UserCheck className="mr-2 h-4 w-4" />
                                Unban User
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user)
                                  setShowBanDialog(true)
                                }}
                                className="text-red-600"
                              >
                                <Ban className="mr-2 h-4 w-4" />
                                Ban User
                              </DropdownMenuItem>
                            )}
                            {user.role === "admin" ? (
                              <DropdownMenuItem onClick={() => removeAdmin(user)}>
                                <UserX className="mr-2 h-4 w-4" />
                                Remove Admin
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => makeAdmin(user)}>
                                <Shield className="mr-2 h-4 w-4" />
                                Make Admin
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          {hasMore && (
            <Button variant="outline" onClick={loadMoreUsers} disabled={loading} className="w-full md:w-auto">
              {loading ? "Loading..." : "Load More Users"}
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>Detailed information about the selected user</DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <h3 className="text-sm font-medium mb-1">User Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Name:</span>
                      <span className="text-sm font-medium">{selectedUser.displayName || "Unnamed User"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Email:</span>
                      <span className="text-sm">{selectedUser.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Role:</span>
                      <span className="text-sm">
                        {selectedUser.role === "admin" ? (
                          <Badge className="text-xs bg-violet-100 text-violet-700">Admin</Badge>
                        ) : (
                          "User"
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <span className="text-sm">
                        {selectedUser.status === "banned" ? (
                          <Badge variant="destructive" className="text-xs">
                            Banned
                          </Badge>
                        ) : selectedUser.status === "suspended" ? (
                          <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700">
                            Suspended
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs bg-green-100 text-green-700">
                            Active
                          </Badge>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="text-sm font-medium mb-1">Activity Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Joined:</span>
                      <span className="text-sm">
                        {selectedUser.createdAt
                          ? formatDistanceToNow(
                              typeof selectedUser.createdAt.toDate === "function"
                                ? selectedUser.createdAt.toDate()
                                : new Date(selectedUser.createdAt),
                              { addSuffix: true },
                            )
                          : "Unknown"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Last Login:</span>
                      <span className="text-sm">
                        {selectedUser.lastLogin
                          ? formatDistanceToNow(
                              typeof selectedUser.lastLogin.toDate === "function"
                                ? selectedUser.lastLogin.toDate()
                                : new Date(selectedUser.lastLogin),
                              { addSuffix: true },
                            )
                          : "Unknown"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Letters:</span>
                      <span className="text-sm">{selectedUser.letterCount || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Comments:</span>
                      <span className="text-sm">{selectedUser.commentCount || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowUserDetails(false)}>
                  Close
                </Button>
                {selectedUser.status === "banned" ? (
                  <Button onClick={() => unbanUser(selectedUser)}>
                    <UserCheck className="mr-2 h-4 w-4" />
                    Unban User
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setShowUserDetails(false)
                      setShowBanDialog(true)
                    }}
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    Ban User
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Ban User Dialog */}
      <AlertDialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ban User</AlertDialogTitle>
            <AlertDialogDescription>
              This will prevent the user from accessing the platform. They will not be able to post new letters or
              comments.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Ban Reason</label>
              <Input
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Reason for banning this user"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Ban Duration</label>
              <select
                value={banDuration}
                onChange={(e) => setBanDuration(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="1_day">1 Day</option>
                <option value="7_days">7 Days</option>
                <option value="30_days">30 Days</option>
                <option value="permanent">Permanent</option>
              </select>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={banUser} className="bg-red-500 hover:bg-red-600">
              Ban User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
