"use client"

import { useState, useEffect, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import { FileText, PenLine, MessageSquare, Bell, User, LogOut, Shield } from "lucide-react"
import { auth } from "@/lib/firebase"
import { signOut } from "firebase/auth"
import { useToast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { collection, query, where, limit, onSnapshot, doc, setDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { Bookmark, Settings } from "lucide-react"

export function Navigation() {
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<string>("letters")
  const router = useRouter()
  const { toast } = useToast()
  const [hasNewMessages, setHasNewMessages] = useState(false)
  const [hasNewNotifications, setHasNewNotifications] = useState(false)
  const navRef = useRef<HTMLDivElement>(null)
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [expanded, setExpanded] = useState<string | null>("letters") // Default expanded tab
  const [isScrolling, setIsScrolling] = useState(false)
  const [showNavigation, setShowNavigation] = useState(true)
  const lastScrollY = useRef(0)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser)

      if (currentUser) {
        // Fetch user profile data
        const userRef = doc(db, "users", currentUser.uid)
        const unsubscribeProfile = onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            setUserProfile(doc.data())
          }
        })

        return () => {
          unsubscribeProfile()
        }
      }
    })

    return () => unsubscribe()
  }, [])

  // Set active tab based on pathname
  useEffect(() => {
    if (pathname === "/feed" || pathname === "/") {
      setActiveTab("letters")
      setExpanded("letters")
    } else if (pathname.startsWith("/messages")) {
      setActiveTab("messages")
      setExpanded("messages")
    } else if (pathname === "/notifications") {
      setActiveTab("notifications")
      setExpanded("notifications")
    } else if (pathname === "/saved") {
      setActiveTab("saved")
      setExpanded("saved")
    } else if (pathname === "/settings") {
      setActiveTab("settings")
      setExpanded("settings")
    } else if (pathname === "/profile" || pathname.includes("/profile")) {
      setActiveTab("profile")
      setExpanded("profile")
    } else if (pathname === "/admin") {
      setActiveTab("admin")
      setExpanded("admin")
    }
  }, [pathname])

  // Add an effect to check for new messages
  useEffect(() => {
    if (!user) return

    // Set up a listener for unread messages
    const messagesQuery = query(
      collection(db, "messages"),
      where("recipientId", "==", user.uid),
      where("read", "==", false),
      limit(1),
    )

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      setHasNewMessages(!snapshot.empty)
    })

    return () => unsubscribe()
  }, [user])

  // Update user presence
  useEffect(() => {
    if (!user) return

    const userPresenceRef = doc(db, "presence", user.uid)

    // Set user as online
    const setUserOnline = async () => {
      await setDoc(userPresenceRef, {
        userId: user.uid,
        status: "online",
        lastSeen: serverTimestamp(),
      })
    }

    // Set user as offline when they leave
    const setUserOffline = async () => {
      await setDoc(userPresenceRef, {
        userId: user.uid,
        status: "offline",
        lastSeen: serverTimestamp(),
      })
    }

    // Set online when component mounts
    setUserOnline()

    // Set up event listeners for online/offline status
    window.addEventListener("beforeunload", setUserOffline)

    // Set up periodic updates to keep presence fresh
    const intervalId = setInterval(setUserOnline, 5 * 60 * 1000) // Every 5 minutes

    return () => {
      clearInterval(intervalId)
      window.removeEventListener("beforeunload", setUserOffline)
      setUserOffline()
    }
  }, [user])

  // Handle scroll to show/hide navigation
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      if (currentScrollY > lastScrollY.current + 20) {
        setShowNavigation(false)
        lastScrollY.current = currentScrollY
      } else if (currentScrollY < lastScrollY.current - 20) {
        setShowNavigation(true)
        lastScrollY.current = currentScrollY
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account",
        variant: "default",
        className: "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0",
      })
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleComposeClick = () => {
    if (user) {
      // Directly open the compose letter form
      const composeDialog = document.querySelector('[data-compose-dialog="true"]')
      if (composeDialog) {
        // If we have a direct reference to the dialog, use it
        ;(composeDialog as HTMLElement).click()
      } else {
        // Otherwise try to find the trigger button
        const composeTrigger = document.getElementById("compose-letter-trigger")
        if (composeTrigger) {
          composeTrigger.click()
        }
      }
    } else {
      router.push("/login")
    }
  }

  const handleTabClick = (tab: string) => {
    setActiveTab(tab)
    setExpanded(tab)

    switch (tab) {
      case "letters":
        router.push("/feed")
        break
      case "compose":
        handleComposeClick()
        break
      case "messages":
        router.push("/messages")
        localStorage.setItem("lastMessagesViewed", new Date().toISOString())
        break
      case "notifications":
        router.push("/notifications")
        setHasNewNotifications(false)
        break
      case "profile":
        router.push("/profile")
        break
      case "admin":
        if (user?.email === "admin@lettershare.com") {
          router.push("/admin")
        }
        break
    }
  }

  // Handle scroll events for the navigation bar
  const handleNavScroll = () => {
    if (navRef.current) {
      setIsScrolling(navRef.current.scrollLeft > 0)
    }
  }

  // Don't show navigation on login, register, or welcome pages
  if (pathname === "/login" || pathname === "/register" || pathname === "/welcome" || (pathname === "/" && !user)) {
    return null
  }

  // Get first character of user's first name for the avatar
  const getFirstNameInitial = () => {
    if (userProfile?.displayName) {
      const firstName = userProfile.displayName.split(" ")[0]
      return firstName[0].toUpperCase()
    } else if (user?.displayName) {
      const firstName = user.displayName.split(" ")[0]
      return firstName[0].toUpperCase()
    } else if (user?.email) {
      return user.email[0].toUpperCase()
    }
    return "U"
  }

  // Define navigation items - removed Settings, kept only essential items
  const navItems = [
    { id: "letters", label: "Letters", icon: FileText, show: true },
    { id: "compose", label: "Compose", icon: PenLine, show: true },
    { id: "messages", label: "Messages", icon: MessageSquare, show: true, indicator: hasNewMessages },
    { id: "notifications", label: "Notifications", icon: Bell, show: true, indicator: hasNewNotifications },
    { id: "admin", label: "Admin", icon: Shield, show: user?.email === "admin@lettershare.com" },
  ]

  // Filter items to show based on screen size
  const visibleNavItems = navItems.filter((item) => item.show).slice(0, isMobile ? 4 : navItems.length)

  return (
    <AnimatePresence>
      {showNavigation && (
        <motion.div
          className="floating-nav-container"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <div className="floating-nav">
            <div className="flex items-center justify-between">
              {/* Logo/Brand */}
              <div className="flex items-center">
                <span className="text-xl font-bold text-violet-700 mr-4">LetterShare</span>
              </div>

              {/* Navigation Items */}
              <div
                ref={navRef}
                className="flex items-center space-x-1 overflow-x-auto scrollbar-hide"
                style={{
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                  WebkitOverflowScrolling: "touch",
                }}
                onScroll={handleNavScroll}
              >
                {visibleNavItems.map((item) => (
                  <motion.button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={cn(
                      "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                      activeTab === item.id
                        ? "bg-violet-100 text-violet-700"
                        : "text-gray-600 hover:bg-violet-50 hover:text-violet-600",
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="relative">
                      <item.icon className="h-5 w-5" />
                      {item.indicator && (
                        <span className="absolute -top-1 -right-1 h-2 w-2 bg-violet-500 rounded-full"></span>
                      )}
                    </div>
                    <AnimatePresence>
                      {expanded === item.id && (
                        <motion.span
                          className="ml-2 whitespace-nowrap"
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                ))}
              </div>

              {/* User Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 p-0 ml-2">
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={userProfile?.photoURL || user?.photoURL}
                        alt={userProfile?.displayName || user?.displayName || "User"}
                      />
                      <AvatarFallback className="bg-violet-100 text-violet-700">{getFirstNameInitial()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 glass-card border-0 shadow-lg">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="rounded-full h-10 w-10 bg-violet-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-violet-700" />
                    </div>
                    <div className="flex flex-col">
                      <p className="text-sm font-medium">{userProfile?.displayName || user?.displayName || "User"}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => router.push("/profile")}
                    className="cursor-pointer hover:bg-violet-50"
                  >
                    <User className="mr-2 h-4 w-4 text-violet-600" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push("/settings")}
                    className="cursor-pointer hover:bg-violet-50"
                  >
                    <Settings className="mr-2 h-4 w-4 text-violet-600" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/saved")} className="cursor-pointer hover:bg-violet-50">
                    <Bookmark className="mr-2 h-4 w-4 text-violet-600" />
                    <span>Saved</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer hover:bg-red-50 text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
