import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Get the verification code from the URL
    const searchParams = request.nextUrl.searchParams
    const oobCode = searchParams.get("oobCode")
    const mode = searchParams.get("mode")

    if (!oobCode) {
      return NextResponse.redirect(new URL("/verify-email?error=missing-code", request.url))
    }

    if (mode !== "verifyEmail") {
      return NextResponse.redirect(new URL("/verify-email?error=invalid-mode", request.url))
    }

    // Redirect to the verification page with the code
    // This ensures the code is properly passed to the verification page
    return NextResponse.redirect(new URL(`/verify-email?oobCode=${oobCode}&mode=${mode}`, request.url))
  } catch (error) {
    console.error("Error in verify-email API route:", error)
    return NextResponse.redirect(new URL("/verify-email?error=server-error", request.url))
  }
}
