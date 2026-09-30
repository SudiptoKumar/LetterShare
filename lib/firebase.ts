import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app"
import {
  getAuth,
  type Auth,
  onAuthStateChanged,
  signOut,
  type User,
} from "firebase/auth"
import {
  getFirestore,
  enableIndexedDbPersistence,
  collection,
  query,
  doc,
  getDoc,
  type Firestore,
} from "firebase/firestore"
import { getStorage, type FirebaseStorage } from "firebase/storage"

const isBrowser = typeof window !== "undefined"

const requiredConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const missingKeys = Object.entries(requiredConfig)
  .filter(([, value]) => !value || value === "undefined")
  .map(([key]) => `NEXT_PUBLIC_FIREBASE_${key.replace(/([A-Z])/g, "_$1").toUpperCase()}`)

export const firebaseConfigStatus = {
  isConfigured: missingKeys.length === 0,
  missingKeys,
}

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null
let storage: FirebaseStorage | null = null
let firebaseInitError: string | null = null

export function initializeFirebaseClient() {
  if (!isBrowser) return null
  if (!firebaseConfigStatus.isConfigured) {
    firebaseInitError = `Missing Firebase configuration: ${firebaseConfigStatus.missingKeys.join(", ")}`
    return null
  }

  if (auth && db && storage) {
    return { app, auth, db, storage }
  }

  try {
    const firebaseConfig = {
      apiKey: requiredConfig.apiKey!,
      authDomain: requiredConfig.authDomain!,
      projectId: requiredConfig.projectId!,
      storageBucket: requiredConfig.storageBucket!,
      messagingSenderId: requiredConfig.messagingSenderId!,
      appId: requiredConfig.appId!,
    }

    app = getApps().length ? getApp() : initializeApp(firebaseConfig)
    auth = getAuth(app)
    db = getFirestore(app)
    storage = getStorage(app)
    firebaseInitError = null

    enableIndexedDbPersistence(db, { synchronizeTabs: true }).catch((error: any) => {
      if (error?.code === "failed-precondition") {
        console.warn("Firebase offline persistence is already enabled in another tab.")
      } else if (error?.code === "unimplemented") {
        console.warn("This browser does not support Firebase offline persistence.")
      }
    })

    return { app, auth, db, storage }
  } catch (error: any) {
    app = null
    auth = null
    db = null
    storage = null
    firebaseInitError = error?.message || "Firebase initialization failed."
    console.error("Firebase initialization failed:", error)
    return null
  }
}

export function getFirebaseRuntimeStatus() {
  if (!isBrowser) {
    return {
      ready: firebaseConfigStatus.isConfigured,
      configured: firebaseConfigStatus.isConfigured,
      missingKeys: firebaseConfigStatus.missingKeys,
      error: null,
    }
  }

  const runtime = initializeFirebaseClient()

  return {
    ready: Boolean(runtime?.auth && runtime?.db && runtime?.storage),
    configured: firebaseConfigStatus.isConfigured,
    missingKeys: firebaseConfigStatus.missingKeys,
    error: firebaseInitError,
  }
}

initializeFirebaseClient()

export { app, auth, db, storage }

export const isAdmin = (email: string | null) => {
  if (!email) return false

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

export const getUserDisplayName = () => {
  if (isBrowser) {
    return localStorage.getItem("userName") || "User"
  }
  return "User"
}

export const checkUserStatus = async (userId: string) => {
  if (!userId || !db) return { isBlocked: false, isBanned: false }

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

export const optimizedQuery = (collectionPath: string, ...queryConstraints: any[]) => {
  if (!db) {
    throw new Error("Firebase Firestore is not initialized. Configure the NEXT_PUBLIC_FIREBASE_* variables.")
  }

  const cacheKey = `firestore_query_${collectionPath}_${JSON.stringify(queryConstraints)}`

  if (isBrowser) {
    const cachedData = localStorage.getItem(cacheKey)
    if (cachedData) {
      try {
        const { data, timestamp } = JSON.parse(cachedData)
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          return { data, fromCache: true }
        }
      } catch (error) {
        console.warn("Error parsing cached query data", error)
      }
    }
  }

  return query(collection(db, collectionPath), ...queryConstraints)
}

export type FirebaseAuthUser = User
export { onAuthStateChanged, signOut }
