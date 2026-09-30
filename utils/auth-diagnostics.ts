import { auth } from "@/lib/firebase"
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth"

interface DiagnosticResult {
  success: boolean
  errorCode?: string
  errorMessage?: string
  providerDetails?: any
  authDomain?: string
  currentDomain?: string
}

export async function runGoogleAuthDiagnostic(): Promise<DiagnosticResult> {
  const result: DiagnosticResult = {
    success: false,
    currentDomain: typeof window !== "undefined" ? window.location.hostname : "unknown",
    authDomain: auth.config.authDomain,
  }

  try {
    // Check if Firebase is properly initialized
    if (!auth || !auth.app) {
      return {
        ...result,
        errorCode: "firebase-not-initialized",
        errorMessage: "Firebase authentication is not properly initialized",
      }
    }

    // Get provider details
    const provider = new GoogleAuthProvider()
    result.providerDetails = {
      providerId: provider.providerId,
      customParameters: provider.customParameters,
    }

    // Test popup sign-in (this will likely fail but gives us diagnostic info)
    try {
      await signInWithPopup(auth, provider)
      result.success = true
    } catch (error: any) {
      result.errorCode = error.code
      result.errorMessage = error.message

      // If we got an unauthorized domain error, that's useful diagnostic info
      if (error.code === "auth/unauthorized-domain") {
        console.log(`Current domain (${result.currentDomain}) is not authorized in Firebase console`)
        console.log(`Authorized domains should include: ${result.authDomain}`)
      }
    }

    return result
  } catch (error: any) {
    return {
      ...result,
      errorCode: error.code || "unknown-error",
      errorMessage: error.message || "An unknown error occurred during diagnostics",
    }
  }
}

export function getAuthConfigStatus() {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  }

  // Check for missing or empty values
  const missingKeys = Object.entries(firebaseConfig)
    .filter(([_, value]) => !value || value === "undefined")
    .map(([key]) => key)

  return {
    isComplete: missingKeys.length === 0,
    missingKeys,
    config: {
      ...firebaseConfig,
      // Mask sensitive values for logging
      apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 4)}...` : undefined,
      appId: firebaseConfig.appId ? `${firebaseConfig.appId.substring(0, 4)}...` : undefined,
    },
  }
}
