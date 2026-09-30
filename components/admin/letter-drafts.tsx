"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash, FileText } from "lucide-react"
import { collection, query, where, orderBy, getDocs, doc, deleteDoc } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
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

interface LetterDraft {
  id: string
  title: string
  content: string
  salutation: string
  closing: string
  createdAt: any
  updatedAt: any
  isDraft: boolean
}

interface LetterDraftsProps {
  onEditDraft: (draft: LetterDraft) => void
}

export function LetterDrafts({ onEditDraft }: LetterDraftsProps) {
  const [drafts, setDrafts] = useState<LetterDraft[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDraft, setSelectedDraft] = useState<LetterDraft | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchDrafts()
  }, [])

  const fetchDrafts = async () => {
    setLoading(true)
    try {
      const userId = auth.currentUser?.uid
      if (!userId) return

      const draftsQuery = query(
        collection(db, "letters"),
        where("authorId", "==", userId),
        where("isDraft", "==", true),
        orderBy("createdAt", "desc"),
      )

      const querySnapshot = await getDocs(draftsQuery)
      const fetchedDrafts: LetterDraft[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        fetchedDrafts.push({
          id: doc.id,
          title: data.title || "Untitled",
          content: data.content || "",
          salutation: data.salutation || "",
          closing: data.closing || "",
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          isDraft: true,
        })
      })

      setDrafts(fetchedDrafts)
    } catch (error) {
      console.error("Error fetching drafts:", error)
      toast({
        title: "Error",
        description: "Failed to load letter drafts.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDraft = async () => {
    if (!selectedDraft) return

    try {
      await deleteDoc(doc(db, "letters", selectedDraft.id))

      setDrafts(drafts.filter((draft) => draft.id !== selectedDraft.id))

      toast({
        title: "Draft Deleted",
        description: "The letter draft has been deleted successfully.",
        variant: "default",
      })
    } catch (error) {
      console.error("Error deleting draft:", error)
      toast({
        title: "Error",
        description: "Failed to delete the draft. Please try again.",
        variant: "destructive",
      })
    } finally {
      setShowDeleteDialog(false)
      setSelectedDraft(null)
    }
  }

  const confirmDelete = (draft: LetterDraft) => {
    setSelectedDraft(draft)
    setShowDeleteDialog(true)
  }

  const handleEdit = (draft: LetterDraft) => {
    onEditDraft(draft)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Saved Letter Drafts
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : drafts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No saved drafts found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drafts.map((draft) => (
                  <TableRow key={draft.id}>
                    <TableCell className="font-medium">{draft.title}</TableCell>
                    <TableCell>
                      {draft.createdAt ? format(new Date(draft.createdAt.toDate()), "MMM d, yyyy") : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        Draft
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-violet-600 hover:text-violet-700 hover:bg-violet-50"
                          onClick={() => handleEdit(draft)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => confirmDelete(draft)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the letter draft.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteDraft} className="bg-red-500 hover:bg-red-600">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
