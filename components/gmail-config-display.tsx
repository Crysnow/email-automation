"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, AlertTriangle, CheckCircle, XCircle, RefreshCw } from "lucide-react"

interface GmailConfig {
  gmailConfigured: boolean
  appPasswordConfigured: boolean
  gmailUser: string | null
  timestamp: string
}

export function GmailConfigDisplay() {
  const [config, setConfig] = useState<GmailConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastChecked, setLastChecked] = useState<string | null>(null)

  useEffect(() => {
    checkGmailConfig()
  }, [])

  const checkGmailConfig = async () => {
    setIsLoading(true)
    try {
      console.log("🔍 Checking Gmail configuration...")

      const response = await fetch("/api/gmail-status", {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      })

      console.log("📡 Gmail config response:", response.status)

      if (response.ok) {
        const result = await response.json()
        console.log("📧 Gmail config result:", result)

        setConfig({
          gmailConfigured: result.gmailConfigured || false,
          appPasswordConfigured: result.appPasswordConfigured || false,
          gmailUser: result.gmailUser || null,
          timestamp: result.timestamp || new Date().toISOString(),
        })
      } else {
        // Fallback for failed requests
        setConfig({
          gmailConfigured: false,
          appPasswordConfigured: false,
          gmailUser: null,
          timestamp: new Date().toISOString(),
        })
      }

      setLastChecked(new Date().toLocaleTimeString())
    } catch (error) {
      console.error("❌ Error checking Gmail config:", error)

      // Set fallback config
      setConfig({
        gmailConfigured: false,
        appPasswordConfigured: false,
        gmailUser: null,
        timestamp: new Date().toISOString(),
      })
      setLastChecked(new Date().toLocaleTimeString())
    } finally {
      setIsLoading(false)
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
          <Button variant="outline" size="sm" onClick={checkGmailConfig} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </CardTitle>
        <CardDescription>Live check of your Gmail SMTP configuration</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-gray-600">Checking Gmail configuration...</span>
            </div>
          ) : config ? (
            <>
              {/* Configuration Status */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Gmail Account:</span>
                  {getStatusBadge(config.gmailConfigured, "Configured")}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">App Password:</span>
                  {getStatusBadge(config.appPasswordConfigured, "Configured")}
                </div>

                {lastChecked && <div className="text-xs text-gray-500">Last checked: {lastChecked}</div>}
              </div>

              {/* Status Messages */}
              {config.gmailConfigured && config.appPasswordConfigured ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-green-900">✅ Gmail Fully Configured!</p>
                      <p className="text-sm text-green-800">
                        <strong>Account:</strong> {config.gmailUser}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        Your Gmail SMTP is ready to send emails. Test it below!
                      </p>
                    </div>
                  </div>
                </div>
              ) : config.gmailConfigured && !config.appPasswordConfigured ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-yellow-900">⚠️ App Password Missing</p>
                      <p className="text-sm text-yellow-800">
                        Gmail account configured: <strong>{config.gmailUser}</strong>
                      </p>
                      <p className="text-xs text-yellow-600 mt-1">
                        Please add your Gmail app password to complete setup.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-900">❌ Gmail Not Configured</p>
                      <p className="text-sm text-red-800">Please add your Gmail credentials to your .env.local file:</p>
                      <code className="text-xs bg-red-100 px-2 py-1 rounded mt-2 block">
                        GMAIL_USER=your-psu-email@gmail.com
                        <br />
                        GMAIL_APP_PASSWORD=your-16-character-app-password
                      </code>
                      <p className="text-xs text-red-600 mt-2">
                        After updating .env.local, restart your application and refresh this page.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">Unable to check configuration status</p>
            </div>
          )}

          {/* Required Environment Variables */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">📋 Required in .env.local:</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <code className="block bg-blue-100 p-2 rounded text-xs">GMAIL_USER=your-psu-email@gmail.com</code>
              <code className="block bg-blue-100 p-2 rounded text-xs">GMAIL_APP_PASSWORD=abcd efgh ijkl mnop</code>
              <p className="text-xs text-blue-600 mt-2">
                💡 After updating .env.local, restart your Next.js application (Ctrl+C then npm run dev)
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
