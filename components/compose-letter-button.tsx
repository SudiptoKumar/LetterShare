"use client"

import { SelectItem } from "@/components/ui/select"
import { SelectContent } from "@/components/ui/select"
import { SelectValue } from "@/components/ui/select"
import { SelectTrigger } from "@/components/ui/select"
import { Select } from "@/components/ui/select"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PenLine } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { addDoc, collection, serverTimestamp, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import { safeFirestoreOperation } from "@/utils/firestore-error-handler"

interface ComposeLetterButtonProps {
  userId: string | null | undefined
  userName: string | null | undefined
}

export function ComposeLetterButton({ userId, userName }: ComposeLetterButtonProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [salutation, setSalutation] = useState("")
  const [content, setContent] = useState("")
  const [closing, setClosing] = useState("Sincerely")
  const [displayName, setDisplayName] = useState("")
  const [headline, setHeadline] = useState("") // State for headline
  const [isAdmin, setIsAdmin] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()
  const { toast } = useToast()
  const [category, setCategory] = useState("")

  // Get name for signature and check if admin
  useEffect(() => {
    const storedEmail = localStorage.getItem("userEmail")
    const isAdminUser = userId === "admin" || storedEmail === "admin@lettershare.com"
    setIsAdmin(isAdminUser)

    if (userName) {
      setDisplayName(userName)
    } else {
      const storedName = localStorage.getItem("userName")
      if (storedName) {
        setDisplayName(storedName)
      } else {
        setDisplayName("User")
      }
    }

    // Get headline from localStorage or Firestore
    const fetchHeadline = async () => {
      // First check localStorage
      const storedHeadline = localStorage.getItem("userHeadline")
      if (storedHeadline) {
        setHeadline(storedHeadline)
        return
      }

      // If not in localStorage, try to fetch from Firestore
      if (userId) {
        await safeFirestoreOperation(
          async () => {
            const userDoc = await getDoc(doc(db, "users", userId))
            if (userDoc.exists()) {
              const userData = userDoc.data()
              if (userData.headline) {
                setHeadline(userData.headline)
                // Store in localStorage for future use
                localStorage.setItem("userHeadline", userData.headline)
              }
            }
          },
          undefined,
          (error) => {
            console.warn("Could not fetch user headline:", error.message)
          },
        )
      }
    }

    fetchHeadline()
  }, [userName, userId])

  // Handle salutation with auto comma
  const handleSalutationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value
    // Remove any existing comma at the end
    if (value.endsWith(",")) {
      value = value.slice(0, -1)
    }
    setSalutation(value)
  }

  // Handle closing with auto comma
  const handleClosingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value
    // Remove any existing comma at the end
    if (value.endsWith(",")) {
      value = value.slice(0, -1)
    }
    setClosing(value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !content.trim()) return

    setIsSubmitting(true)

    try {
      // Make sure we have a valid name to use
      const authorName = userName || localStorage.getItem("userName") || "User"
      const authorEmail = localStorage.getItem("userEmail")

      // Format salutation and closing with commas
      const formattedSalutation = salutation.trim() ? `${salutation.trim()},` : ""
      const formattedClosing = closing.trim() ? `${closing.trim()},` : ""

      // Prepare letter data with admin information if applicable
      const letterData: any = {
        title,
        salutation: formattedSalutation,
        content,
        closing: formattedClosing,
        authorId: userId,
        authorName: authorName,
        authorEmail: authorEmail,
        authorHeadline: headline, // Keep this for the header display only
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        likes: [],
        commentCount: 0,
        category: category || null, // Add category
      }

      // Add admin-specific fields if this is an admin
      if (isAdmin) {
        letterData.isAdminLetter = true
        letterData.authorTitle = "Administrator"
        letterData.authorDepartment = "Letter Share"
      }

      // Add the letter document
      const letterRef = await addDoc(collection(db, "letters"), letterData)

      console.log("Letter added with ID: ", letterRef.id)

      setOpen(false)

      // Reset form
      setTitle("")
      setSalutation("")
      setContent("")
      setClosing("Sincerely")
      setCategory("")

      // Show success message
      toast({
        title: "Success",
        description: "Letter published successfully!",
        variant: "default",
        className: "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0",
      })

      // Navigate directly to feed with the new letter ID
      router.push(`/feed?highlight=${letterRef.id}`)
    } catch (error) {
      console.error("Error adding letter:", error)
      toast({
        title: "Error",
        description: "Failed to publish letter. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          id="compose-letter-trigger"
          data-compose-dialog="true"
          className="compose-letter-button bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white rounded-full px-4 py-2 shadow-md compose-btn"
        >
          <PenLine className="mr-2 h-4 w-4" />
          Lettercraft
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] glass-card border-0 rounded-2xl max-h-[90vh] overflow-y-auto p-3 md:p-6">
        <form onSubmit={handleSubmit} ref={formRef} className="letter-compose-form">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl font-playfair text-center bg-gradient-to-r from-violet-700 to-purple-700 bg-clip-text text-transparent">
              Craft a New Letter
            </DialogTitle>
            <DialogDescription className="text-center text-violet-600 text-xs md:text-sm">
              Share your thoughts with the community. Write a letter that expresses your feelings.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 md:gap-4 py-3 md:py-4">
            {/* Title Section */}
            <div className="grid gap-1 md:gap-2">
              <Label htmlFor="title" className="text-violet-700 font-medium text-xs md:text-sm">
                Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title for your letter"
                required
                className="px-3 py-2 md:px-4 md:py-3 rounded-xl border-2 border-violet-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all text-xs md:text-sm"
              />
            </div>

            {/* Salutation Section */}
            <div className="grid gap-1 md:gap-2">
              <Label htmlFor="salutation" className="text-violet-700 font-medium text-xs md:text-sm">
                Salutation
              </Label>
              <div className="relative">
                <Input
                  id="salutation"
                  value={salutation}
                  onChange={handleSalutationChange}
                  placeholder="Dear Reader"
                  className="px-3 py-2 md:px-4 md:py-3 rounded-xl border-2 border-violet-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all text-xs md:text-sm"
                />
                {salutation && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-violet-400">,</div>
                )}
              </div>
              <p className="text-xs text-violet-500 italic">A comma will be automatically added</p>
            </div>

            {/* Body Section */}
            <div className="grid gap-1 md:gap-2">
              <Label htmlFor="content" className="text-violet-700 font-medium text-xs md:text-sm">
                Body
              </Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your letter here..."
                className="min-h-[120px] md:min-h-[150px] px-3 py-2 md:px-4 md:py-3 rounded-xl border-2 border-violet-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all text-xs md:text-sm"
                required
              />
            </div>

            {/* Closing Section */}
            <div className="grid gap-1 md:gap-2">
              <Label htmlFor="closing" className="text-violet-700 font-medium text-xs md:text-sm">
                Closing
              </Label>
              <div className="relative">
                <Input
                  id="closing"
                  value={closing}
                  onChange={handleClosingChange}
                  placeholder="Sincerely"
                  className="px-3 py-2 md:px-4 md:py-3 rounded-xl border-2 border-violet-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all text-xs md:text-sm"
                />
                {closing && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-violet-400">,</div>
                )}
              </div>
              <p className="text-xs text-violet-500 italic">A comma will be automatically added</p>
            </div>

            {/* Category Section */}
            <div className="grid gap-2">
              <Label htmlFor="category" className="text-violet-700 font-medium">
                Category (Optional)
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger
                  id="category"
                  className="px-4 py-3 rounded-xl border-2 border-violet-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all"
                >
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="announcement">Announcement</SelectItem>
                  <SelectItem value="gratitude">Gratitude</SelectItem>
                  <SelectItem value="reflection">Reflection</SelectItem>
                  <SelectItem value="creative">Creative</SelectItem>
                  <SelectItem value="advice">Advice</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Signature Preview */}
            <div className="grid gap-2">
              <Label className="text-violet-700 font-medium">Signature Preview</Label>
              <div className="signature-preview px-4 py-3 rounded-xl border-2 border-violet-100 bg-violet-50">
                <p className="font-dancing text-2xl text-right bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                  {isAdmin ? displayName : displayName.split(" ")[0]}
                </p>
                {isAdmin && (
                  <>
                    <p className="text-right text-sm text-violet-700">Administrator</p>
                    <p className="text-right text-sm text-violet-700">Letter Share</p>
                  </>
                )}
              </div>
              <p className="text-xs text-violet-500 italic">
                {isAdmin
                  ? "Your full name will be displayed as admin"
                  : "Your first name will be displayed in this style"}
              </p>
            </div>
          </div>
          <DialogFooter className="sticky bottom-0 pt-2 pb-2 bg-white/80 backdrop-blur-sm mt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 rounded-xl"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Publishing..." : "Publish Letter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
