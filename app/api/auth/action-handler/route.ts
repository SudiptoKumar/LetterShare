import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Extract all query parameters
    const url = new URL(request.url)
    const mode = url.searchParams.get("mode")
    const oobCode = url.searchParams.get("oobCode")
    const continueUrl = url.searchParams.get("continueUrl")
    const apiKey = url.searchParams.get("apiKey")

    // Log the parameters for debugging
    console.log("Action handler parameters:", { mode, oobCode, continueUrl, apiKey })

    if (!oobCode) {
      return NextResponse.redirect(new URL("/verify-email?error=missing-code", request.url))
    }

    // Construct the redirect URL with all necessary parameters
    const redirectUrl = new URL("/verify-email", request.url)
    redirectUrl.searchParams.set("oobCode", oobCode)

    if (mode) redirectUrl.searchParams.set("mode", mode)
    if (continueUrl) redirectUrl.searchParams.set("continueUrl", continueUrl)
    if (apiKey) redirectUrl.searchParams.set("apiKey", apiKey)

    // Redirect to the verification page with all parameters preserved
    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error("Error in action handler:", error)
    return NextResponse.redirect(new URL("/verify-email?error=server-error", request.url))
  }
}
