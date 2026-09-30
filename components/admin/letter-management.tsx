"use client"

import { useState, useEffect } from "react"
import { db } from "@/lib/firebase"
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  where,
  addDoc,
  serverTimestamp,
} from "firebase/firestore"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Search, MoreHorizontal, Eye, Trash, XCircle, Star, MessageSquare, Heart } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
import type { Letter } from "@/types/letter"

export function LetterManagement() {
  const [letters, setLetters] = useState<Letter[]>([])
  const [filteredLetters, setFilteredLetters] = useState<Letter[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [lastVisible, setLastVisible] = useState<any>(null)
  const [hasMore, setHasMore] = useState(true)
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null)
  const [showLetterDetails, setShowLetterDetails] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [filterCategory, setFilterCategory] = useState("all")
  const [categories, setCategories] = useState<string[]>([])
  const { toast } = useToast()

  // Fetch letters
  useEffect(() => {
    const fetchLetters = async () => {
      try {
        setLoading(true)

        const lettersQuery = query(collection(db, "letters"), orderBy("createdAt", "desc"), limit(20))

        const snapshot = await getDocs(lettersQuery)

        if (snapshot.empty) {
          setLetters([])
          setFilteredLetters([])
          setHasMore(false)
          setLoading(false)
          return
        }

        setLastVisible(snapshot.docs[snapshot.docs.length - 1])

        const lettersData = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const letter = { id: doc.id, ...doc.data() } as Letter

            // Get comment count if not already in the data
            if (letter.commentCount === undefined) {
              const commentsQuery = query(collection(db, "comments"), where("letterId", "==", doc.id))
              const commentsSnapshot = await getDocs(commentsQuery)
              letter.commentCount = commentsSnapshot.size
            }

            return letter
          }),
        )

        // Extract unique categories
        const uniqueCategories = Array.from(
          new Set(lettersData.map((letter) => letter.category).filter(Boolean)),
        ) as string[]

        setCategories(uniqueCategories)
        setLetters(lettersData)
        setFilteredLetters(lettersData)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching letters:", error)
        setLoading(false)
      }
    }

    fetchLetters()
  }, [])

  // Handle search
  useEffect(() => {
    if (searchQuery.trim() === "" && filterCategory === "all") {
      setFilteredLetters(letters)
      return
    }

    let filtered = [...letters]

    // Apply search filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (letter) =>
          letter.title?.toLowerCase().includes(query) ||
          letter.content?.toLowerCase().includes(query) ||
          letter.authorName?.toLowerCase().includes(query),
      )
    }

    // Apply category filter
    if (filterCategory !== "all") {
      filtered = filtered.filter((letter) => letter.category === filterCategory)
    }

    setFilteredLetters(filtered)
  }, [searchQuery, filterCategory, letters])

  // Load more letters
  const loadMoreLetters = async () => {
    if (!lastVisible) return

    try {
      setLoading(true)

      const lettersQuery = query(
        collection(db, "letters"),
        orderBy("createdAt", "desc"),
        startAfter(lastVisible),
        limit(20),
      )

      const snapshot = await getDocs(lettersQuery)

      if (snapshot.empty) {
        setHasMore(false)
        setLoading(false)
        return
      }

      setLastVisible(snapshot.docs[snapshot.docs.length - 1])

      const lettersData = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const letter = { id: doc.id, ...doc.data() } as Letter

          // Get comment count if not already in the data
          if (letter.commentCount === undefined) {
            const commentsQuery = query(collection(db, "comments"), where("letterId", "==", doc.id))
            const commentsSnapshot = await getDocs(commentsQuery)
            letter.commentCount = commentsSnapshot.size
          }

          return letter
        }),
      )

      // Extract unique categories
      const newCategories = Array.from(
        new Set(lettersData.map((letter) => letter.category).filter(Boolean)),
      ) as string[]

      setCategories((prev) => Array.from(new Set([...prev, ...newCategories])))
      setLetters((prev) => [...prev, ...lettersData])

      // Apply current filters
      if (searchQuery.trim() === "" && filterCategory === "all") {
        setFilteredLetters((prev) => [...prev, ...lettersData])
      } else {
        let filtered = [...lettersData]

        // Apply search filter
        if (searchQuery.trim() !== "") {
          const query = searchQuery.toLowerCase()
          filtered = filtered.filter(
            (letter) =>
              letter.title?.toLowerCase().includes(query) ||
              letter.content?.toLowerCase().includes(query) ||
              letter.authorName?.toLowerCase().includes(query),
          )
        }

        // Apply category filter
        if (filterCategory !== "all") {
          filtered = filtered.filter((letter) => letter.category === filterCategory)
        }

        setFilteredLetters((prev) => [...prev, ...filtered])
      }

      setLoading(false)
    } catch (error) {
      console.error("Error loading more letters:", error)
      setLoading(false)
    }
  }

  // Feature letter
  const featureLetter = async (letter: Letter) => {
    try {
      const letterRef = doc(db, "letters", letter.id)

      await updateDoc(letterRef, {
        featured: true,
        featuredAt: serverTimestamp(),
      })

      // Update local state
      const updatedLetters = letters.map((l) =>
        l.id === letter.id ? { ...l, featured: true, featuredAt: new Date() } : l,
      )

      setLetters(updatedLetters)
      setFilteredLetters(
        filteredLetters.map((l) => (l.id === letter.id ? { ...l, featured: true, featuredAt: new Date() } : l)),
      )

      toast({
        title: "Letter featured",
        description: "The letter has been featured on the homepage.",
        variant: "default",
      })
    } catch (error) {
      console.error("Error featuring letter:", error)
      toast({
        title: "Error",
        description: "Failed to feature letter. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Unfeature letter
  const unfeatureLetter = async (letter: Letter) => {
    try {
      const letterRef = doc(db, "letters", letter.id)

      await updateDoc(letterRef, {
        featured: false,
        featuredAt: null,
      })

      // Update local state
      const updatedLetters = letters.map((l) => (l.id === letter.id ? { ...l, featured: false, featuredAt: null } : l))

      setLetters(updatedLetters)
      setFilteredLetters(
        filteredLetters.map((l) => (l.id === letter.id ? { ...l, featured: false, featuredAt: null } : l)),
      )

      toast({
        title: "Letter unfeatured",
        description: "The letter has been removed from featured.",
        variant: "default",
      })
    } catch (error) {
      console.error("Error unfeaturing letter:", error)
      toast({
        title: "Error",
        description: "Failed to unfeature letter. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Hide letter
  const hideLetter = async (letter: Letter) => {
    try {
      const letterRef = doc(db, "letters", letter.id)

      await updateDoc(letterRef, {
        isHidden: true,
      })

      // Update local state
      const updatedLetters = letters.map((l) => (l.id === letter.id ? { ...l, isHidden: true } : l))

      setLetters(updatedLetters)
      setFilteredLetters(filteredLetters.map((l) => (l.id === letter.id ? { ...l, isHidden: true } : l)))

      toast({
        title: "Letter hidden",
        description: "The letter has been hidden from public view.",
        variant: "default",
      })
    } catch (error) {
      console.error("Error hiding letter:", error)
      toast({
        title: "Error",
        description: "Failed to hide letter. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Show letter
  const showLetter = async (letter: Letter) => {
    try {
      const letterRef = doc(db, "letters", letter.id)

      await updateDoc(letterRef, {
        isHidden: false,
      })

      // Update local state
      const updatedLetters = letters.map((l) => (l.id === letter.id ? { ...l, isHidden: false } : l))

      setLetters(updatedLetters)
      setFilteredLetters(filteredLetters.map((l) => (l.id === letter.id ? { ...l, isHidden: false } : l)))

      toast({
        title: "Letter visible",
        description: "The letter is now visible to the public.",
        variant: "default",
      })
    } catch (error) {
      console.error("Error showing letter:", error)
      toast({
        title: "Error",
        description: "Failed to show letter. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Delete letter
  const deleteLetter = async () => {
    if (!selectedLetter) return

    try {
      // Delete the letter
      await deleteDoc(doc(db, "letters", selectedLetter.id))

      // Also delete associated comments
      const commentsQuery = query(collection(db, "comments"), where("letterId", "==", selectedLetter.id))

      const commentsSnapshot = await getDocs(commentsQuery)

      const deletePromises = commentsSnapshot.docs.map((doc) => deleteDoc(doc.ref))

      await Promise.all(deletePromises)

      // Add activity log
      await addDoc(collection(db, "activity"), {
        type: "letter_deleted",
        letterId: selectedLetter.id,
        letterTitle: selectedLetter.title,
        adminId: "admin", // Should be the current admin's ID
        timestamp: serverTimestamp(),
        reason: "Content moderation",
      })

      // Update local state
      setLetters(letters.filter((l) => l.id !== selectedLetter.id))
      setFilteredLetters(filteredLetters.filter((l) => l.id !== selectedLetter.id))

      toast({
        title: "Letter deleted",
        description: "The letter and its comments have been permanently deleted.",
        variant: "default",
      })

      // Close dialogs
      setShowDeleteDialog(false)
      setShowLetterDetails(false)
    } catch (error) {
      console.error("Error deleting letter:", error)
      toast({
        title: "Error",
        description: "Failed to delete letter. Please try again.",
        variant: "destructive",
      })
    }
  }

  // View letter details
  const viewLetterDetails = (letter: Letter) => {
    setSelectedLetter(letter)
    setShowLetterDetails(true)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Letter Management</CardTitle>
          <CardDescription>Manage and moderate letters across the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search letters by title, content, or author"
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full md:w-auto">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Letter</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
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
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-32 mb-1" />
                            <Skeleton className="h-3 w-48" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-16" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-16" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="h-8 w-8 ml-auto" />
                        </TableCell>
                      </TableRow>
                    ))
                ) : filteredLetters.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      No letters found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLetters.map((letter) => (
                    <TableRow key={letter.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{letter.title || "Untitled Letter"}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">{letter.content}</div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center text-xs">
                              <MessageSquare className="h-3 w-3 mr-1 text-blue-500" />
                              {letter.commentCount || 0}
                            </div>
                            <div className="flex items-center text-xs">
                              <Heart className="h-3 w-3 mr-1 text-red-500" />
                              {letter.likes?.length || 0}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-violet-100 flex items-center justify-center">
                            <span className="text-violet-600 font-medium text-xs">
                              {letter.authorName?.charAt(0) || "U"}
                            </span>
                          </div>
                          <span className="text-sm">{letter.authorName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {letter.category ? (
                          <Badge variant="outline" className="capitalize">
                            {letter.category}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {letter.createdAt ? (
                          <span className="text-xs">
                            {formatDistanceToNow(
                              typeof letter.createdAt.toDate === "function"
                                ? letter.createdAt.toDate()
                                : new Date(letter.createdAt),
                              { addSuffix: true },
                            )}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Unknown</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {letter.featured && <Badge className="bg-yellow-500">Featured</Badge>}
                          {letter.isHidden && (
                            <Badge variant="outline" className="bg-gray-100 text-gray-700">
                              Hidden
                            </Badge>
                          )}
                          {!letter.isHidden && !letter.featured && (
                            <Badge variant="outline" className="bg-green-100 text-green-700">
                              Published
                            </Badge>
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
                            <DropdownMenuItem onClick={() => viewLetterDetails(letter)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {letter.featured ? (
                              <DropdownMenuItem onClick={() => unfeatureLetter(letter)}>
                                <Star className="mr-2 h-4 w-4" />
                                Unfeature Letter
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => featureLetter(letter)}>
                                <Star className="mr-2 h-4 w-4" />
                                Feature Letter
                              </DropdownMenuItem>
                            )}
                            {letter.isHidden ? (
                              <DropdownMenuItem onClick={() => showLetter(letter)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Show Letter
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => hideLetter(letter)}>
                                <XCircle className="mr-2 h-4 w-4" />
                                Hide Letter
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedLetter(letter)
                                setShowDeleteDialog(true)
                              }}
                              className="text-red-600"
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Delete Letter
                            </DropdownMenuItem>
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
            <Button variant="outline" onClick={loadMoreLetters} disabled={loading} className="w-full md:w-auto">
              {loading ? "Loading..." : "Load More Letters"}
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Letter Details Dialog */}
      <Dialog open={showLetterDetails} onOpenChange={setShowLetterDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Letter Details</DialogTitle>
            <DialogDescription>Detailed information about the selected letter</DialogDescription>
          </DialogHeader>

          {selectedLetter && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Letter Information</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm text-muted-foreground">Title:</div>
                  <div className="text-sm font-medium">{selectedLetter.title || "Untitled Letter"}</div>

                  <div className="text-sm text-muted-foreground">Author:</div>
                  <div className="text-sm">{selectedLetter.authorName}</div>

                  <div className="text-sm text-muted-foreground">Category:</div>
                  <div className="text-sm capitalize">{selectedLetter.category || "None"}</div>

                  <div className="text-sm text-muted-foreground">Date Posted:</div>
                  <div className="text-sm">
                    {selectedLetter.createdAt
                      ? formatDistanceToNow(
                          typeof selectedLetter.createdAt.toDate === "function"
                            ? selectedLetter.createdAt.toDate()
                            : new Date(selectedLetter.createdAt),
                          { addSuffix: true },
                        )
                      : "Unknown"}
                  </div>

                  <div className="text-sm text-muted-foreground">Status:</div>
                  <div className="text-sm">
                    {selectedLetter.isHidden ? "Hidden" : "Visible"}
                    {selectedLetter.featured && ", Featured"}
                  </div>

                  <div className="text-sm text-muted-foreground">Comments:</div>
                  <div className="text-sm">{selectedLetter.commentCount || 0}</div>

                  <div className="text-sm text-muted-foreground">Likes:</div>
                  <div className="text-sm">{selectedLetter.likes?.length || 0}</div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Letter Content</h3>
                <Card>
                  <CardContent className="pt-4">
                    <p className="whitespace-pre-line">{selectedLetter.content}</p>
                  </CardContent>
                </Card>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setShowLetterDetails(false)}>
                  Close
                </Button>
                {selectedLetter.featured ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      unfeatureLetter(selectedLetter)
                      setShowLetterDetails(false)
                    }}
                  >
                    <Star className="mr-2 h-4 w-4" />
                    Unfeature
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => {
                      featureLetter(selectedLetter)
                      setShowLetterDetails(false)
                    }}
                  >
                    <Star className="mr-2 h-4 w-4" />
                    Feature
                  </Button>
                )}
                {selectedLetter.isHidden ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      showLetter(selectedLetter)
                      setShowLetterDetails(false)
                    }}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Show
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => {
                      hideLetter(selectedLetter)
                      setShowLetterDetails(false)
                    }}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Hide
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={() => {
                    setShowLetterDetails(false)
                    setShowDeleteDialog(true)
                  }}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Letter Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Letter</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the letter and all its comments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteLetter} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
