// This is a Node.js script to download and generate all the necessary icons
// You would run this script locally to generate the icons

const fs = require("fs")
const path = require("path")
const https = require("https")
const { createCanvas, loadImage } = require("canvas")

const ICON_URL = "https://img.icons8.com/fluency/100/love-letter.png"
const ICONS_DIR = path.join(__dirname, "../public/icons")

// Create the icons directory if it doesn't exist
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true })
}

// Download the original icon
const downloadIcon = () => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(path.join(ICONS_DIR, "original-icon.png"))
    https
      .get(ICON_URL, (response) => {
        response.pipe(file)
        file.on("finish", () => {
          file.close()
          resolve(path.join(ICONS_DIR, "original-icon.png"))
        })
      })
      .on("error", (err) => {
        fs.unlink(path.join(ICONS_DIR, "original-icon.png"))
        reject(err)
      })
  })
}

// Generate icons of different sizes
const generateIcons = async (originalIconPath) => {
  const sizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512]
  const image = await loadImage(originalIconPath)

  // Regular icons
  for (const size of sizes) {
    const canvas = createCanvas(size, size)
    const ctx = canvas.getContext("2d")
    ctx.drawImage(image, 0, 0, size, size)

    const buffer = canvas.toBuffer("image/png")
    fs.writeFileSync(path.join(ICONS_DIR, `icon-${size}x${size}.png`), buffer)

    // Also create favicon and apple icon for specific sizes
    if (size === 16) {
      fs.writeFileSync(path.join(ICONS_DIR, "favicon.png"), buffer)
    }

    if (size === 180) {
      fs.writeFileSync(path.join(ICONS_DIR, "apple-icon.png"), buffer)
    }
  }

  // Create maskable icon (with padding)
  const maskableSize = 512
  const padding = maskableSize * 0.1 // 10% padding
  const innerSize = maskableSize - padding * 2

  const maskableCanvas = createCanvas(maskableSize, maskableSize)
  const maskableCtx = maskableCanvas.getContext("2d")

  // Fill background with a color
  maskableCtx.fillStyle = "#8b5cf6" // Match theme color
  maskableCtx.fillRect(0, 0, maskableSize, maskableSize)

  // Draw the icon with padding
  maskableCtx.drawImage(image, padding, padding, innerSize, innerSize)

  const maskableBuffer = maskableCanvas.toBuffer("image/png")
  fs.writeFileSync(path.join(ICONS_DIR, "maskable-icon.png"), maskableBuffer)

  console.log("All icons generated successfully!")
}

// Main function
const main = async () => {
  try {
    const originalIconPath = await downloadIcon()
    await generateIcons(originalIconPath)
    console.log("Done!")
  } catch (error) {
    console.error("Error generating icons:", error)
  }
}

main()
