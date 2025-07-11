export const runtime = 'nodejs'
import { type NextRequest, NextResponse } from "next/server"
import { EmailService } from "@/lib/email-service"

export async function POST(request: NextRequest) {
  try {
    console.log("🧪 Test email API called")

    // Check if Gmail credentials are configured
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Gmail credentials not configured. Please add GMAIL_USER and GMAIL_APP_PASSWORD to your .env.local file.",
        },
        { status: 500 },
      )
    }

    console.log("✅ Gmail credentials found for:", process.env.GMAIL_USER)

    const body = await request.json()
    const { testEmail } = body

    if (!testEmail) {
      return NextResponse.json({ success: false, message: "Test email address is required" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(testEmail)) {
      return NextResponse.json({ success: false, message: "Invalid email format" }, { status: 400 })
    }

    console.log(`🧪 Sending test email to: ${testEmail}`)

    try {
      // Test connection first
      console.log("🔍 Testing connection...")
      const connectionTest = await EmailService.testConnection()
      console.log("Connection test result:", connectionTest)

      const mailOptions = {
        from: `PSU Payment System <${process.env.GMAIL_USER}>`,
        to: testEmail,
        subject: "PSU Email Automation - Test Email ✅",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #1e40af; color: white; padding: 20px; text-align: center; border-radius: 8px; }
              .content { padding: 20px; }
              .success { color: #10b981; }
              .gmail-info { background-color: #e0f2fe; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0284c7; }
              .env-info { background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>✅ Email System Test Successful</h1>
            </div>
            <div class="content">
              <p>Congratulations! Your PSU Email Automation system is working.</p>
              <p>This test email confirms that:</p>
              <ul>
                <li class="success">✅ Email system is functional</li>
                <li class="success">✅ Email templates are rendering correctly</li>
                <li class="success">✅ Gmail credentials are configured</li>
                <li class="success">✅ System is ready for use</li>
              </ul>
              <p><strong>You can now start using the automated payment confirmation system.</strong></p>
              
              <div class="gmail-info">
                <p style="margin: 0; color: #0c4a6e;"><strong>📧 Sender:</strong> ${process.env.GMAIL_USER}</p>
                <p style="margin: 5px 0 0 0; font-size: 12px; color: #0369a1;">Email sent at ${new Date().toLocaleString()}</p>
              </div>

              <div class="env-info">
                <p style="margin: 0; color: #1e40af;"><strong>🔧 Method:</strong> ${connectionTest.details?.method || "Email Service"}</p>
                <p style="margin: 5px 0 0 0; font-size: 12px; color: #3b82f6;">Status: ${connectionTest.message}</p>
              </div>
              
              <p>Test sent to: <strong>${testEmail}</strong></p>
            </div>
          </body>
          </html>
        `,
        text: `
Email System Test Successful

Congratulations! Your PSU Email Automation system is working.

This test email confirms that:
- ✅ Email system is functional
- ✅ Email templates are rendering correctly  
- ✅ Gmail credentials are configured
- ✅ System is ready for use

You can now start using the automated payment confirmation system.

Sender: ${process.env.GMAIL_USER}
Email sent at ${new Date().toLocaleString()}
Method: ${connectionTest.details?.method || "Email Service"}
Status: ${connectionTest.message}
Test sent to: ${testEmail}
        `,
      }

      console.log("🚀 Calling EmailService.sendEmail for test...")
      const result = await EmailService.sendEmail(mailOptions)
      console.log("✅ Test email result:", result)

      const responseMessage =
        result.method === "simulation"
          ? "Test email simulated successfully (Network limitations)"
          : "Test email sent successfully via Gmail SMTP"

      return NextResponse.json({
        success: true,
        message: responseMessage,
        messageId: result.messageId,
        method: result.method,
        connectionTest: connectionTest,
        note: result.note,
      })
    } catch (error: any) {
      console.error("❌ Test email error:", error)

      let errorMessage = "Failed to send test email"
      if (error.code === "EAUTH") {
        errorMessage = "Gmail authentication failed. Please check your app password."
      } else if (error.code === "ENOTFOUND") {
        errorMessage = "Cannot connect to Gmail SMTP server. Check your internet connection."
      } else if (error.responseCode === 535) {
        errorMessage = "Invalid Gmail credentials. Please verify your email and app password."
      }

      return NextResponse.json(
        {
          success: false,
          message: errorMessage,
          error: error.code || "EMAIL_ERROR",
          details: error.message,
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("❌ Error in test email API:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to send test email",
        error: error.code || "UNKNOWN_ERROR",
      },
      { status: 500 },
    )
  }
}
