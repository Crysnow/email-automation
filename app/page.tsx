"use client"

import type React from "react"
import Image from "next/image"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Mail, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { useToast } from "./hooks/use-toast"
import * as XLSX from "xlsx"
import { EmailTest } from "@/components/email-test"
import { ExcelMonitor } from "@/components/excel-monitor"
import { EmailLogDashboard } from "@/components/email-log-dashboard"
import { GmailMultiSetup } from "@/components/gmail-multi-setup"
import { EmailDiagnostic } from "@/components/email-diagnostic"
import { SenderEmailConfig } from "@/components/sender-email-config"

interface VendorData {
  id: string
  vendorName: string
  email: string
  paymentDate: string
  amount: number
  status: "Not Paid" | "Paid"
}

export default function PSUEmailAutomation() {
  const [vendorData, setVendorData] = useState<VendorData[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [emailsSent, setEmailsSent] = useState(0)
  const { toast } = useToast()

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        const processedData: VendorData[] = jsonData.map((row: any, index) => ({
          id: `vendor-${index}`,
          vendorName: row["Vendor Name"] || row["VendorName"] || "",
          email: row["Email"] || row["email"] || "",
          paymentDate: row["Payment Date"] || row["PaymentDate"] || "",
          amount: Number.parseFloat(row["Amount"] || row["amount"] || "0"),
          status: (row["Status"] || row["status"] || "Not Paid") as "Not Paid" | "Paid",
        }))

        setVendorData(processedData)
        toast({
          title: "Excel file uploaded successfully",
          description: `Loaded ${processedData.length} vendor records`,
        })
      } catch (error) {
        toast({
          title: "Error reading Excel file",
          description: "Please ensure the file has columns: Vendor Name, Email, Payment Date, Amount, Status",
        })
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const sendPaymentConfirmationEmail = async (vendor: VendorData) => {
    try {
      console.log("Sending email for vendor:", vendor.vendorName)

      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vendorName: vendor.vendorName,
          email: vendor.email,
          paymentDate: vendor.paymentDate,
          amount: vendor.amount,
          vendorId: vendor.id,
        }),
      })

      console.log("Response status:", response.status)

      const result = await response.json()
      console.log("API response:", result)

      if (result.success) {
        setEmailsSent((prev) => prev + 1)

        const accountInfo = result.account ? ` via ${result.account}` : ""
        toast({
          title: "Payment confirmation sent",
          description: `Email sent to ${vendor.vendorName}${accountInfo}`,
        })
        return true
      } else {
        toast({
          title: "Failed to send email",
          description: result.message || `Could not send email to ${vendor.email}`,
        })
        return false
      }
    } catch (error: any) {
      console.error("Error in sendPaymentConfirmationEmail:", error)

      toast({
        title: "Failed to send email",
        description: `Network error: Could not send email to ${vendor.email}`,
      })
      return false
    }
  }

  const updateVendorStatus = async (vendorId: string, newStatus: "Not Paid" | "Paid") => {
    const updatedData = vendorData.map((vendor) => {
      if (vendor.id === vendorId) {
        const updatedVendor = { ...vendor, status: newStatus }

        // If status changed to "Paid", send email
        if (vendor.status === "Not Paid" && newStatus === "Paid") {
          sendPaymentConfirmationEmail(updatedVendor)
        }

        return updatedVendor
      }
      return vendor
    })

    setVendorData(updatedData)
  }

  const startMonitoring = () => {
    setIsMonitoring(true)
    toast({
      title: "Web monitoring started",
      description: "Manual status changes in the web interface will trigger emails",
    })
  }

  const stopMonitoring = () => {
    setIsMonitoring(false)
    toast({
      title: "Web monitoring stopped",
      description: "Manual email triggering has been disabled",
    })
  }

  const getStatusBadge = (status: string) => {
    if (status === "Paid") {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle className="w-3 h-3 mr-1" />
          Paid
        </Badge>
      )
    }
    return (
      <Badge variant="secondary">
        <Clock className="w-3 h-3 mr-1" />
        Not Paid
      </Badge>
    )
  }

  const totalAmount = vendorData.reduce((sum, vendor) => sum + vendor.amount, 0)
  const paidAmount = vendorData.filter((v) => v.status === "Paid").reduce((sum, vendor) => sum + vendor.amount, 0)
  const pendingCount = vendorData.filter((v) => v.status === "Not Paid").length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SAIL Header with Your Manually Added Logos */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-center space-x-6">
            {/* You may want to add logos here */}
            
            {/* Header Text */}
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Steel Authority of India Limited</h1>
              <h2 className="text-xl md:text-2xl font-semibold text-blue-100 mb-1">
                Automated E-Mail Payment Confirmation System
              </h2>
              <p className="text-blue-200 text-sm md:text-base">A Maharatna Company | Government of India Enterprise</p>
            </div>
          </div>
        </div>
      </div>
          
      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* System Status Banner */}
        <div className="bg-white border border-blue-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">System Status: Online</span>
            </div>
            <div className="text-gray-300">|</div>
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-600">HTTP-Based Email Processing Active</span>
            </div>
            <div className="text-gray-300">|</div>
            <div className="text-sm text-gray-600">Daily Capacity: 450 emails</div>
          </div>
        </div>

        {/* EMERGENCY DEBUG SECTION */}
        <EmailDiagnostic />

        {/* Sender Email Configuration */}
        <SenderEmailConfig />

        {/* Multi-Account Gmail Setup */}
        <GmailMultiSetup />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Mail className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Vendors</p>
                  <p className="text-2xl font-bold text-blue-900">{vendorData.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Emails Sent</p>
                  <p className="text-2xl font-bold text-green-700">{emailsSent}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pending Payments</p>
                  <p className="text-2xl font-bold text-orange-700">{pendingCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <span className="text-purple-600 font-bold text-lg">₹</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold text-purple-700">₹{totalAmount.toLocaleString("en-IN")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Control Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Excel File Monitor - Primary Feature */}
          <div className="lg:col-span-2">
            <ExcelMonitor />
          </div>

          {/* Upload for Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="w-5 h-5" />
                <span>Preview Excel Data</span>
              </CardTitle>
              <CardDescription>
                Upload Excel file to preview data (optional - for display purposes only)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="excel-file">Select Excel File</Label>
                  <Input id="excel-file" type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Manual Web Control */}
          <Card>
            <CardHeader>
              <CardTitle>Manual Web Control</CardTitle>
              <CardDescription>Control manual status changes in the web interface</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${isMonitoring ? "bg-green-500" : "bg-gray-400"}`}></div>
                  <span className="text-sm">
                    Status: {isMonitoring ? "Web Control Active" : "Web Control Inactive"}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={startMonitoring}
                    disabled={isMonitoring || vendorData.length === 0}
                    className="flex-1"
                  >
                    Enable Web Control
                  </Button>
                  <Button
                    onClick={stopMonitoring}
                    disabled={!isMonitoring}
                    variant="outline"
                    className="flex-1 bg-transparent"
                  >
                    Disable Web Control
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Email Test */}
        <EmailTest />

        {/* Email Log Dashboard */}
        <EmailLogDashboard />

        {/* Vendor Data Table */}
        {vendorData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Vendor Payment Data Preview</CardTitle>
              <CardDescription>
                This is a preview of your Excel data. Use Excel File Monitor above for real-time automation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Payment Date</TableHead>
                      <TableHead>Amount (₹)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Manual Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendorData.map((vendor) => (
                      <TableRow key={vendor.id}>
                        <TableCell className="font-medium">{vendor.vendorName}</TableCell>
                        <TableCell>{vendor.email}</TableCell>
                        <TableCell>{vendor.paymentDate}</TableCell>
                        <TableCell>₹{vendor.amount.toLocaleString("en-IN")}</TableCell>
                        <TableCell>{getStatusBadge(vendor.status)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateVendorStatus(vendor.id, vendor.status === "Paid" ? "Not Paid" : "Paid")
                            }
                            disabled={!isMonitoring}
                          >
                            {vendor.status === "Paid" ? "Mark Unpaid" : "Mark Paid"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="bg-white border-t border-gray-200 rounded-lg p-6 text-center">
          <div className="text-sm text-gray-600 space-y-1">
            <p className="font-semibold">Steel Authority of India Limited (SAIL)</p>
            <p>A Maharatna Company under Ministry of Steel, Government of India</p>
            <p className="text-xs text-gray-500">© 2025 SAIL. All rights reserved. | Automated Email System v1.0</p>
          </div>
        </div>
      </div>
    </div>
  )
}