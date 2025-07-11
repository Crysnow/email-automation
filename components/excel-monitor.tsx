"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileSpreadsheet, Square, RefreshCw, CheckCircle, Zap } from "lucide-react"
import { useToast } from "@/app/hooks/use-toast"
import * as XLSX from "xlsx"

interface VendorData {
  id: string
  vendorName: string
  email: string
  paymentDate: string
  amount: number
  status: "Not Paid" | "Paid"
}

export function ExcelMonitor() {
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [recordCount, setRecordCount] = useState(0)
  const [uploadedData, setUploadedData] = useState<VendorData[]>([])
  const [fileName, setFileName] = useState("")
  const [lastModified, setLastModified] = useState<string | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  // Check monitoring status on component mount
  useEffect(() => {
    checkMonitoringStatus()
  }, [])

  // Auto-refresh status every 10 seconds when monitoring
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isMonitoring) {
      interval = setInterval(() => {
        checkMonitoringStatus()
      }, 10000) // Check every 10 seconds
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isMonitoring])

  const checkMonitoringStatus = async () => {
    try {
      console.log("🔍 Checking monitoring status...")

      const response = await fetch("/api/monitor-excel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "status" }),
      })

      console.log("📡 Monitor status response:", response.status, response.statusText)

      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ Monitor API returned ${response.status}: ${response.statusText}`)
        console.error("❌ Error response:", errorText)

        // Don't throw error for status checks, just log and continue
        return
      }

      // Check content type
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        console.error("❌ Monitor API returned non-JSON response")
        const textResponse = await response.text()
        console.error("Response text:", textResponse.substring(0, 200))
        return
      }

      // Parse JSON safely
      const result = await response.json()
      console.log("📊 Monitor status result:", result)

      if (result.success) {
        setIsMonitoring(result.isMonitoring)
        setRecordCount(result.recordCount)
        if (result.lastModified) {
          setLastModified(new Date(result.lastModified).toLocaleString())
        }
      } else {
        console.warn("Monitor status check returned success: false", result.message)
      }
    } catch (error: any) {
      console.error("❌ Error checking monitoring status:", error.message)
      // Don't show toast for status check errors to avoid spam
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        console.log("📊 Parsed Excel data:", jsonData.length, "rows")

        const processedData: VendorData[] = jsonData.map((row: any, index) => ({
          id: `vendor-${index}`,
          vendorName: row["Vendor Name"] || row["VendorName"] || "",
          email: row["Email"] || row["email"] || "",
          paymentDate: row["Payment Date"] || row["PaymentDate"] || "",
          amount: Number.parseFloat(row["Amount"] || row["amount"] || "0"),
          status: (row["Status"] || row["status"] || "Not Paid") as "Not Paid" | "Paid",
        }))

        setUploadedData(processedData)
        setFileName(file.name)

        console.log("📤 Sending data to API for monitoring...")

        // Automatically start monitoring with uploaded data
        const response = await fetch("/api/monitor-excel", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "upload-and-monitor",
            fileData: jsonData,
            fileName: file.name,
          }),
        })

        console.log("📡 Upload response:", response.status, response.statusText)

        if (!response.ok) {
          const errorText = await response.text()
          console.error("❌ Upload failed:", response.status, errorText)

          let errorMessage = `HTTP error! status: ${response.status}`
          try {
            const errorJson = JSON.parse(errorText)
            errorMessage = errorJson.message || errorMessage
          } catch (e) {
            // Use the raw error text if JSON parsing fails
            errorMessage = errorText.substring(0, 100) || errorMessage
          }

          throw new Error(errorMessage)
        }

        // Check content type before parsing JSON
        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          const textResponse = await response.text()
          console.error("❌ Upload API returned non-JSON:", textResponse.substring(0, 200))
          throw new Error("Server returned invalid response format")
        }

        const result = await response.json()
        console.log("📥 API response:", result)

        if (result.success) {
          setIsMonitoring(true)
          setRecordCount(result.initialRecords)
          toast({
            title: "File uploaded and monitoring started",
            description: `Monitoring ${result.initialRecords} vendor records from ${file.name}`,
          })
        } else {
          toast({
            title: "Failed to start monitoring",
            description: result.message || "Unknown error occurred",
          })
        }
      } catch (error: any) {
        console.error("❌ Error processing file:", error)
        toast({
          title: "Error processing Excel file",
          description: error.message || "Please ensure the file has the required columns",
        })
      } finally {
        setIsUploading(false)
      }
    }

    reader.onerror = () => {
      setIsUploading(false)
      toast({
        title: "File read error",
        description: "Failed to read the uploaded file",
      })
    }

    reader.readAsArrayBuffer(file)
  }

  const stopMonitoring = async () => {
    try {
      const response = await fetch("/api/monitor-excel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "stop" }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Check content type
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text()
        console.error("❌ Stop API returned non-JSON:", textResponse.substring(0, 200))
        throw new Error("Server returned invalid response format")
      }

      const result = await response.json()

      if (result.success) {
        setIsMonitoring(false)
        setRecordCount(0)
        setLastModified(null)
        setUploadedData([])
        setFileName("")
        toast({
          title: "Excel monitoring stopped",
          description: "No longer watching for file changes",
        })
      } else {
        toast({
          title: "Failed to stop monitoring",
          description: result.message || "Unknown error occurred",
        })
      }
    } catch (error: any) {
      console.error("❌ Error stopping monitoring:", error)
      toast({
        title: "Error",
        description: `Failed to stop Excel monitoring: ${error.message}`,
      })
    }
  }

  const simulateStatusChange = async () => {
    if (!isMonitoring || uploadedData.length === 0) {
      toast({
        title: "Cannot simulate",
        description: "Please upload a file and start monitoring first",
      })
      return
    }

    setIsChecking(true)

    // Find first "Not Paid" vendor and change to "Paid"
    const updatedData = [...uploadedData]
    const notPaidIndex = updatedData.findIndex((vendor) => vendor.status === "Not Paid")

    if (notPaidIndex === -1) {
      toast({
        title: "No changes to simulate",
        description: "All vendors are already marked as 'Paid'",
      })
      setIsChecking(false)
      return
    }

    // Change status to "Paid"
    const oldStatus = updatedData[notPaidIndex].status
    updatedData[notPaidIndex].status = "Paid"

    try {
      console.log("🧪 Simulating status change for:", updatedData[notPaidIndex].vendorName)

      const response = await fetch("/api/monitor-excel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "update",
          newData: updatedData,
        }),
      })

      console.log("📡 Simulation response:", response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ Simulation failed:", errorText)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Check content type
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text()
        console.error("❌ Simulation API returned non-JSON:", textResponse.substring(0, 200))
        throw new Error("Server returned invalid response format")
      }

      const result = await response.json()
      console.log("📥 Simulation result:", result)

      if (result.success) {
        setUploadedData(updatedData)
        setLastModified(new Date().toLocaleString())

        if (result.changesDetected > 0) {
          const emailResults = result.emailResults || []
          const emailsSent = emailResults.filter((r: any) => r.sent).length
          const emailsFailed = emailResults.filter((r: any) => !r.sent).length

          let description = `Changed ${updatedData[notPaidIndex].vendorName} from "${oldStatus}" to "Paid".`

          if (emailsSent > 0) {
            description += ` ✅ ${emailsSent} email(s) processed successfully.`
          }
          if (emailsFailed > 0) {
            description += ` ❌ ${emailsFailed} email(s) failed.`
          }

          // Show detailed error information if any
          const failedEmails = emailResults.filter((r: any) => !r.sent)
          if (failedEmails.length > 0) {
            console.log("❌ Failed emails:", failedEmails)
            failedEmails.forEach((failed: any) => {
              console.log(`❌ ${failed.vendor}: ${failed.error}`)
            })
          }

          toast({
            title: "Status change processed! 🎯",
            description,
          })

          // Show success message for simulated emails
          if (emailsSent > 0) {
            setTimeout(() => {
              toast({
                title: "📧 Email processed successfully!",
                description: `Payment confirmation for ${updatedData[notPaidIndex].vendorName} - Check email dashboard for details`,
              })
            }, 2000)
          }
        } else {
          toast({
            title: "Status changed",
            description: `Changed ${updatedData[notPaidIndex].vendorName} to 'Paid'`,
          })
        }
      } else {
        toast({
          title: "Failed to process change",
          description: result.message || "Unknown error occurred",
        });
      }
    } catch (error: any) {
      console.error("❌ Error simulating status change:", error);
      toast({
        title: "Error",
        description: `Failed to simulate status change: ${error.message}`,
      });
    } finally {
      setIsChecking(false);
    }
  }

  const reprocessCurrentData = async () => {
    if (!isMonitoring || uploadedData.length === 0) {
      toast({
        title: "Cannot reprocess",
        description: "Please upload a file and start monitoring first",
      });
      return;
    }
    setIsChecking(true);

    try {
      const response = await fetch("/api/monitor-excel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "update",
          newData: uploadedData,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Check content type
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text();
        console.error("❌ Reprocess API returned non-JSON:", textResponse.substring(0, 200));
        throw new Error("Server returned invalid response format");
      }

      const result = await response.json();

      if (result.success) {
        if (result.changesDetected > 0) {
          const emailsSent = result.emailResults?.filter((r: any) => r.sent).length || 0;
          toast({
            title: "Changes detected!",
            description: `Found ${result.changesDetected} changes. Emails processed: ${emailsSent}`,
          });
          setLastModified(new Date().toLocaleString());
        } else {
          toast({
            title: "No changes detected",
            description: "Data has not changed since last check",
          });
        }
      } else {
        toast({
          title: "Failed to check for changes",
          description: result.message || "Unknown error occurred",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to reprocess data: ${error.message}`,
      });
    } finally {
      setIsChecking(false);
    }
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileSpreadsheet className="w-5 h-5" />
          <span>Excel File Monitor</span>
        </CardTitle>
        <CardDescription>Upload your Excel file to monitor for payment status changes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* File Upload */}
          <div>
            <Label htmlFor="excel-upload">Upload Excel File</Label>
            <Input
              id="excel-upload"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="mt-1"
              disabled={isMonitoring || isUploading}
            />
            {isUploading && (
              <p className="text-sm text-blue-600 mt-1 flex items-center">
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Processing file...
              </p>
            )}
            {fileName && !isUploading && (
              <p className="text-sm text-green-600 mt-1">
                ✅ Loaded file: <strong>{fileName}</strong> ({uploadedData.length} records)
              </p>
            )}
          </div>

          {/* Status Display */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${isMonitoring ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}
              ></div>
              <span className="text-sm">
                Status: {isMonitoring ? `Monitoring ${recordCount} records` : "Not monitoring"}
              </span>
            </div>
            {lastModified && <span className="text-xs text-gray-500">Last change: {lastModified}</span>}
          </div>

          {/* Control Buttons */}
          <div className="flex space-x-2">
            <Button
              onClick={stopMonitoring}
              disabled={!isMonitoring}
              variant="outline"
              className="flex-1 bg-transparent"
            >
              <Square className="w-4 h-4 mr-2" />
              Stop Monitoring
            </Button>
          </div>

          {/* Action Buttons */}
          {isMonitoring && uploadedData.length > 0 && (
            <div className="space-y-2">
              <Button onClick={simulateStatusChange} disabled={isChecking} variant="secondary" className="w-full">
                <Zap className={`w-4 h-4 mr-2 ${isChecking ? "animate-spin" : ""}`} />
                {isChecking ? "Processing..." : "🧪 Simulate Status Change (Test Email)"}
              </Button>

              <Button
                onClick={reprocessCurrentData}
                disabled={isChecking}
                variant="outline"
                className="w-full bg-transparent"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isChecking ? "animate-spin" : ""}`} />
                {isChecking ? "Checking..." : "Check for Changes"}
              </Button>
            </div>
          )}

          {/* Information Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">How to Use:</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Upload your Excel file with vendor payment data</li>
              <li>Monitoring starts automatically after upload</li>
              <li>Use "🧪 Simulate Status Change" to test email sending</li>
              <li>The system will change the first "Not Paid" vendor to "Paid" and send an email</li>
              <li>Check the email dashboard to see all processed emails</li>
            </ol>
          </div>

          {/* DNS Limitation Notice */}

          {/* File Requirements */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-900 mb-1">Excel File Requirements:</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>
                    • Columns: <strong>Vendor Name, Email, Payment Date, Amount, Status</strong>
                  </li>
                  <li>
                    • Status values: exactly <strong>"Not Paid"</strong> or <strong>"Paid"</strong>
                  </li>
                  <li>• File format: .xlsx or .xls</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
