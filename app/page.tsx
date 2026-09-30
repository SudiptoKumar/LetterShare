"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)

      if (currentUser) {
        // Check if the user is an admin
        if (currentUser.email === "admin@lettershare.com") {
          router.push("/admin")
        } else {
          router.push("/feed")
        }
      }
    })

    return () => unsubscribe()
  }, [router])

  if (loading) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center text-center space-y-8">
              <div className="relative">
                <div className="absolute -inset-10 rounded-full bg-gradient-to-r from-violet-200 to-purple-200 blur-3xl opacity-70"></div>
                <div className="relative h-24 w-24 flex items-center justify-center">
                  <div className="letter-animation">
                    <svg
                      width="96"
                      height="96"
                      viewBox="0 0 96 96"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="animate-float"
                    >
                      <rect x="8" y="16" width="80" height="64" rx="4" fill="#8B5CF6" className="envelope-body" />
                      <path
                        d="M8 20C8 17.7909 9.79086 16 12 16H84C86.2091 16 88 17.7909 88 20V28L48 52L8 28V20Z"
                        fill="#A78BFA"
                        className="envelope-flap"
                      />
                      <path
                        d="M8 28L48 52L88 28"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        className="envelope-line"
                      />
                      <rect x="24" y="32" width="48" height="32" rx="2" fill="white" className="letter" />
                      <path
                        d="M32 40H64"
                        stroke="#D8B4FE"
                        strokeWidth="2"
                        strokeLinecap="round"
                        className="letter-line"
                      />
                      <path
                        d="M32 48H64"
                        stroke="#D8B4FE"
                        strokeWidth="2"
                        strokeLinecap="round"
                        className="letter-line"
                      />
                      <path
                        d="M32 56H56"
                        stroke="#D8B4FE"
                        strokeWidth="2"
                        strokeLinecap="round"
                        className="letter-line"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-4 max-w-[600px]">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent font-playfair">
                  Letter Share
                </h1>
                <p className="text-violet-700/80 md:text-xl">Connect through the timeless art of letter writing</p>
              </div>

              <div className="flex flex-col gap-4 min-[400px]:flex-row">
                <Link href="/login">
                  <Button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 px-8 py-6 text-lg">
                    Sign In
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="w-full border-t border-white/20 bg-gradient-to-r from-violet-50 to-purple-50 py-6">
        <div className="container flex flex-col items-center justify-between gap-4 px-4 md:flex-row md:px-6">
          <p className="text-sm text-violet-700/80">© 2025 Letter Share. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
