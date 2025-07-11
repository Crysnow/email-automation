import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🔍 Checking nodemailer availability...")

    let nodemailerStatus = {
      available: false,
      version: null,
      error: null,
      method: "unknown",
    }

    try {
      // Try to import nodemailer
      const nodemailerModule = await import("nodemailer")
      const nodemailer = nodemailerModule.default || nodemailerModule

      if (nodemailer && nodemailer.createTransporter) {
        nodemailerStatus = {
          available: true,
          version: nodemailer.version || "unknown",
          error: null,
          method: "dynamic-import",
        }
      } else {
        nodemailerStatus = {
          available: false,
          version: null,
          error: "createTransporter not found",
          method: "dynamic-import",
        }
      }
    } catch (importError: any) {
      nodemailerStatus = {
        available: false,
        version: null,
        error: importError.message,
        method: "dynamic-import",
      }
    }

    const message = nodemailerStatus.available
      ? "Nodemailer is available and ready to use"
      : `Nodemailer not available: ${nodemailerStatus.error}`

    return NextResponse.json({
      success: true,
      available: nodemailerStatus.available,
      message,
      details: nodemailerStatus,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("❌ Error checking nodemailer:", error)

    return NextResponse.json({
      success: false,
      available: false,
      message: "Failed to check nodemailer availability",
      error: error.message,
      timestamp: new Date().toISOString(),
    })
  }
}
