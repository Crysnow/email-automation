"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Mail, CheckCircle, XCircle, RefreshCw, Clock } from "lucide-react"

interface EmailLogEntry {
  id: string
  timestamp: string
  vendorName: string
  vendorEmail: string
  status: "sent" | "failed"
  messageId?: string
  error?: string
}

interface EmailLogData {
  emailLog: EmailLogEntry[]
  totalEmails: number
  sentEmails: number
  failedEmails: number
  currentSender: string
}

export function EmailLogDashboard() {
  const [emailData, setEmailData] = useState<EmailLogData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<string | null>(null)

  useEffect(() => {
    fetchEmailLogs()
  }, [])

  const fetchEmailLogs = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/send-email", {
        method: "GET",
      })

      const result = await response.json()
      if (result.success) {
        setEmailData(result)
        setLastRefresh(new Date().toLocaleTimeString())
      }
    } catch (error) {
      console.error("Error fetching email logs:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    if (status === "sent") {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle className="w-3 h-3 mr-1" />
          Sent
        </Badge>
      )
    }
    return (
      <Badge variant="destructive">
        <XCircle className="w-3 h-3 mr-1" />
        Failed
      </Badge>
    )
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Mail className="w-5 h-5" />
            <span>Email Delivery Dashboard</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchEmailLogs} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </CardTitle>
        <CardDescription>Track all payment confirmation emails sent via Gmail SMTP</CardDescription>
      </CardHeader>
      <CardContent>
        {emailData ? (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Mail className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Emails</p>
                      <p className="text-2xl font-bold">{emailData.totalEmails}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Successfully Sent</p>
                      <p className="text-2xl font-bold text-green-600">{emailData.sentEmails}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <XCircle className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Failed</p>
                      <p className="text-2xl font-bold text-red-600">{emailData.failedEmails}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gmail Sender Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">📧 Gmail SMTP Configuration:</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p>
                  <strong>Sender:</strong> PSU Accounts Department &lt;{emailData.currentSender}&gt;
                </p>
                <p>
                  <strong>Service:</strong> Gmail SMTP (smtp.gmail.com:587)
                </p>
                <p>
                  <strong>Authentication:</strong> App Password
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  ✅ No domain verification required - can send to any email address
                </p>
              </div>
            </div>

            {/* Email Log Table */}
            {emailData.emailLog.length > 0 ? (
              <div>
                <h4 className="font-semibold mb-3">Recent Email Activity</h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Vendor Name</TableHead>
                        <TableHead>Email Address</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Message ID</TableHead>
                        <TableHead>Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {emailData.emailLog.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="text-sm">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span>{formatTimestamp(entry.timestamp)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{entry.vendorName}</TableCell>
                          <TableCell>{entry.vendorEmail}</TableCell>
                          <TableCell>{getStatusBadge(entry.status)}</TableCell>
                          <TableCell className="text-xs text-gray-500">
                            {entry.messageId ? (
                              <code className="bg-gray-100 px-1 py-0.5 rounded">{entry.messageId}</code>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-red-600">{entry.error ? entry.error : "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No emails sent yet</p>
                <p className="text-sm">Upload an Excel file and test the system to see email logs here</p>
              </div>
            )}

            {lastRefresh && <div className="text-xs text-gray-500 text-center">Last refreshed: {lastRefresh}</div>}
          </div>
        ) : (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading email logs...</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
