"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Settings } from "lucide-react"

interface DiagnosticResult {
  step: string
  status: "success" | "error" | "warning" | "info"
  message: string
  details?: any
}

export function EmailDiagnostic() {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<DiagnosticResult[]>([])

  const runDiagnostic = async () => {
    setIsRunning(true)
    setResults([])
    const diagnosticResults: DiagnosticResult[] = []

    try {
      // Step 1: Check Environment Variables
      diagnosticResults.push({
        step: "Environment Check",
        status: "info",
        message: "Checking Gmail environment variables...",
      })

      // Step 2: Test Gmail Status
      try {
        const statusResponse = await fetch("/api/gmail-status")
        const statusData = await statusResponse.json()

        if (statusData.gmailConfigured && statusData.appPasswordConfigured) {
          diagnosticResults.push({
            step: "Gmail Configuration",
            status: "success",
            message: `Gmail configured: ${statusData.gmailUser}`,
            details: statusData,
          })
        } else {
          diagnosticResults.push({
            step: "Gmail Configuration",
            status: "error",
            message: "Gmail credentials missing or incomplete",
            details: statusData,
          })
        }
      } catch (error) {
        diagnosticResults.push({
          step: "Gmail Configuration",
          status: "error",
          message: "Failed to check Gmail configuration",
          details: error,
        })
      }

      // Step 3: Test Email Service
      try {
        const testResponse = await fetch("/api/test-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ testEmail: "diagnostic@test.com" }),
        })

        const testData = await testResponse.json()

        if (testData.success) {
          const method = testData.method === "smtp" ? "SMTP (Real Email)" : "HTTP Simulation"
          diagnosticResults.push({
            step: "Email Service Test",
            status: testData.method === "smtp" ? "success" : "warning",
            message: `Email processing working via ${method}`,
            details: testData,
          })
        } else {
          diagnosticResults.push({
            step: "Email Service Test",
            status: "error",
            message: testData.message || "Email service failed",
            details: testData,
          })
        }
      } catch (error) {
        diagnosticResults.push({
          step: "Email Service Test",
          status: "error",
          message: "Email service request failed",
          details: error,
        })
      }

      // Step 4: Check Nodemailer
      try {
        const nodemailerCheck = await fetch("/api/check-nodemailer")
        if (nodemailerCheck.ok) {
          const nodemailerData = await nodemailerCheck.json()
          diagnosticResults.push({
            step: "Nodemailer Check",
            status: nodemailerData.available ? "success" : "warning",
            message: nodemailerData.message,
            details: nodemailerData,
          })
        }
      } catch (error) {
        diagnosticResults.push({
          step: "Nodemailer Check",
          status: "warning",
          message: "Could not check nodemailer status",
          details: error,
        })
      }

      setResults(diagnosticResults)
    } catch (error) {
      console.error("Diagnostic error:", error)
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "error":
        return <XCircle className="w-4 h-4 text-red-600" />
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      default:
        return <RefreshCw className="w-4 h-4 text-blue-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-100 text-green-800">Success</Badge>
      case "error":
        return <Badge variant="destructive">Error</Badge>
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>
      default:
        return <Badge variant="secondary">Info</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="w-5 h-5" />
          <span>🔧 Email System Diagnostic</span>
        </CardTitle>
        <CardDescription>Comprehensive diagnostic to identify email sending issues</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Run Diagnostic Button */}
          <Button onClick={runDiagnostic} disabled={isRunning} className="w-full">
            <RefreshCw className={`w-4 h-4 mr-2 ${isRunning ? "animate-spin" : ""}`} />
            {isRunning ? "Running Diagnostic..." : "🔍 Run Email Diagnostic"}
          </Button>

          {/* Current Issue Notice */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-900">❌ Known Issue: Emails Not Sending</h4>
                <p className="text-sm text-red-800 mt-1">
                  The system is currently in simulation mode. Real SMTP email sending may be blocked by environment
                  limitations.
                </p>
                <ul className="text-sm text-red-700 mt-2 space-y-1">
                  <li>• Check if Gmail credentials are properly configured</li>
                  <li>• Verify Gmail app password is correct (16 characters)</li>
                  <li>• Ensure 2FA is enabled on Gmail account</li>
                  <li>• Check if nodemailer is working in your environment</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Diagnostic Results */}
          {results.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold">Diagnostic Results:</h4>
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-3 ${
                    result.status === "success"
                      ? "bg-green-50 border-green-200"
                      : result.status === "error"
                        ? "bg-red-50 border-red-200"
                        : result.status === "warning"
                          ? "bg-yellow-50 border-yellow-200"
                          : "bg-blue-50 border-blue-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(result.status)}
                      <span className="font-medium">{result.step}</span>
                    </div>
                    {getStatusBadge(result.status)}
                  </div>
                  <p className="text-sm mb-2">{result.message}</p>
                  {result.details && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-gray-600">Show Details</summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-32">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Quick Fixes */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">🔧 Quick Fixes to Try:</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Verify your .env.local file has correct Gmail credentials</li>
              <li>Restart your Next.js application (Ctrl+C then npm run dev)</li>
              <li>Test with the email test feature above</li>
              <li>Check browser console for detailed error messages</li>
              <li>Ensure Gmail 2FA is enabled and app password is generated</li>
            </ol>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
