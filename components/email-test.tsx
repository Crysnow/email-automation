"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Send, CheckCircle, AlertTriangle, Globe, Zap } from "lucide-react"
import { useToast } from "@/app/hooks/use-toast"

export function EmailTest() {
  const [testEmail, setTestEmail] = useState("aviral15gupta@gmail.com")
  const [isSending, setIsSending] = useState(false)
  const [lastResult, setLastResult] = useState<any>(null)
  const { toast } = useToast()

  const sendTestEmail = async () => {
    if (!testEmail) {
      toast({
        title: "Email required",
        description: "Please enter a test email address",
      })
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(testEmail)) {
      toast({
        title: "Invalid email format",
        description: "Please enter a valid email address",
      })
      return
    }

    setIsSending(true)
    setLastResult(null)

    try {
      console.log("🧪 Starting email processing test...")

      const response = await fetch("/api/test-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ testEmail }),
      })

      console.log("📡 Test email response status:", response.status)

      const result = await response.json()
      console.log("📧 Test email result:", result)

      setLastResult(result)

      if (result.success) {
        toast({
          title: "Email Processed Successfully! 📧",
          description: `Email processed for ${testEmail} via ${result.account || "Email System"}`,
        })
      } else {
        toast({
          title: "Email processing failed",
          description: result.message,
        })
      }
    } catch (error) {
      console.error("❌ Test email error:", error)
      toast({
        title: "Error",
        description: "Failed to process email. Check your configuration.",
      })
      setLastResult({
        success: false,
        message: "Network error or server unavailable",
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Mail className="w-5 h-5" />
          <span>Email Processing Test System</span>
        </CardTitle>
        <CardDescription>Test the multi-account email processing system</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* HTTP Processing Info */}
          

          <div>
            <Label htmlFor="test-email">Test Email Address</Label>
            <Input
              id="test-email"
              type="email"
              placeholder="recipient@example.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">💡 This will process a test email through the system</p>
          </div>

          <Button onClick={sendTestEmail} disabled={isSending} className="w-full">
            <Send className="w-4 h-4 mr-2" />
            {isSending ? "Processing Email..." : "📧 Process Test Email"}
          </Button>

          {/* Result Display */}
          {lastResult && (
            <div
              className={`rounded-lg p-4 ${
                lastResult.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
              }`}
            >
              <div className="flex items-center space-x-2 mb-2">
                {lastResult.success ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                )}
                <h4 className={`font-semibold ${lastResult.success ? "text-green-900" : "text-red-900"}`}>
                  {lastResult.success ? "Email Processed Successfully!" : "Email Processing Failed"}
                </h4>
                {lastResult.method && (
                  <div className="flex items-center space-x-1">
                    <Globe className="w-3 h-3 text-blue-600" />
                    <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">HTTP Processing</span>
                  </div>
                )}
              </div>
              <div className={`text-sm ${lastResult.success ? "text-green-800" : "text-red-800"}`}>
                <p>
                  <strong>Status:</strong> {lastResult.message}
                </p>
                {lastResult.account && (
                  <p>
                    <strong>Account Used:</strong> {lastResult.account} (#{lastResult.accountIndex})
                  </p>
                )}
                {lastResult.usage && lastResult.limit && (
                  <p>
                    <strong>Account Usage:</strong> {lastResult.usage}/{lastResult.limit} emails today
                  </p>
                )}
                {lastResult.messageId && (
                  <p>
                    <strong>Message ID:</strong> {lastResult.messageId}
                  </p>
                )}
                {lastResult.connectionTest && (
                  <p>
                    <strong>Connection:</strong> {lastResult.connectionTest.message}
                  </p>
                )}
                {lastResult.error && (
                  <p>
                    <strong>Error Code:</strong> {lastResult.error}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Processing Notice */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <Zap className="w-4 h-4 text-purple-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-purple-900">⚡ Email Processing System</p>
                <p className="text-purple-800">
                  This system processes emails through a compatible HTTP-based method that works in all environments.
                  All emails are fully tracked and logged in the dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
