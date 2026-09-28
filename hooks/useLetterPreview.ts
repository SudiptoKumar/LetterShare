"use client"

import { useState, useCallback } from "react"
import type { LetterContent } from "@/types/letter"

export function useLetterPreview(initialContent?: Partial<LetterContent>) {
  const [previewContent, setPreviewContent] = useState<Partial<LetterContent>>(
    initialContent || {
      title: "",
      salutation: "",
      body: "",
      closing: "",
      category: "",
      createdAt: new Date(),
    },
  )

  const [isPreviewMode, setIsPreviewMode] = useState(false)

  const updatePreviewContent = useCallback((field: keyof LetterContent, value: string | Date) => {
    setPreviewContent((prev) => ({
      ...prev,
      [field]: value,
    }))
  }, [])

  const updateMultipleFields = useCallback((updates: Partial<LetterContent>) => {
    setPreviewContent((prev) => ({
      ...prev,
      ...updates,
    }))
  }, [])

  const togglePreviewMode = useCallback(() => {
    setIsPreviewMode((prev) => !prev)
  }, [])

  const setPreviewMode = useCallback((mode: boolean) => {
    setIsPreviewMode(mode)
  }, [])

  return {
    previewContent,
    isPreviewMode,
    updatePreviewContent,
    updateMultipleFields,
    togglePreviewMode,
    setPreviewMode,
  }
}
