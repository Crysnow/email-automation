"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Save, RefreshCw, CheckCircle, XCircle, Settings, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/app/hooks/use-toast"

interface SenderConfig {
  email: string
  appPassword: string
  displayName: string
  isConfigured: boolean
}

export function SenderEmailConfig() {
  const [config, setConfig] = useState<SenderConfig>({
    email: "",
    appPassword: "",
    displayName: "PSU Accounts Department",
    isConfigured: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadCurrentConfig()
  }, [])

  const loadCurrentConfig = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/sender-config")
      if (response.ok) {
        const result = await response.json()
        setConfig({
          email: result.email || "",
          appPassword: result.appPassword || "",
          displayName: result.displayName || "PSU Accounts Department",
          isConfigured: result.isConfigured || false,
        })
      }
    } catch (error) {
      console.error("Error loading sender config:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveConfig = async () => {
    if (!config.email || !config.appPassword) {
      toast({
        title: "Missing Information",
        description: "Please provide both email and app password",
      })
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(config.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
      })
      return
    }

    // Validate app password format
    const cleanPassword = config.appPassword.replace(/\s/g, "")
    if (cleanPassword.length < 10 || cleanPassword.length > 20) {
      toast({
        title: "Invalid App Password",
        description: "Gmail app password should be 10-20 characters long",
      })
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/sender-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: config.email,
          appPassword: config.appPassword,
          displayName: config.displayName,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setConfig((prev) => ({ ...prev, isConfigured: true }))
        toast({
          title: "Configuration Saved",
          description: "Sender email configuration has been updated successfully",
        })
      } else {
        toast({
          title: "Save Failed",
          description: result.message || "Failed to save configuration",
        })
      }
    } catch (error: any) {
      console.error("Error saving config:", error)
      toast({
        title: "Error",
        description: "Failed to save configuration",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const testConnection = async () => {
    if (!config.email || !config.appPassword) {
      toast({
        title: "Missing Information",
        description: "Please provide both email and app password before testing",
      })
      return
    }

    setIsLoading(true)
    setTestResult(null)

    try {
      const response = await fetch("/api/test-sender-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: config.email,
          appPassword: config.appPassword,
          displayName: config.displayName,
        }),
      })

      const result = await response.json()
      setTestResult(result)

      if (result.success) {
        toast({
          title: "Connection Test Successful",
          description: "Gmail SMTP connection is working properly",
        })
      } else {
        toast({
          title: "Connection Test Failed",
          description: result.message || "Failed to connect to Gmail SMTP",
        })
      }
    } catch (error: any) {
      console.error("Error testing connection:", error)
      setTestResult({
        success: false,
        message: "Network error during connection test",
      })
      toast({
        title: "Test Failed",
        description: "Network error during connection test",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetConfig = () => {
    setConfig({
      email: "",
      appPassword: "",
      displayName: "SAIL Finance Department",
      isConfigured: false,
    })
    setTestResult(null)
    toast({
      title: "Configuration Reset",
      description: "Form has been cleared",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="w-5 h-5" />
          <span>Sender Email Configuration</span>
          {config.isConfigured && (
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              Configured
            </Badge>
          )}
        </CardTitle>
        <CardDescription>Configure the Gmail account used to send payment confirmation emails</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Current Configuration Display */}
          {config.isConfigured && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">📧 Current Sender Configuration:</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p>
                  <strong>Email:</strong> {config.email}
                </p>
                <p>
                  <strong>Display Name:</strong> {config.displayName}
                </p>
                <p>
                  <strong>App Password:</strong> {"*".repeat(16)} (Hidden for security)
                </p>
              </div>
            </div>
          )}

          {/* Configuration Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="sender-email">Gmail Email Address</Label>
              <Input
                id="sender-email"
                type="email"
                placeholder="your-psu-account@gmail.com"
                value={config.email}
                onChange={(e) => setConfig((prev) => ({ ...prev, email: e.target.value }))}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">The Gmail account that will send payment confirmation emails</p>
            </div>

            <div>
              <Label htmlFor="display-name">Display Name</Label>
              <Input
                id="display-name"
                type="text"
                placeholder="SAIL Finance Department"
                value={config.displayName}
                onChange={(e) => setConfig((prev) => ({ ...prev, displayName: e.target.value }))}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                The name that will appear as the sender (e.g., "PSU Accounts Department")
              </p>
            </div>

            <div>
              <Label htmlFor="app-password">Gmail App Password</Label>
              <div className="relative mt-1">
                <Input
                  id="app-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="abcd efgh ijkl mnop"
                  value={config.appPassword}
                  onChange={(e) => setConfig((prev) => ({ ...prev, appPassword: e.target.value }))}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                16-character Gmail app password (spaces are optional). Generate from Google Account settings.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button onClick={saveConfig} disabled={isSaving} className="flex-1">
              <Save className={`w-4 h-4 mr-2 ${isSaving ? "animate-spin" : ""}`} />
              {isSaving ? "Saving..." : "Save Configuration"}
            </Button>
            <Button onClick={testConnection} disabled={isLoading} variant="outline" className="flex-1 bg-transparent">
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              {isLoading ? "Testing..." : "Test Connection"}
            </Button>
          </div>

          {/* Reset Button */}
          <Button onClick={resetConfig} variant="outline" className="w-full bg-transparent">
            Reset Form
          </Button>

          {/* Test Results */}
          {testResult && (
            <div
              className={`rounded-lg p-4 ${
                testResult.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
              }`}
            >
              <div className="flex items-center space-x-2 mb-2">
                {testResult.success ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <h4 className={`font-semibold ${testResult.success ? "text-green-900" : "text-red-900"}`}>
                  {testResult.success ? "Connection Test Successful!" : "Connection Test Failed"}
                </h4>
              </div>
              <div className={`text-sm ${testResult.success ? "text-green-800" : "text-red-800"}`}>
                <p>{testResult.message}</p>
                {testResult.details && (
                  <details className="mt-2">
                    <summary className="cursor-pointer">Show Details</summary>
                    <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto">
                      {JSON.stringify(testResult.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          )}

          {/* Setup Instructions */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-900 mb-2">📋 Gmail App Password Setup:</h4>
            <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
              <li>Go to your Google Account settings</li>
              <li>Enable 2-Factor Authentication (2FA) if not already enabled</li>
              <li>Go to Security → App passwords</li>
              <li>Generate a new app password for "Mail"</li>
              <li>Copy the 16-character password and paste it above</li>
              <li>Save and test the configuration</li>
            </ol>
          </div>

          {/* Email Preview */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">📧 Email Preview:</h4>
            <div className="text-sm text-gray-700 space-y-1">
              <p>
                <strong>From:</strong> {config.displayName} &lt;{config.email || "your-email@gmail.com"}&gt;
              </p>
              <p>
                <strong>To:</strong> vendor@example.com
              </p>
              <p>
                <strong>Subject:</strong> Payment Confirmation - SAIL Party Payment
              </p>
              <p className="text-xs text-gray-500 mt-2">
                This is how your payment confirmation emails will appear to recipients.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
