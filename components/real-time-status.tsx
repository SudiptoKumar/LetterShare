"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, RefreshCw } from "lucide-react"
import { checkRealTimeUpdates } from "@/utils/real-time-updates"

interface RealTimeStatusProps {
  letterId: string
}

export function RealTimeStatus({ letterId }: RealTimeStatusProps) {
  const [status, setStatus] = useState<"checking" | "working" | "not-working">("checking")
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    checkStatus()
  }, [])

  const checkStatus = async () => {
    setIsChecking(true)
    setStatus("checking")

    try {
      const isWorking = await checkRealTimeUpdates(letterId)
      setStatus(isWorking ? "working" : "not-working")
    } catch (error) {
      console.error("Error checking real-time status:", error)
      setStatus("not-working")
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">Real-time updates:</span>

      {status === "checking" && (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
          Checking...
        </Badge>
      )}

      {status === "working" && (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Working
        </Badge>
      )}

      {status === "not-working" && (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <XCircle className="h-3 w-3 mr-1" />
          Not Working
        </Badge>
      )}

      <Button variant="outline" size="sm" onClick={checkStatus} disabled={isChecking} className="h-7 text-xs">
        {isChecking ? (
          <>
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            Checking...
          </>
        ) : (
          "Check Again"
        )}
      </Button>
    </div>
  )
}
