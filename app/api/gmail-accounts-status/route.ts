import { NextResponse } from "next/server"
import { EmailService } from "@/lib/email-service"

export async function GET() {
  try {
    console.log("🔍 Gmail accounts status API called")

    // Get account statuses from EmailService
    const accountStatuses = EmailService.getAccountStatus()

    return NextResponse.json({
      success: true,
      accounts: accountStatuses,
      totalAccounts: accountStatuses.length,
      totalDailyCapacity: accountStatuses.length * 450,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("❌ Error checking Gmail accounts status:", error)

    return NextResponse.json({
      success: false,
      accounts: [],
      totalAccounts: 0,
      totalDailyCapacity: 0,
      error: error.message || "Unknown error occurred",
      timestamp: new Date().toISOString(),
    })
  }
}
