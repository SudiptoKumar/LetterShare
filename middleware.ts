import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Check if the account was deleted
  const accountDeleted = request.cookies.get("accountDeleted")?.value === "true"

  // If account was deleted and trying to access protected routes
  if (accountDeleted) {
    const url = request.nextUrl.pathname

    // If trying to access protected routes
    if (
      url.startsWith("/feed") ||
      url.startsWith("/profile") ||
      url.startsWith("/chat") ||
      url.startsWith("/messages") ||
      url.startsWith("/saved")
    ) {
      // Redirect to welcome page
      return NextResponse.redirect(new URL("/welcome", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/feed/:path*", "/profile/:path*", "/chat/:path*", "/messages/:path*", "/saved/:path*"],
}
