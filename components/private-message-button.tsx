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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Mail } from "lucide-react"
import { db, auth } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

interface PrivateMessageButtonProps {
  recipientId: string
  recipientName: string
  className?: string
}

export function PrivateMessageButton({ recipientId, recipientName, className = "" }: PrivateMessageButtonProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSendMessage = async () => {
    if (!auth.currentUser) return
    if (!title.trim() || !content.trim()) return

    setIsSubmitting(true)

    try {
      // Add the private letter to Firestore
      await addDoc(collection(db, "privateLetters"), {
        title,
        content,
        senderId: auth.currentUser.uid,
        senderName: auth.currentUser.displayName || "Anonymous",
        recipientId,
        recipientName,
        createdAt: serverTimestamp(),
        isRead: false,
      })

      // Reset form and close dialog
      setTitle("")
      setContent("")
      setOpen(false)

      toast({
        title: "Message Sent",
        description: `Your private letter has been sent to ${recipientName}`,
        variant: "default",
        className: "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0",
      })
    } catch (error) {
      console.error("Error sending private message:", error)
      toast({
        title: "Error",
        description: "Failed to send private message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Mail className="mr-2 h-4 w-4" />
          Send Private Letter
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send Private Letter</DialogTitle>
          <DialogDescription>This letter will only be visible to {recipientName}.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title for your letter"
              className="px-4 py-3 rounded-xl border-2 border-violet-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="content">Message</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your private letter here..."
              className="min-h-[150px] px-4 py-3 rounded-xl border-2 border-violet-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSendMessage}
            disabled={isSubmitting || !title.trim() || !content.trim()}
            className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl"
          >
            {isSubmitting ? "Sending..." : "Send Letter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
