"use client"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { LetterContent } from "@/types/letter"
import { formatDate } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

interface LetterPreviewProps {
  letter: Partial<LetterContent>
  author?: {
    displayName?: string
    photoURL?: string
  }
  className?: string
}

export function LetterPreview({ letter, author, className = "" }: LetterPreviewProps) {
  const { title, salutation, body, closing, createdAt } = letter
  const date = createdAt ? formatDate(createdAt) : formatDate(new Date())

  return (
    <Card className={`w-full overflow-hidden border-2 border-dashed border-primary/30 ${className}`}>
      <div className="bg-primary/10 px-4 py-2 text-sm font-medium flex items-center justify-between">
        <span>Preview</span>
        <span className="text-muted-foreground text-xs">
          {author?.displayName || "Your Name"} • {date}
        </span>
      </div>
      <ScrollArea className="h-[400px] w-full">
        <CardContent className="p-6">
          {title && <h2 className="text-2xl font-bold mb-4">{title}</h2>}

          {salutation && <p className="mb-4">{salutation},</p>}

          {body && (
            <div className="whitespace-pre-wrap mb-6">
              {body.split("\n").map((paragraph, index) => (
                <p key={index} className="mb-4">
                  {paragraph}
                </p>
              ))}
            </div>
          )}

          {closing && (
            <div className="mt-6">
              <p>{closing},</p>
              <p className="mt-2">{author?.displayName || "Your Name"}</p>
            </div>
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  )
}

function LetterPreviewSkeleton() {
  return (
    <Card className="w-full overflow-hidden border-2 border-dashed border-primary/30">
      <div className="bg-primary/10 px-4 py-2 text-sm font-medium">
        <span>Preview</span>
      </div>
      <CardContent className="p-6">
        <Skeleton className="h-8 w-3/4 mb-4" />
        <Skeleton className="h-5 w-1/3 mb-4" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/5" />
        </div>
        <div className="mt-6">
          <Skeleton className="h-5 w-1/4 mb-2" />
          <Skeleton className="h-5 w-1/3" />
        </div>
      </CardContent>
    </Card>
  )
}
