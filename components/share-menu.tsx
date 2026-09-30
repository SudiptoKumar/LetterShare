"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Share2, Download, Facebook, Twitter, Image, Loader2, MessageSquare } from "lucide-react"
import { elementToImage, downloadImage, shareImage } from "@/utils/share-utils"
import { useToast } from "@/hooks/use-toast"

interface ShareMenuProps {
  targetRef: React.RefObject<HTMLElement>
  title: string
  className?: string
}

export function ShareMenu({ targetRef, title, className = "" }: ShareMenuProps) {
  const [isSharing, setIsSharing] = useState(false)
  const { toast } = useToast()

  const handleShare = async (platform: string) => {
    if (!targetRef.current) {
      toast({
        title: "Error",
        description: "Could not find content to share",
        variant: "destructive",
      })
      return
    }

    setIsSharing(true)

    try {
      // Convert the element to an image
      const imageDataUrl = await elementToImage(targetRef.current)

      // Share based on platform
      if (platform === "download") {
        downloadImage(imageDataUrl, title.replace(/\s+/g, "-").toLowerCase())
        toast({
          title: "Success",
          description: "Image downloaded successfully!",
          variant: "default",
        })
      } else {
        await shareImage(imageDataUrl, platform, title)
        toast({
          title: "Success",
          description: "Content shared successfully!",
          variant: "default",
        })
      }
    } catch (error) {
      console.error("Error sharing:", error)
      toast({
        title: "Error",
        description: "Failed to share content. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="share-button"
          disabled={isSharing}
          data-firebase-ignore="true" // Add this attribute to ignore Firebase monitoring
        >
          {isSharing ? <Loader2 className="mr-1 h-5 w-5 animate-spin" /> : <Share2 className="mr-1 h-5 w-5" />}
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          onClick={() => handleShare("download")}
          className="cursor-pointer"
          data-firebase-ignore="true"
        >
          <Download className="mr-2 h-4 w-4" />
          <span>Download as Image</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleShare("facebook")}
          className="cursor-pointer"
          data-firebase-ignore="true"
        >
          <Facebook className="mr-2 h-4 w-4" />
          <span>Share to Facebook</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare("twitter")} className="cursor-pointer" data-firebase-ignore="true">
          <Twitter className="mr-2 h-4 w-4" />
          <span>Share to Twitter</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleShare("whatsapp")}
          className="cursor-pointer"
          data-firebase-ignore="true"
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          <span>Share to WhatsApp</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare("native")} className="cursor-pointer" data-firebase-ignore="true">
          <Image className="mr-2 h-4 w-4" />
          <span>Share as Image</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
