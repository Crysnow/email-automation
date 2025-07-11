import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🔍 Gmail status API called")

    // Check server-side environment variables
    const gmailUser = process.env.GMAIL_USER || null
    const gmailPassword = process.env.GMAIL_APP_PASSWORD || null

    const gmailConfigured = !!gmailUser && gmailUser.length > 0
    const appPasswordConfigured = !!gmailPassword && gmailPassword.length > 0

    console.log("Gmail status check results:", {
      gmailConfigured,
      appPasswordConfigured,
      gmailUser: gmailUser ? `${gmailUser.substring(0, 3)}***@${gmailUser.split("@")[1] || "unknown"}` : null,
      hasGmailEnv: !!process.env.GMAIL_USER,
      hasPasswordEnv: !!process.env.GMAIL_APP_PASSWORD,
    })

    return NextResponse.json({
      success: true,
      gmailConfigured,
      appPasswordConfigured,
      gmailUser,
      timestamp: new Date().toISOString(),
      status: "Configuration check completed successfully",
      debug: {
        hasGmailEnv: !!process.env.GMAIL_USER,
        hasPasswordEnv: !!process.env.GMAIL_APP_PASSWORD,
        gmailLength: gmailUser?.length || 0,
        passwordLength: gmailPassword?.length || 0,
      },
    })
  } catch (error: any) {
    console.error("❌ Error in Gmail status check:", error)

    return NextResponse.json({
      success: false,
      gmailConfigured: false,
      appPasswordConfigured: false,
      gmailUser: null,
      timestamp: new Date().toISOString(),
      status: "Configuration check failed",
      error: error.message || "Unknown error occurred",
    })
  }
}
