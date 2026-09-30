/**
 * Extracts the index creation URL from a Firestore error message
 */
export function extractIndexUrl(errorMessage: string): string | null {
  const urlMatch = errorMessage.match(/https:\/\/console\.firebase\.google\.com[^\s]+/)
  return urlMatch ? urlMatch[0] : null
}

/**
 * Checks if a Firestore error is related to a missing index
 */
export function isIndexError(error: any): boolean {
  return error?.code === "failed-precondition" && error?.message?.includes("The query requires an index")
}
