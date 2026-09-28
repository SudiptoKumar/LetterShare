import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/firebase-admin"

export async function authMiddleware(request: NextRequest) {
  try {
    // Get the Firebase ID token from the request
    const idToken = request.cookies.get("firebaseIdToken")?.value

    // If no token, redirect to login
    if (!idToken) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    // Verify the ID token
    const decodedToken = await auth.verifyIdToken(idToken)

    // Check if email is verified for protected routes
    const requiresVerification = ["/feed", "/profile", "/settings", "/compose"].some((path) =>
      request.nextUrl.pathname.startsWith(path),
    )

    // If email verification is required but not verified, redirect to verification page
    if (requiresVerification && !decodedToken.email_verified) {
      return NextResponse.redirect(new URL("/email-verification-required", request.url))
    }

    // User is authenticated and verified if required, proceed
    return NextResponse.next()
  } catch (error) {
    console.error("Auth middleware error:", error)

    // Clear the invalid token
    const response = NextResponse.redirect(new URL("/login", request.url))
    response.cookies.delete("firebaseIdToken")

    return response
  }
}
