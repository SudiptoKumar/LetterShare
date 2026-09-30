"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { PenLine, Send, Eye, Download, Copy } from "lucide-react"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

interface LetterGeneratorProps {
  adminProfile: {
    displayName: string
    email: string
    title?: string
    department?: string
  }
}

export function LetterGenerator({ adminProfile }: LetterGeneratorProps) {
  const [letterTitle, setLetterTitle] = useState("")
  const [recipient, setRecipient] = useState("")
  const [salutation, setSalutation] = useState("Dear")
  const [content, setContent] = useState("")
  const [closing, setClosing] = useState("Sincerely")
  const [includeDate, setIncludeDate] = useState(true)
  const [includeTitle, setIncludeTitle] = useState(true)
  const [letterDate, setLetterDate] = useState(format(new Date(), "MMMM d, yyyy"))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const { toast } = useToast()

  // Add custom signature name
  const [customSignatureName, setCustomSignatureName] = useState(adminProfile?.displayName || "Letter Share")

  // Get admin's title and department for signature
  const adminTitle = adminProfile?.title || "Administrator"
  const adminDepartment = adminProfile?.department || "Letter Share"

  // Format salutation with recipient
  const formattedSalutation = recipient ? `${salutation} ${recipient},` : `${salutation} Reader,`

  // Format closing with admin name and title
  const formattedClosing = `${closing},`

  const handlePublishLetter = async () => {
    if (!letterTitle.trim() || !content.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both a title and content for your letter.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Add the letter document
      const letterRef = await addDoc(collection(db, "letters"), {
        title: letterTitle,
        salutation: formattedSalutation,
        content,
        closing: formattedClosing,
        authorId: auth.currentUser?.uid,
        authorName: customSignatureName, // Use custom signature name
        authorEmail: "admin@lettershare.com", // Explicitly store admin email
        authorTitle: includeTitle ? adminTitle : "",
        authorDepartment: includeTitle ? adminDepartment : "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        likes: [],
        commentCount: 0,
        isAdminLetter: true, // Mark as admin letter
        letterDate: includeDate ? letterDate : "",
      })

      toast({
        title: "Letter Published",
        description: "Your letter has been published successfully.",
        variant: "default",
        className: "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0",
      })

      // Reset form
      resetForm()
    } catch (error) {
      console.error("Error publishing letter:", error)
      toast({
        title: "Error",
        description: "Failed to publish letter. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setLetterTitle("")
    setRecipient("")
    setSalutation("Dear")
    setContent("")
    setClosing("Sincerely")
    setIncludeDate(true)
    setIncludeTitle(true)
    setLetterDate(format(new Date(), "MMMM d, yyyy"))
    setPreviewMode(false)
    setCustomSignatureName(adminProfile?.displayName || "Letter Share")
  }

  const copyToClipboard = () => {
    const letterText = `
${includeDate ? letterDate : ""}

${formattedSalutation}

${content}

${formattedClosing}

${customSignatureName}
${includeTitle ? `${adminTitle}` : ""}
${includeTitle ? `${adminDepartment}` : ""}
    `.trim()

    navigator.clipboard.writeText(letterText)
    toast({
      title: "Copied to Clipboard",
      description: "Letter content has been copied to clipboard.",
      variant: "default",
    })
  }

  const downloadAsText = () => {
    const letterText = `
${letterTitle}

${includeDate ? letterDate : ""}

${formattedSalutation}

${content}

${formattedClosing}

${customSignatureName}
${includeTitle ? `${adminTitle}` : ""}
${includeTitle ? `${adminDepartment}` : ""}
    `.trim()

    const blob = new Blob([letterText], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${letterTitle.replace(/\s+/g, "-").toLowerCase()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PenLine className="h-5 w-5" />
            {previewMode ? "Letter Preview" : "Compose Official Letter"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {previewMode ? (
            <div className="space-y-4">
              <div className="flex justify-end space-x-2">
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={downloadAsText}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>

              <div className="p-6 border rounded-lg bg-white shadow-sm">
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-center text-violet-900">{letterTitle}</h2>

                  {includeDate && <p className="text-right text-gray-600">{letterDate}</p>}

                  <p className="text-gray-800">{formattedSalutation}</p>

                  <div className="whitespace-pre-line text-gray-800 min-h-[200px]">
                    {content || "Your letter content will appear here..."}
                  </div>

                  <div className="space-y-1">
                    <p className="text-right font-medium text-gray-800">{formattedClosing}</p>
                    <p className="font-dancing text-2xl text-right bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                      {customSignatureName}
                    </p>
                    {includeTitle && (
                      <>
                        <p className="text-right text-sm text-gray-700">{adminTitle}</p>
                        <p className="text-right text-sm text-gray-700">{adminDepartment}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="letterTitle">Letter Title</Label>
                  <Input
                    id="letterTitle"
                    value={letterTitle}
                    onChange={(e) => setLetterTitle(e.target.value)}
                    placeholder="Enter letter title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recipient">Recipient (Optional)</Label>
                  <Input
                    id="recipient"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="Recipient name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salutation">Salutation</Label>
                  <Input
                    id="salutation"
                    value={salutation}
                    onChange={(e) => setSalutation(e.target.value)}
                    placeholder="Enter salutation (e.g., Dear, Hello, Greetings)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="closing">Closing</Label>
                  <Input
                    id="closing"
                    value={closing}
                    onChange={(e) => setClosing(e.target.value)}
                    placeholder="Enter closing (e.g., Sincerely, Best regards)"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Letter Content</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your letter content here..."
                  className="min-h-[200px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch id="includeDate" checked={includeDate} onCheckedChange={setIncludeDate} />
                  <Label htmlFor="includeDate">Include Date</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="includeTitle" checked={includeTitle} onCheckedChange={setIncludeTitle} />
                  <Label htmlFor="includeTitle">Include Title & Department</Label>
                </div>
              </div>

              {includeDate && (
                <div className="space-y-2">
                  <Label htmlFor="letterDate">Letter Date</Label>
                  <Input
                    id="letterDate"
                    value={letterDate}
                    onChange={(e) => setLetterDate(e.target.value)}
                    placeholder="Enter date"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="customSignatureName">Signature Name</Label>
                <Input
                  id="customSignatureName"
                  value={customSignatureName}
                  onChange={(e) => setCustomSignatureName(e.target.value)}
                  placeholder="Enter signature name"
                />
              </div>

              <div className="p-4 border rounded-md bg-violet-50">
                <h3 className="text-sm font-medium text-violet-700 mb-2">Signature Preview</h3>
                <div className="space-y-1">
                  <p className="text-right font-medium text-violet-800">{formattedClosing}</p>
                  <p className="font-dancing text-2xl text-right bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                    {customSignatureName}
                  </p>
                  {includeTitle && (
                    <>
                      <p className="text-right text-sm text-violet-700">{adminTitle}</p>
                      <p className="text-right text-sm text-violet-700">{adminDepartment}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          {previewMode ? (
            <>
              <Button variant="outline" onClick={() => setPreviewMode(false)}>
                Edit Letter
              </Button>
              <Button onClick={handlePublishLetter} disabled={isSubmitting}>
                <Send className="mr-2 h-4 w-4" />
                Publish Letter
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={resetForm}>
                Reset
              </Button>
              <div className="space-x-2">
                <Button variant="outline" onClick={() => setPreviewMode(true)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </Button>
                <Button onClick={handlePublishLetter} disabled={isSubmitting}>
                  <Send className="mr-2 h-4 w-4" />
                  Publish Letter
                </Button>
              </div>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
