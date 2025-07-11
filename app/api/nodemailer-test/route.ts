import { NextResponse } from "next/server"

export async function GET() {
  try {
    const nodemailerModule = await import("nodemailer")
    const nodemailer = nodemailerModule.default || nodemailerModule

    if (!nodemailer || !nodemailer.createTransport) {
      throw new Error("createTransport not found")
    }

    return NextResponse.json({
      success: true,
      message: "Nodemailer loaded successfully",
      version: nodemailer.version || "unknown",
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error.message,
    }, { status: 500 })
  }
}
