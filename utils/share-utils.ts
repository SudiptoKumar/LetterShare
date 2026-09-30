import html2canvas from "html2canvas"

// Function to convert an element to an image
export async function elementToImage(element: HTMLElement): Promise<string> {
  try {
    const canvas = await html2canvas(element, {
      scale: 2, // Higher scale for better quality
      useCORS: true, // Enable CORS for images
      backgroundColor: "#ffffff", // White background
      logging: false, // Disable logging
    })

    return canvas.toDataURL("image/png")
  } catch (error) {
    console.error("Error converting element to image:", error)
    throw error
  }
}

// Function to download an image
export function downloadImage(dataUrl: string, filename = "letter"): void {
  const link = document.createElement("a")
  link.href = dataUrl
  link.download = `${filename}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Function to share image on social media
export async function shareImage(dataUrl: string, platform: string, title = "Letter Share"): Promise<void> {
  // For platforms that support Web Share API
  if (navigator.share && (platform === "native" || platform === "whatsapp")) {
    try {
      // Convert data URL to Blob
      const blob = await (await fetch(dataUrl)).blob()
      const file = new File([blob], "letter.png", { type: "image/png" })

      await navigator.share({
        title: title,
        text: "Check out this letter from Letter Share!",
        files: [file],
      })
      return
    } catch (error) {
      console.error("Error sharing:", error)
      // Fall back to other methods if Web Share API fails
    }
  }

  // Platform-specific sharing
  switch (platform) {
    case "facebook":
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(dataUrl)}`, "_blank")
      break
    case "twitter":
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(dataUrl)}`,
        "_blank",
      )
      break
    case "whatsapp":
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(title + " " + dataUrl)}`, "_blank")
      break
    default:
      // Default to download if platform not supported
      downloadImage(dataUrl, title.replace(/\s+/g, "-").toLowerCase())
  }
}

// This utility uses html2canvas for image generation, which is client-side and doesn't use Firebase Storage
// No changes needed here
