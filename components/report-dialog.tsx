"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { db, auth } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

interface ReportDialogProps {
  contentId: string
  contentType: "letter" | "comment" | "message"
  authorId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReportDialog({ contentId, contentType, authorId, open, onOpenChange }: ReportDialogProps) {
  const [reason, setReason] = useState<string>("")
  const [details, setDetails] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!reason) return
    if (!auth.currentUser) return

    setIsSubmitting(true)

    try {
      // Add report to Firestore
      await addDoc(collection(db, "reports"), {
        contentId,
        contentType,
        authorId,
        reporterId: auth.currentUser.uid,
        reporterName: auth.currentUser.displayName || "Anonymous",
        reason,
        details,
        createdAt: serverTimestamp(),
        status: "pending", // pending, reviewed, resolved, dismissed
      })

      // Reset form and close dialog
      setReason("")
      setDetails("")
      onOpenChange(false)

      toast({
        title: "Report Submitted",
        description: "Thank you for helping keep our community safe. We'll review your report.",
        variant: "default",
        className: "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0",
      })
    } catch (error) {
      console.error("Error submitting report:", error)
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Report Content</DialogTitle>
          <DialogDescription>Please let us know why you're reporting this content.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="reason">Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inappropriate">Inappropriate Content</SelectItem>
                <SelectItem value="harassment">Harassment or Bullying</SelectItem>
                <SelectItem value="spam">Spam or Misleading</SelectItem>
                <SelectItem value="hate">Hate Speech</SelectItem>
                <SelectItem value="violence">Violence or Threats</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="details">Additional Details (Optional)</Label>
            <Textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Please provide any additional information that might help us understand the issue."
              className="min-h-[100px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !reason}
            className="bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl"
          >
            {isSubmitting ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
