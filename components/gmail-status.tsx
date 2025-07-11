"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, RefreshCw, Mail } from "lucide-react"

interface GmailStatus {
  gmailConfigured: boolean
  gmailUser: string | null
  appPasswordConfigured: boolean
  timestamp: string
}

export function GmailStatus() {
  const [gmailStatus, setGmailStatus] = useState<GmailStatus | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [lastChecked, setLastChecked] = useState<string | null>(null)

  useEffect(() => {
    checkGmailStatus()
  }, [])

  const checkGmailStatus = async () => {
    setIsChecking(true)
    try {
      console.log("Checking Gmail status...")

      const response = await fetch("/api/gmail-status", {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      })

      console.log("Gmail status response:", response.status, response.statusText)

      if (!response.ok) {
        console.warn(`Gmail status API returned ${response.status}: ${response.statusText}`)
        // Don't throw error, handle gracefully
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        console.warn("Gmail status API returned non-JSON response")
        // Set fallback status
        setGmailStatus({
          gmailConfigured: false,
          appPasswordConfigured: false,
          gmailUser: null,
          timestamp: new Date().toISOString(),
        })
        setLastChecked(new Date().toLocaleTimeString())
        return
      }

      const result = await response.json()
      console.log("Gmail status result:", result)

      // Always set status regardless of success field
      setGmailStatus({
        gmailConfigured: result.gmailConfigured || false,
        appPasswordConfigured: result.appPasswordConfigured || false,
        gmailUser: result.gmailUser || null,
        timestamp: result.timestamp || new Date().toISOString(),
      })
      setLastChecked(new Date().toLocaleTimeString())
    } catch (error: any) {
      console.error("Error checking Gmail status:", error)

      // Set fallback status instead of showing error
      setGmailStatus({
        gmailConfigured: false,
        appPasswordConfigured: false,
        gmailUser: null,
        timestamp: new Date().toISOString(),
      })
      setLastChecked(new Date().toLocaleTimeString())

      // Don't show error toast, just log it
      console.warn("Gmail status check failed, using fallback values")
    } finally {
      setIsChecking(false)
    }
  }

  const getStatusBadge = (status: boolean, label: string) => {
    if (status) {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle className="w-3 h-3 mr-1" />
          {label} ✓
        </Badge>
      )
    }
    return (
      <Badge variant="destructive">
        <XCircle className="w-3 h-3 mr-1" />
        {label} ✗
      </Badge>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <Mail className="w-5 h-5" />
            <span>Gmail Configuration Status</span>
          </span>
          <Button variant="outline" size="sm" onClick={checkGmailStatus} disabled={isChecking}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isChecking ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </CardTitle>
        <CardDescription>Check if your Gmail SMTP configuration is properly set up</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {gmailStatus ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Gmail Account:</span>
                {getStatusBadge(gmailStatus.gmailConfigured, "Configured")}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">App Password:</span>
                {getStatusBadge(gmailStatus.appPasswordConfigured, "Configured")}
              </div>

              {lastChecked && <div className="text-xs text-gray-500 mt-2">Last checked: {lastChecked}</div>}

              {gmailStatus.gmailConfigured && gmailStatus.gmailUser ? (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>✅ Gmail Account Configured:</strong> {gmailStatus.gmailUser}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {gmailStatus.appPasswordConfigured
                      ? "App password is configured and ready to use!"
                      : "Please configure your Gmail app password"}
                  </p>
                </div>
              ) : (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>❌ Gmail Not Configured</strong>
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    Please add your Gmail credentials to your .env.local file:
                  </p>
                  <code className="text-xs bg-red-100 px-2 py-1 rounded mt-1 block">
                    GMAIL_USER=your-psu-email@gmail.com
                    <br />
                    GMAIL_APP_PASSWORD=your-16-character-app-password
                  </code>
                </div>
              )}

              {!gmailStatus.appPasswordConfigured && gmailStatus.gmailConfigured && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>⚠️ App Password Missing</strong>
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">
                    You need to create a Gmail app password. Follow the setup guide above.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-gray-600">Checking Gmail configuration...</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
