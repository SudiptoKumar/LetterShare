"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { AlertTriangle, Copy, ExternalLink, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getFirebaseRuntimeStatus } from "@/lib/firebase"

export function FirebaseConfigGuard({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<ReturnType<typeof getFirebaseRuntimeStatus> | null>(null)

  useEffect(() => {
    setStatus(getFirebaseRuntimeStatus())
  }, [])

  if (!status) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-purple-50 px-4">
        <div className="animate-pulse text-sm text-violet-700">Starting Letter Share...</div>
      </div>
    )
  }

  if (!status.ready) {
    const missing = status.missingKeys.length > 0

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-purple-50 px-4 py-8">
        <Card className="w-full max-w-2xl border-violet-100 shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <AlertTriangle className="h-7 w-7 text-red-500" />
            </div>
            <CardTitle className="text-2xl text-violet-900">
              Letter Share needs Firebase configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 text-sm text-slate-600">
            {missing ? (
              <>
                <p>
                  The deployment is running, but the Firebase browser configuration is not available at build time.
                </p>
                <div className="rounded-lg border bg-slate-50 p-4">
                  <p className="mb-2 font-semibold text-slate-900">Add these environment variables:</p>
                  <code className="block whitespace-pre-wrap text-xs leading-6 text-slate-700">
                    {status.missingKeys.join("\n")}
                  </code>
                </div>
                <p>
                  Add the same <code>NEXT_PUBLIC_FIREBASE_*</code> values to the project Environment Variables in both
                  Vercel and Netlify, then redeploy the site.
                </p>
              </>
            ) : (
              <>
                <p>Firebase configuration exists, but the browser could not initialize Firebase.</p>
                <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-red-800">
                  {status.error || "Unknown Firebase initialization error."}
                </div>
                <p>Check the Firebase API key, Auth domain, Project ID, Storage bucket, Messaging Sender ID and App ID.</p>
              </>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" onClick={() => window.location.reload()} className="sm:flex-1">
                <RotateCcw className="mr-2 h-4 w-4" />
                Retry
              </Button>
              <Button
                type="button"
                variant="outline"
                className="sm:flex-1"
                onClick={() => navigator.clipboard?.writeText(status.missingKeys.join("\n"))}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy missing names
              </Button>
            </div>

            <div className="rounded-lg border border-violet-100 bg-violet-50 p-4">
              <p className="font-semibold text-violet-900">Deployment note</p>
              <p className="mt-1 text-violet-800">
                Firebase public configuration is safe to expose in a browser build. Firebase Admin credentials must stay
                server-side and must never use the <code>NEXT_PUBLIC_</code> prefix.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
