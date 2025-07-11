import { type NextRequest, NextResponse } from "next/server"
import { EmailService } from "@/lib/email-service"

// Email tracking storage (in production, you'd use a database)
const emailLog: Array<{
  id: string
  timestamp: string
  vendorName: string
  vendorEmail: string
  status: "sent" | "failed"
  messageId?: string
  error?: string
  method?: string
}> = []

export async function POST(request: NextRequest) {
  try {
    console.log("📧 Send email API called")

    const body = await request.json()
    const { vendorName, email, paymentDate, amount, vendorId } = body

    console.log("📋 Email request data:", { vendorName, email, paymentDate, amount, vendorId })

    // Validate required fields
    if (!vendorName || !email || !paymentDate || !amount) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields: vendorName, email, paymentDate, and amount are required",
        },
        { status: 400 },
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email format",
        },
        { status: 400 },
      )
    }

    // Format amount in Indian currency
    const formattedAmount = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)

    console.log(`📧 Preparing to send payment confirmation to: ${email} for vendor: ${vendorName}`)

    // Create email log entry
    const logEntry: {
      id: string
      timestamp: string
      vendorName: string
      vendorEmail: string
      status: "sent" | "failed"
      messageId?: string
      error?: string
      method?: string
    } = {
      id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      vendorName,
      vendorEmail: email,
      status: "failed",
    }

    try {
      const mailOptions = {
        from: `Sail Finance Department <${process.env.GMAIL_USER_1 || process.env.GMAIL_USER}>`,
        to: email,
        subject: "Payment Confirmation - SAIL Party Payment",
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
              <p>Steel Authority of India Limited - Government of India</p>
            </div>
            
            <div class="content">
              <p>Dear <strong>${vendorName}</strong>,</p>
              
              <p>We are pleased to confirm that your payment has been successfully processed and credited to your account.</p>
              
              <div class="payment-details">
                <h3>Payment Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Vendor Name:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${vendorName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Email Address:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${email}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Payment Date:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${paymentDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Amount:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;" class="amount">${formattedAmount}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;"><strong>Status:</strong></td>
                    <td style="padding: 8px 0;"><span class="status-badge">PAID</span></td>
                  </tr>
                  ${vendorId ? `<tr><td style="padding: 8px 0;"><strong>Reference ID:</strong></td><td style="padding: 8px 0;">${vendorId}</td></tr>` : ""}
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
              <strong>Finance Department</strong><br>
              Steel Refractory of India Limited<br>
              Government of India</p>
            </div>
            
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>© 2024 Steel Refractory of India Limited - Government of India. All rights reserved.</p>
              <p>Email sent at ${new Date().toLocaleString()}</p>
            </div>
          </body>
          </html>
        `,
        text: `
Dear ${vendorName},

Payment Confirmation - SAIL Vendor Payment

We are pleased to confirm that your payment has been successfully processed.

Payment Details:
- Vendor Name: ${vendorName}
- Email Address: ${email}
- Payment Date: ${paymentDate}
- Amount: ${formattedAmount}
- Status: PAID
${vendorId ? `- Reference ID: ${vendorId}` : ""}

This payment has been credited to your registered account. Please allow 2-3 business days for the amount to reflect in your bank statement.

For any queries regarding this payment, please contact our Finance Department at accounts@psu.gov.in or call our helpline at 1800-XXX-XXXX.

Thank you for your continued partnership with our organization.

Best regards,
Finance Department
Steel Authority of India Limited
Government of India

---
This is an automated message. Please do not reply to this email.
Email sent at ${new Date().toLocaleString()}
        `,
      }

      console.log("🚀 Calling EmailService.sendEmail...")
      const result = await EmailService.sendEmail(mailOptions)
      console.log("✅ EmailService result:", result)

      // Update log entry with success
      logEntry.status = "sent"
      logEntry.messageId = result.messageId
      logEntry.method = result.method
      emailLog.push(logEntry)

      const responseMessage =
        result.method === "simulation"
          ? `Payment confirmation simulated for ${vendorName} (Network limitations)`
          : `Payment confirmation email sent to ${vendorName} via ${result.account || "Gmail SMTP"}`

      return NextResponse.json({
        success: true,
        message: responseMessage,
        messageId: result.messageId,
        method: result.method,
        account: result.account,
        accountIndex: result.accountIndex,
        usage: result.usage,
        limit: result.limit,
        logEntry,
        // note: result.note, // Removed because 'note' does not exist on result
      })
    } catch (emailError: any) {
      console.error("❌ Email service error:", emailError)

      let errorMessage = "Failed to send email"
      if (emailError.code === "EAUTH") {
        errorMessage = "Gmail authentication failed. Please check your app password."
      } else if (emailError.code === "ENOTFOUND") {
        errorMessage = "Cannot connect to Gmail SMTP server."
      } else if (emailError.responseCode === 535) {
        errorMessage = "Invalid Gmail credentials."
      }

      logEntry.status = "failed"
      logEntry.error = errorMessage
      emailLog.push(logEntry)

      return NextResponse.json(
        {
          success: false,
          message: errorMessage,
          error: emailError.code || "EMAIL_ERROR",
          details: emailError.message,
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("❌ Unexpected error in send-email API:", error)

    return NextResponse.json(
      {
        success: false,
        message: `Internal server error: ${error.message || "Unknown error"}`,
      },
      { status: 500 },
    )
  }
}

// GET endpoint to retrieve email logs
export async function GET() {
  return NextResponse.json({
    success: true,
    emailLog: emailLog.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    totalEmails: emailLog.length,
    sentEmails: emailLog.filter((e) => e.status === "sent").length,
    failedEmails: emailLog.filter((e) => e.status === "failed").length,
    currentSender: process.env.GMAIL_USER || "Not configured",
  })
}
