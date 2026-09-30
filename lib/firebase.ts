import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore, enableIndexedDbPersistence, collection, query, doc, getDoc } from "firebase/firestore"
import { getStorage } from "firebase/storage"

// Add better error handling and validation
const validateFirebaseConfig = () => {
  const requiredVars = [
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    "NEXT_PUBLIC_FIREBASE_APP_ID",
  ]

  const missingVars = requiredVars.filter(
    (varName) => !process.env[varName] || process.env[varName] === "undefined" || process.env[varName] === "",
  )

  if (missingVars.length > 0) {
    console.error(`Missing Firebase environment variables: ${missingVars.join(", ")}`)
    return false
  }

  return true
}

// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined"

// Initialize Firebase with better error handling
let app
let auth
let db
let storage

try {
  const isConfigValid = validateFirebaseConfig()

  if (!isConfigValid && isBrowser) {
    console.error("Firebase configuration is invalid. Check your environment variables.")
  }

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  }

  // Log config for debugging (without sensitive values)
  if (isBrowser) {
    console.log("Firebase config loaded with project:", firebaseConfig.projectId)
  }

  // Initialize Firebase
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp()
  auth = getAuth(app)
  db = getFirestore(app)
  storage = getStorage(app)

  // Enable offline persistence with better error handling
  if (isBrowser) {
    enableIndexedDbPersistence(db, {
      synchronizeTabs: true,
    }).catch((err) => {
      if (err.code === "failed-precondition") {
        console.warn("Multiple tabs open, persistence can only be enabled in one tab at a time.")
      } else if (err.code === "unimplemented") {
        console.warn("The current browser does not support all of the features required to enable persistence")
      }
    })
  }
} catch (error) {
  console.error("Firebase initialization error:", error)

  // Create fallback instances to prevent app from crashing
  if (!app && isBrowser) {
    const fallbackConfig = {
      apiKey: "demo-api-key",
      authDomain: "demo-project.firebaseapp.com",
      projectId: "demo-project",
      storageBucket: "demo-project.appspot.com",
      messagingSenderId: "123456789",
      appId: "1:123456789:web:abcdef123456789",
    }

    app = !getApps().length ? initializeApp(fallbackConfig) : getApp()
    auth = getAuth(app)
    db = getFirestore(app)
    storage = getStorage(app)

    console.warn("Using fallback Firebase configuration. App will not connect to real Firebase services.")
  }
}

// Helper function to check if a user is an admin with caching
export const isAdmin = (email: string | null) => {
  if (!email) return false

  // Cache the result to avoid repeated checks
  if (isBrowser) {
    const cachedResult = localStorage.getItem("isAdmin")
    if (cachedResult !== null) {
      return cachedResult === "true"
    }

    const result = email === "admin@lettershare.com"
    localStorage.setItem("isAdmin", result ? "true" : "false")
    return result
  }

  return email === "admin@lettershare.com"
}

// Add a helper function to get user display name with caching
export const getUserDisplayName = () => {
  if (isBrowser) {
    return localStorage.getItem("userName") || "User"
  }
  return "User"
}

// Add a function to check if user is blocked or banned
export const checkUserStatus = async (userId: string) => {
  if (!userId) return { isBlocked: false, isBanned: false }

  try {
    const userDoc = await getDoc(doc(db, "users", userId))
    if (userDoc.exists()) {
      const userData = userDoc.data()
      return {
        isBlocked: userData.isBlocked || false,
        isBanned: userData.isBanned || false,
      }
    }
    return { isBlocked: false, isBanned: false }
  } catch (error) {
    console.error("Error checking user status:", error)
    return { isBlocked: false, isBanned: false }
  }
}

// Add a function to optimize Firestore queries
export const optimizedQuery = (collectionPath: string, ...queryConstraints: any[]) => {
  // Create a cache key based on the query parameters
  const cacheKey = `firestore_query_${collectionPath}_${JSON.stringify(queryConstraints)}`

  // Check if we have a cached result and it's not expired
  if (isBrowser) {
    const cachedData = localStorage.getItem(cacheKey)
    if (cachedData) {
      try {
        const { data, timestamp } = JSON.parse(cachedData)
        // Use cache if it's less than 5 minutes old
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          return { data, fromCache: true }
        }
      } catch (e) {
        console.warn("Error parsing cached query data", e)
      }
    }
  }

  // If no valid cache, perform the query
  return query(collection(db, collectionPath), ...queryConstraints)
}

// Export without storage
export { auth, db, storage }
