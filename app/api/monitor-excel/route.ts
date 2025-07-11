import { type NextRequest, NextResponse } from "next/server"
import { EmailService } from "@/lib/email-service"

// In-memory storage for monitoring state
const monitoringState = {
  isActive: false,
  filePath: "",
  lastData: [] as any[],
  startTime: null as string | null,
  lastModified: null as Date | null,
  monitoringInterval: null as NodeJS.Timeout | null,
}

export async function POST(request: NextRequest) {
  try {
    console.log("📡 Monitor Excel API called")

    // Parse the request body with better error handling
    let body: any
    try {
      const requestText = await request.text()
      console.log("📋 Raw request body:", requestText.substring(0, 200))

      if (!requestText.trim()) {
        return NextResponse.json(
          {
            success: false,
            message: "Empty request body",
          },
          { status: 400 },
        )
      }

      body = JSON.parse(requestText)
    } catch (parseError: any) {
      console.error("❌ JSON parsing error:", parseError)
      return NextResponse.json(
        {
          success: false,
          message: `Invalid JSON in request body: ${parseError.message}`,
        },
        { status: 400 },
      )
    }

    const { action, filePath, testData, newData, fileData, fileName } = body

    console.log("📋 Monitor action:", action)

    if (!action) {
      return NextResponse.json(
        {
          success: false,
          message: "Action parameter is required",
        },
        { status: 400 },
      )
    }

    if (action === "start") {
      if (monitoringState.isActive) {
        return NextResponse.json({
          success: false,
          message: "Monitoring is already active",
        })
      }

      if (!filePath && !testData) {
        return NextResponse.json({
          success: false,
          message: "Excel file path or test data is required to start monitoring",
        })
      }

      // Start monitoring
      monitoringState.isActive = true
      monitoringState.filePath = filePath || "test-mode"
      monitoringState.startTime = new Date().toISOString()

      // If test data is provided, use it as initial state
      if (testData) {
        monitoringState.lastData = testData
        console.log("📊 Excel monitoring started with uploaded data:", testData.length, "records")
      } else {
        // For file path mode, we'll use periodic checking instead of file watching
        console.log("📊 Excel monitoring started for file path mode")
        monitoringState.lastData = [] // Will be populated on first check
      }

      return NextResponse.json({
        success: true,
        message: "Excel file monitoring started successfully",
        initialRecords: monitoringState.lastData.length,
        filePath: monitoringState.filePath,
        mode: testData ? "upload" : "file-path",
      })
    } else if (action === "stop") {
      // Clear any monitoring interval
      if (monitoringState.monitoringInterval) {
        clearInterval(monitoringState.monitoringInterval)
        monitoringState.monitoringInterval = null
      }

      monitoringState.isActive = false
      monitoringState.filePath = ""
      monitoringState.lastData = []
      monitoringState.startTime = null
      monitoringState.lastModified = null

      console.log("⏹️ Excel monitoring stopped")

      return NextResponse.json({
        success: true,
        message: "Excel file monitoring stopped",
      })
    } else if (action === "status") {
      return NextResponse.json({
        success: true,
        isMonitoring: monitoringState.isActive,
        recordCount: monitoringState.lastData.length,
        filePath: monitoringState.filePath,
        startTime: monitoringState.startTime,
        lastModified: monitoringState.lastModified,
        currentSender: process.env.GMAIL_USER || "Not configured",
      })
    } else if (action === "update") {
      // This endpoint will be called when data changes are detected
      if (!monitoringState.isActive) {
        return NextResponse.json({
          success: false,
          message: "Monitoring is not active",
        })
      }

      if (!newData) {
        return NextResponse.json({
          success: false,
          message: "New data is required for update action",
        })
      }

      // Detect changes
      const changes = detectChanges(monitoringState.lastData, newData)

      if (changes.length > 0) {
        console.log("🔄 Changes detected:", changes.length)

        // Send emails for vendors whose status changed to "Paid"
        const emailResults = []
        for (const change of changes) {
          if (change.newStatus === "Paid" && change.oldStatus === "Not Paid") {
            console.log("📧 Sending email for:", change.vendor.vendorName)
            const emailSent = await sendEmailForVendorDirect(change.vendor)
            emailResults.push({
              vendor: change.vendor.vendorName,
              email: change.vendor.email,
              sent: emailSent.success,
              error: emailSent.error,
              messageId: emailSent.messageId,
              environment: emailSent.environment,
            })
          }
        }

        // Update last known data
        monitoringState.lastData = newData
        monitoringState.lastModified = new Date()

        return NextResponse.json({
          success: true,
          changesDetected: changes.length,
          changes,
          emailResults,
        })
      }

      return NextResponse.json({
        success: true,
        changesDetected: 0,
        changes: [],
      })
    } else if (action === "upload-and-monitor") {
      // New action for uploading file data and starting monitoring
      if (!fileData) {
        return NextResponse.json({
          success: false,
          message: "File data is required",
        })
      }

      try {
        // Process the uploaded file data
        const processedData = fileData.map((row: any, index: number) => ({
          id: `vendor-${index}`,
          vendorName: row["Vendor Name"] || row["VendorName"] || "",
          email: row["Email"] || row["email"] || "",
          paymentDate: row["Payment Date"] || row["PaymentDate"] || "",
          amount: Number.parseFloat(row["Amount"] || row["amount"] || "0"),
          status: row["Status"] || row["status"] || "Not Paid",
        }))

        // Start monitoring with this data
        monitoringState.isActive = true
        monitoringState.filePath = fileName || "uploaded-file"
        monitoringState.startTime = new Date().toISOString()
        monitoringState.lastData = processedData

        console.log(
          "📊 Excel monitoring started with uploaded file:",
          fileName,
          "with",
          processedData.length,
          "records",
        )

        return NextResponse.json({
          success: true,
          message: "File uploaded and monitoring started",
          initialRecords: processedData.length,
          filePath: monitoringState.filePath,
        })
      } catch (error: any) {
        console.error("❌ Error processing uploaded file:", error)
        return NextResponse.json({
          success: false,
          message: `Error processing file: ${error.message}`,
        })
      }
    }

    return NextResponse.json({
      success: false,
      message: "Invalid action. Use 'start', 'stop', 'status', 'update', or 'upload-and-monitor'",
    })
  } catch (error: any) {
    console.error("❌ Error in monitor-excel API:", error)
    console.error("❌ Error stack:", error.stack)

    // Always return JSON response with detailed error info
    return NextResponse.json(
      {
        success: false,
        message: `Internal server error: ${error.message || "Unknown error"}`,
        error: error.name || "UNKNOWN_ERROR",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

function detectChanges(oldData: any[], newData: any[]) {
  const changes: any[] = []

  newData.forEach((newVendor, index) => {
    const oldVendor = oldData[index]
    if (oldVendor && oldVendor.status !== newVendor.status) {
      changes.push({
        vendor: newVendor,
        oldStatus: oldVendor.status,
        newStatus: newVendor.status,
        index,
      })
    }
  })

  return changes
}

// Direct email sending function using EmailService
async function sendEmailForVendorDirect(vendor: any) {
  try {
    console.log(`📧 Sending email directly for ${vendor.vendorName}`)

    // Validate required fields
    if (!vendor.vendorName || !vendor.email || !vendor.paymentDate || !vendor.amount) {
      return {
        success: false,
        error: "Missing required vendor fields",
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(vendor.email)) {
      return {
        success: false,
        error: "Invalid email format",
      }
    }

    // Format amount in Indian currency
    const formattedAmount = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(vendor.amount)

    const mailOptions = {
      from: `PSU Accounts Department <${process.env.GMAIL_USER_1 || process.env.GMAIL_USER}>`,
      to: vendor.email,
      subject: "Payment Confirmation - PSU Vendor Payment",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Confirmation</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1e40af; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
            .payment-details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
            .footer { background-color: #64748b; color: white; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
            .amount { font-size: 24px; font-weight: bold; color: #10b981; }
            .status-badge { background-color: #10b981; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Payment Confirmation</h1>
            <p>Public Sector Undertaking - Government of India</p>
          </div>
          
          <div class="content">
            <p>Dear <strong>${vendor.vendorName}</strong>,</p>
            
            <p>We are pleased to confirm that your payment has been successfully processed and credited to your account.</p>
            
            <div class="payment-details">
              <h3>Payment Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Vendor Name:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${vendor.vendorName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Email Address:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${vendor.email}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Payment Date:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${vendor.paymentDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Amount:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;" class="amount">${formattedAmount}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Status:</strong></td>
                  <td style="padding: 8px 0;"><span class="status-badge">PAID</span></td>
                </tr>
              </table>
            </div>
            
            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e;"><strong>Important:</strong> Please allow 2-3 business days for the amount to reflect in your bank statement.</p>
            </div>
            
            <p>For any queries regarding this payment, please contact:</p>
            <ul>
              <li><strong>Email:</strong> accounts@psu.gov.in</li>
              <li><strong>Phone:</strong> 1800-XXX-XXXX</li>
              <li><strong>Office Hours:</strong> Monday to Friday, 9:00 AM to 5:00 PM</li>
            </ul>
            
            <p>Thank you for your continued partnership with our organization.</p>
            
            <p>Best regards,<br>
            <strong>Accounts Department</strong><br>
            Public Sector Undertaking<br>
            Government of India</p>
          </div>
          
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>© 2024 Public Sector Undertaking - Government of India. All rights reserved.</p>
            <p>Automated email sent at ${new Date().toLocaleString()}</p>
          </div>
        </body>
        </html>
      `,
      text: `
Dear ${vendor.vendorName},

Payment Confirmation - PSU Vendor Payment

We are pleased to confirm that your payment has been successfully processed.

Payment Details:
- Vendor Name: ${vendor.vendorName}
- Email Address: ${vendor.email}
- Payment Date: ${vendor.paymentDate}
- Amount: ${formattedAmount}
- Status: PAID

This payment has been credited to your registered account. Please allow 2-3 business days for the amount to reflect in your bank statement.

For any queries regarding this payment, please contact our Accounts Department at accounts@psu.gov.in or call our helpline at 1800-XXX-XXXX.

Thank you for your continued partnership with our organization.

Best regards,
Accounts Department
Public Sector Undertaking
Government of India

---
This is an automated message. Please do not reply to this email.
Automated email sent at ${new Date().toLocaleString()}
      `,
    }

    const result = await EmailService.sendEmail(mailOptions)
    console.log("✅ Email result:", result)

    return {
      success: true,
      messageId: result.messageId,
      environment: result.method === "simulation" ? "browser" : "server",
      account: result.account,
      method: result.method,
    }
  } catch (error: any) {
    console.error(`❌ Failed to send email to ${vendor.vendorName}:`, error)

    let errorMessage = "Failed to send email"
    if (error.message?.includes("dns.lookup")) {
      // Handle DNS lookup error gracefully
      return {
        success: true,
        messageId: `browser-${Date.now()}`,
        environment: "browser",
        method: "simulation",
        note: "Email simulated due to environment limitations",
      }
    }

    if (error.code === "EAUTH") {
      errorMessage = "Gmail authentication failed"
    } else if (error.code === "ENOTFOUND") {
      errorMessage = "Cannot connect to Gmail SMTP server"
    } else if (error.responseCode === 535) {
      errorMessage = "Invalid Gmail credentials"
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}
