import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Check server-side environment variables
    const resendConfigured = !!process.env.RESEND_API_KEY
    const baseUrlConfigured = !!process.env.NEXT_PUBLIC_BASE_URL

    // Get partial API key for display (first 10 characters + ...)
    const apiKeyPreview = process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.substring(0, 10) + "..." : null

    return NextResponse.json({
      success: true,
      resendConfigured,
      baseUrlConfigured,
      apiKeyPreview,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error checking config status:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to check configuration status",
      },
      { status: 500 },
    )
  }
}
