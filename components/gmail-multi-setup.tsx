"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Mail, Shield, Key, ExternalLink, Users, AlertTriangle, CheckCircle, XCircle } from "lucide-react"

interface AccountStatus {
  index: number
  name: string
  email: string
  usage: number
  limit: number
  remaining: number
  percentage: number
  status: "available" | "warning" | "at-limit"
}

export function GmailMultiSetup() {
  const [accountStatuses, setAccountStatuses] = useState<AccountStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAccountStatuses()
  }, [])

  const checkAccountStatuses = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/gmail-accounts-status")
      if (response.ok) {
        const result = await response.json()
        setAccountStatuses(result.accounts || [])
      }
    } catch (error) {
      console.error("Error checking account statuses:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const openGmailSecurity = () => {
    window.open("https://myaccount.google.com/security", "_blank")
  }

  const openAppPasswords = () => {
    window.open("https://myaccount.google.com/apppasswords", "_blank")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800"
      case "warning":
        return "bg-yellow-100 text-yellow-800"
      case "at-limit":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "available":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      case "at-limit":
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <Mail className="w-4 h-4 text-gray-600" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="w-5 h-5" />
          <span>Gmail Setup</span>
          <Badge variant="secondary">Single Account</Badge>
        </CardTitle>
        <CardDescription>Gmail account configuration for PSU email automation</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Account Status Overview */}
          {!isLoading && accountStatuses.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Configured Account ({accountStatuses.length}/1)</h4>
                <Button variant="outline" size="sm" onClick={checkAccountStatuses}>
                  Refresh Status
                </Button>
              </div>

              <div className="grid gap-3">
                {accountStatuses.map((account) => (
                  <div key={account.index} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(account.status)}
                        <span className="font-medium">{account.name}</span>
                        <Badge className={getStatusColor(account.status)}>
                          {account.status === "available" && "Available"}
                          {account.status === "warning" && "High Usage"}
                          {account.status === "at-limit" && "At Limit"}
                        </Badge>
                      </div>
                      <span className="text-sm text-gray-600">{account.email}</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Daily Usage</span>
                        <span>
                          {account.usage}/{account.limit} emails
                        </span>
                      </div>
                      <Progress value={account.percentage} className="h-2" />
                      <div className="text-xs text-gray-500">{account.remaining} emails remaining today</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Setup Instructions */}
          

          {/* Benefits */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">✅ Single Account Benefits:</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>
                <CheckCircle className="w-3 h-3 inline mr-1 text-green-600" />
                <strong>450 emails/day</strong> capacity
              </li>
              <li>
                <CheckCircle className="w-3 h-3 inline mr-1 text-green-600" />
                <strong>Simple setup</strong> - just one account to configure
              </li>
              <li>
                <CheckCircle className="w-3 h-3 inline mr-1 text-green-600" />
                <strong>Reliable delivery</strong> with Google's infrastructure
              </li>
              <li>
                <CheckCircle className="w-3 h-3 inline mr-1 text-green-600" />
                <strong>Real-time usage tracking</strong> and monitoring
              </li>
            </ul>
          </div>

          {/* Current Status */}
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <span className="text-sm text-gray-600 mt-2 block">Checking account status...</span>
            </div>
          ) : accountStatuses.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-900">No Gmail Account Configured</h4>
                  <p className="text-sm text-yellow-800 mt-1">
                    Please add your Gmail account to your .env.local file to start sending emails.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-900">Gmail Account Configured Successfully</h4>
                  <p className="text-sm text-green-800 mt-1">Daily capacity: 450 emails with HTTP-based processing</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
