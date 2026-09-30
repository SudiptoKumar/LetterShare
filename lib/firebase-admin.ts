import * as admin from "firebase-admin"

// Check if Firebase Admin is already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
      databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
    })
    console.log("Firebase Admin initialized successfully")
  } catch (error) {
    console.error("Firebase Admin initialization error:", error)
  }
}

export const auth = admin.auth()
export const db = admin.firestore()

// Helper function to verify a Firebase ID token
export async function verifyIdToken(token: string) {
  try {
    const decodedToken = await auth.verifyIdToken(token)
    return decodedToken
  } catch (error) {
    console.error("Error verifying ID token:", error)
    throw error
  }
}

// Helper function to get user by email
export async function getUserByEmail(email: string) {
  try {
    const userRecord = await auth.getUserByEmail(email)
    return userRecord
  } catch (error) {
    console.error("Error getting user by email:", error)
    return null
  }
}

// Helper function to update user verification status
export async function updateUserVerificationStatus(uid: string, isVerified: boolean) {
  try {
    await auth.updateUser(uid, {
      emailVerified: isVerified,
    })

    // Also update in Firestore
    await db.collection("users").doc(uid).update({
      emailVerified: isVerified,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    return true
  } catch (error) {
    console.error("Error updating user verification status:", error)
    return false
  }
}
