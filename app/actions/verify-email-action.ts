"use server"

import { auth } from "@/lib/firebase-admin"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function verifyEmailAction(oobCode: string) {
  try {
    // Verify the action code on the server side
    await auth.verifyEmailVerificationCode(oobCode)

    // Apply the verification
    await auth.applyActionCode(oobCode)

    // Get the user from the action code
    const { email } = await auth.checkActionCode(oobCode)

    if (!email) {
      throw new Error("No email associated with this verification code")
    }

    // Get the user by email
    const userRecord = await auth.getUserByEmail(email)

    // Create a custom token for automatic sign-in
    const customToken = await auth.createCustomToken(userRecord.uid)

    // Set the token in a cookie for the client to use
    cookies().set("emailVerificationToken", customToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 5 * 60, // 5 minutes
      path: "/",
    })

    // Redirect to the feed page
    redirect("/feed")
  } catch (error: any) {
    console.error("Server-side email verification error:", error)

    // Redirect to the error page with the error message
    const errorMessage = encodeURIComponent(error.message || "Failed to verify email. Please try again.")
    redirect(`/verify-email/error?message=${errorMessage}`)
  }
}
