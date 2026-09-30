// This file contains Firebase configuration helpers

// Function to check if the current domain is authorized for Firebase Auth
export const isAuthorizedDomain = (): boolean => {
  if (typeof window === "undefined") return false

  // Get the current hostname
  const hostname = window.location.hostname

  // List of known authorized domains (this would typically come from your Firebase project settings)
  // Firebase still requires every real hostname to be added to
  // Authentication -> Settings -> Authorized domains. This helper only
  // recognizes common local + provider hostnames before that check.
  const isProviderHostname =
    hostname.endsWith(".vercel.app") || hostname.endsWith(".netlify.app")

  const authorizedDomains = [
    "localhost",
    "127.0.0.1",
    "letter-share.vercel.app",
  ]

  return authorizedDomains.includes(hostname) || isProviderHostname
}

// Function to get Firebase error message in a user-friendly format
export const getFirebaseErrorMessage = (errorCode: string): string => {
  const errorMessages: Record<string, string> = {
    "auth/unauthorized-domain": "This domain is not authorized for authentication. Please use email login instead.",
    "auth/invalid-credential": "Invalid email or password. Please try again.",
    "auth/user-not-found": "No account found with this email. Please sign up first.",
    "auth/wrong-password": "Incorrect password. Please try again.",
    "auth/email-already-in-use": "This email is already registered. Please use a different email or try logging in.",
    "auth/weak-password": "Password is too weak. Please use a stronger password.",
    "auth/too-many-requests": "Too many failed login attempts. Please try again later or reset your password.",
    "auth/network-request-failed": "Network error. Please check your internet connection and try again.",
    "auth/popup-closed-by-user": "Sign-in popup was closed before completing the sign-in process.",
    "auth/cancelled-popup-request": "The authentication process was cancelled.",
    "auth/popup-blocked": "The sign-in popup was blocked by your browser. Please allow popups for this site.",
    "auth/operation-not-allowed": "This sign-in method is not enabled. Please contact support.",
  }

  return errorMessages[errorCode] || "An error occurred during authentication. Please try again."
}
