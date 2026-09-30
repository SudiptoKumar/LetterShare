"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { auth, db, storage } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { PenLine, ImageIcon, X } from "lucide-react"

export function ComposeLetterDialog() {
  const [open, setOpen] = useState(false)
  const [headline, setHeadline] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState("personal")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setHeadline("")
      setContent("")
      setCategory("personal")
      setSelectedImage(null)
      setImagePreview(null)
    }
  }, [open])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedImage(file)

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!headline.trim() || !content.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both a headline and content for your letter.",
        variant: "destructive",
      })
      return
    }

    if (!auth || !db || !storage) {
      toast({
        title: "Firebase configuration required",
        description: "Configure Firebase environment variables before publishing a letter.",
        variant: "destructive",
      })
      return
    }

    const user = auth.currentUser
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to post a letter.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      let imageUrl = null

      // Upload image if selected
      if (selectedImage) {
        const imageRef = ref(storage, `letter-images/${user.uid}/${Date.now()}-${selectedImage.name}`)
        await uploadBytes(imageRef, selectedImage)
        imageUrl = await getDownloadURL(imageRef)
      }

      // Add letter to Firestore
      await addDoc(collection(db, "letters"), {
        authorId: user.uid,
        authorName: user.displayName || user.email?.split("@")[0] || "Anonymous",
        authorPhotoURL: user.photoURL,
        headline,
        content,
        category,
        imageUrl,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        likes: 0,
        comments: 0,
      })

      toast({
        title: "Letter published!",
        description: "Your letter has been successfully published.",
        className: "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0",
      })

      setOpen(false)
    } catch (error) {
      console.error("Error publishing letter:", error)
      toast({
        title: "Publication failed",
        description: "There was an error publishing your letter. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild id="compose-letter-trigger" data-compose-dialog="true">
        <span className="hidden">Compose Letter</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenLine className="h-5 w-5 text-violet-600" />
            Compose a Letter
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="headline">Headline</Label>
            <Input
              id="headline"
              placeholder="Enter a captivating headline..."
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              maxLength={100}
            />
            <div className="text-xs text-right text-gray-500">{headline.length}/100</div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="creative">Creative</SelectItem>
                <SelectItem value="opinion">Opinion</SelectItem>
                <SelectItem value="travel">Travel</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="Write your letter here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[200px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image" className="flex items-center gap-2 cursor-pointer">
              <ImageIcon className="h-4 w-4 text-violet-600" />
              Add an image
            </Label>
            <Input
              id="image"
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />

            {imagePreview && (
              <div className="relative mt-2 rounded-md overflow-hidden">
                <img
                  src={imagePreview || "/placeholder.svg"}
                  alt="Preview"
                  className="max-h-[200px] w-auto object-contain bg-gray-100 rounded-md"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6 rounded-full"
                  onClick={removeImage}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-violet-500 to-purple-600 text-white border-0 hover:from-violet-600 hover:to-purple-700"
            >
              {isSubmitting ? "Publishing..." : "Publish Letter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
