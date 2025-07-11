import { type NextRequest, NextResponse } from "next/server"

// In-memory storage for sender configuration
// In production, you'd store this in a database or secure storage
let senderConfig = {
  email: process.env.GMAIL_USER || "",
  appPassword: process.env.GMAIL_APP_PASSWORD || "",
  displayName: "PSU Accounts Department",
  isConfigured: !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD),
}

export async function GET() {
  try {
    console.log("📧 Getting sender configuration...")

    // Return configuration without exposing the full app password
    return NextResponse.json({
      success: true,
      email: senderConfig.email,
      appPassword: senderConfig.appPassword ? "configured" : "",
      displayName: senderConfig.displayName,
      isConfigured: senderConfig.isConfigured,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("❌ Error getting sender config:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to get sender configuration",
        error: error.message,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("📧 Updating sender configuration...")

    const body = await request.json()
    const { email, appPassword, displayName } = body

    // Validate required fields
    if (!email || !appPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and app password are required",
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

    // Update configuration
    senderConfig = {
      email: email.trim(),
      appPassword: appPassword.trim(),
      displayName: displayName?.trim() || "PSU Accounts Department",
      isConfigured: true,
    }

    console.log("✅ Sender configuration updated:", {
      email: senderConfig.email,
      displayName: senderConfig.displayName,
      hasPassword: !!senderConfig.appPassword,
    })

    return NextResponse.json({
      success: true,
      message: "Sender configuration updated successfully",
      email: senderConfig.email,
      displayName: senderConfig.displayName,
      isConfigured: true,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("❌ Error updating sender config:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update sender configuration",
        error: error.message,
      },
      { status: 500 },
    )
  }
}

