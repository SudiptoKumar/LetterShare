import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app"
import { getAuth, connectAuthEmulator } from "firebase/auth"
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore"
import { getStorage, connectStorageEmulator } from "firebase/storage"

// Environment detection
const isDevelopment = process.env.NODE_ENV === "development"
const isBrowser = typeof window !== "undefined"

// Validate Firebase configuration
export function validateFirebaseConfig(): { isValid: boolean; missingKeys: string[] } {
  const requiredKeys = [
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    "NEXT_PUBLIC_FIREBASE_APP_ID",
  ]

  const missingKeys = requiredKeys.filter((key) => !process.env[key] || process.env[key] === "undefined")

  return {
    isValid: missingKeys.length === 0,
    missingKeys,
  }
}

// Get Firebase configuration
export function getFirebaseConfig(): FirebaseOptions {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  }
}

// Initialize Firebase with better error handling
export function initializeFirebase() {
  try {
    const { isValid, missingKeys } = validateFirebaseConfig()

    if (!isValid) {
      console.error(`Missing Firebase configuration keys: ${missingKeys.join(", ")}`)
      throw new Error("Invalid Firebase configuration")
    }

    const firebaseConfig = getFirebaseConfig()

    // Initialize Firebase app
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()
    const auth = getAuth(app)
    const db = getFirestore(app)
    const storage = getStorage(app)

    // Connect to emulators in development if needed
    if (isDevelopment && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true") {
      if (isBrowser) {
        // Only connect to emulators in browser environment
        connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true })
        connectFirestoreEmulator(db, "localhost", 8080)
        connectStorageEmulator(storage, "localhost", 9199)
        console.log("Connected to Firebase emulators")
      }
    }

    return { app, auth, db, storage }
  } catch (error) {
    console.error("Firebase initialization error:", error)

    // Return null values to indicate initialization failure
    return { app: null, auth: null, db: null, storage: null }
  }
}
