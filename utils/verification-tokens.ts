import { createHash, randomBytes } from "crypto"

// Generate a secure random token
export function generateVerificationToken(userId: string, email: string, expiresIn = 24 * 60 * 60 * 1000): string {
  // Create a random string
  const randomString = randomBytes(32).toString("hex")

  // Create a timestamp that will be used to check expiration
  const timestamp = Date.now() + expiresIn

  // Combine user data with random string and timestamp
  const dataToHash = `${userId}:${email}:${randomString}:${timestamp}`

  // Create a hash of the data
  const hash = createHash("sha256").update(dataToHash).digest("hex")

  // Return the token with timestamp and hash
  return `${timestamp.toString(36)}.${hash}`
}

// Verify a token
export function verifyToken(token: string, userId: string, email: string): boolean {
  try {
    // Split the token into timestamp and hash
    const [timestampStr, hash] = token.split(".")

    // Convert timestamp from base36 back to number
    const timestamp = Number.parseInt(timestampStr, 36)

    // Check if token has expired
    if (Date.now() > timestamp) {
      return false
    }

    // Recreate the original data that was hashed
    const randomString = hash.substring(0, 64) // Extract the random part
    const dataToHash = `${userId}:${email}:${randomString}:${timestamp}`

    // Create a hash of the data
    const computedHash = createHash("sha256").update(dataToHash).digest("hex")

    // Compare the computed hash with the provided hash
    return computedHash === hash
  } catch (error) {
    console.error("Error verifying token:", error)
    return false
  }
}
