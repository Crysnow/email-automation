import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("🧪 Testing sender configuration...")

    const body = await request.json()
    const { email, appPassword, displayName } = body

    // Validate required fields
    if (!email || !appPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and app password are required for testing",
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

    // Validate app password format
    const cleanPassword = appPassword.replace(/\s/g, "")
    if (cleanPassword.length < 10 || cleanPassword.length > 20) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid app password format (should be 10-20 characters)",
        },
        { status: 400 },
      )
    }

    try {
      // Try to test the connection with nodemailer
      console.log("🔍 Testing SMTP connection...")

      // Import nodemailer dynamically
      const nodemailerModule = await import("nodemailer")
      const nodemailer = nodemailerModule.default || nodemailerModule

      if (!nodemailer || !nodemailer.createTransporter) {
        throw new Error("Nodemailer not available - using simulation mode")
      }

      const transporter = nodemailer.createTransporter({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: email,
          pass: appPassword,
        },
        tls: {
          rejectUnauthorized: false,
        },
      })

      // Verify the connection
      await transporter.verify()

      console.log("✅ SMTP connection test successful")

      return NextResponse.json({
        success: true,
        message: "Gmail SMTP connection successful",
        method: "smtp",
        details: {
          email: email,
          displayName: displayName,
          server: "smtp.gmail.com:587",
          security: "TLS",
          status: "verified",
        },
        timestamp: new Date().toISOString(),
      })
    } catch (smtpError: any) {
      console.log("⚠️ SMTP test failed:", smtpError.message)

      // Provide detailed error information
      let errorMessage = "SMTP connection failed"
      let errorCode = "SMTP_ERROR"

      if (smtpError.code === "EAUTH") {
        errorMessage = "Gmail authentication failed. Please check your app password."
        errorCode = "AUTH_ERROR"
      } else if (smtpError.code === "ENOTFOUND") {
        errorMessage = "Cannot connect to Gmail SMTP server. Check your internet connection."
        errorCode = "CONNECTION_ERROR"
      } else if (smtpError.responseCode === 535) {
        errorMessage = "Invalid Gmail credentials. Please verify your email and app password."
        errorCode = "CREDENTIALS_ERROR"
      } else if (smtpError.message?.includes("nodemailer")) {
        errorMessage = "SMTP not available in this environment - will use simulation mode"
        errorCode = "ENVIRONMENT_LIMITATION"
      }

      // If it's just an environment limitation, return success with warning
      if (errorCode === "ENVIRONMENT_LIMITATION") {
        return NextResponse.json({
          success: true,
          message: "Configuration validated - SMTP will use simulation mode",
          method: "simulation",
          details: {
            email: email,
            displayName: displayName,
            status: "simulation_mode",
            reason: "Environment limitations",
          },
          warning: "Real SMTP not available - emails will be simulated",
          timestamp: new Date().toISOString(),
        })
      }

      return NextResponse.json(
        {
          success: false,
          message: errorMessage,
          error: errorCode,
          details: {
            email: email,
            originalError: smtpError.message,
            code: smtpError.code,
            responseCode: smtpError.responseCode,
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 },
      )
    }
  } catch (error: any) {
    console.error("❌ Error testing sender config:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to test sender configuration",
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
