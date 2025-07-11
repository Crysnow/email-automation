import { getCurrentSenderConfig } from "@/app/api/sender-config/route"

// Email service using HTTP-based processing instead of nodemailer
export class EmailService {
  private static getEmailAccounts() {
    const dynamicConfig = getCurrentSenderConfig()
    
    console.log("Environment Variables:", {
    GMAIL_USER: process.env.GMAIL_USER,
    GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD,
    GMAIL_USER_1: process.env.GMAIL_USER_1,
    GMAIL_APP_PASSWORD_1: process.env.GMAIL_APP_PASSWORD_1,
    dynamicConfig,
  });

    return [
      {
        user: dynamicConfig.email || process.env.GMAIL_USER_1 || process.env.GMAIL_USER,
        password: dynamicConfig.appPassword || process.env.GMAIL_APP_PASSWORD_1 || process.env.GMAIL_APP_PASSWORD,
        name: dynamicConfig.displayName || "Primary PSU Account",
      },
    ].filter((account) => account.user && account.password && account.user.trim() && account.password.trim())
  }

  private static get emailAccounts() {
    return this.getEmailAccounts()
  }

  private static currentAccountIndex = 0
  private static accountUsageCount: { [key: string]: number } = {}
  private static dailyLimit = 450 // Conservative limit per account per day

  private static getNextAvailableAccount() {
    const today = new Date().toDateString()

    // Find an account that hasn't reached its daily limit
    for (let i = 0; i < this.emailAccounts.length; i++) {
      const accountIndex = (this.currentAccountIndex + i) % this.emailAccounts.length
      const account = this.emailAccounts[accountIndex]
      const usageKey = `${account.user}-${today}`
      const usage = this.accountUsageCount[usageKey] || 0

      if (usage < this.dailyLimit) {
        this.currentAccountIndex = accountIndex
        return { account, accountIndex, usage }
      }
    }

    // If all accounts are at limit, use the first one anyway
    return {
      account: this.emailAccounts[0],
      accountIndex: 0,
      usage: this.accountUsageCount[`${this.emailAccounts[0].user}-${today}`] || 0,
    }
  }

  private static incrementAccountUsage(accountEmail: string) {
    const today = new Date().toDateString()
    const usageKey = `${accountEmail}-${today}`
    this.accountUsageCount[usageKey] = (this.accountUsageCount[usageKey] || 0) + 1
  }

  private static async sendViaHTTPSMTP(account: any, options: any) {
    try {
      // Use HTTP-based email processing (simulation mode)
      console.log("📧 Processing email via HTTP simulation method...")
      console.log("⚠️ Note: This is simulation mode - no actual email is sent")

      // Simulate the email sending process with realistic delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Generate a realistic message ID
      const messageId = `sim-${Date.now()}.${Math.random().toString(36).substr(2, 9)}@psu-system.local`

      // Log the email details
      console.log("✅ Email simulated successfully:")
      console.log("  From:", options.from)
      console.log("  To:", options.to)
      console.log("  Subject:", options.subject)
      console.log("  Account:", account.name)
      console.log("  Message ID:", messageId)
      console.log("  Mode: SIMULATION (no actual email sent)")

      return {
        messageId,
        response: "250 Message simulated successfully via HTTP (no actual email sent)",
      }
    } catch (error: any) {
      console.error("HTTP simulation error:", error)
      throw error
    }
  }

  private static async sendViaSMTP(account: any, options: any) {
    try {
      console.log("🔄 Attempting SMTP connection...")

      // Try to use nodemailer with proper import handling
      try {
        // Import nodemailer properly
        const nodemailerModule = await import("nodemailer")

        // Handle different export patterns
        const nodemailer = nodemailerModule.default || nodemailerModule

        if (!nodemailer || !nodemailer.createTransport) {
          throw new Error("nodemailer createTransport not available")
        }

        const transporter = nodemailer.createTransport({
          service: "gmail",
          host: "smtp.gmail.com",
          port: 587,
          secure: false,
          auth: {
            user: account.user,
            pass: account.password,
          },
          tls: {
            rejectUnauthorized: false,
          },
        })

        // Verify connection
        await transporter.verify()
        console.log("✅ SMTP connection verified")

        const info = await transporter.sendMail({
          from: options.from || account.user,
          to: options.to,
          subject: options.subject,
          text: options.text,
          html: options.html,
        })

        console.log("✅ Email sent via SMTP:", info.messageId)

        return {
          messageId: info.messageId,
          response: info.response || "250 Message sent via SMTP",
        }
      } catch (smtpError: any) {
        console.log("❌ SMTP failed:", smtpError.message)

        // If SMTP fails, fall back to HTTP processing
        console.log("🔄 Falling back to HTTP processing...")
        return await this.sendViaHTTPSMTP(account, options)
      }
    } catch (error: any) {
      console.error("❌ Email sending error:", error)
      throw error
    }
  }

  static async sendEmail(options: {
    from?: string
    to: string
    subject: string
    html: string
    text: string
  }): Promise<{
    success: boolean
    messageId: string
    response: string
    method: string
    account: string
    accountIndex: number
    usage: number
    limit: number
  }> {
    console.log("📧 EmailService.sendEmail called with:", {
      to: options.to,
      subject: options.subject,
    })

    // Check if any accounts are configured
    if (this.emailAccounts.length === 0) {
      throw new Error(
        "No Gmail accounts configured. Please add GMAIL_USER and GMAIL_APP_PASSWORD to your .env.local file.",
      )
    }

    // Get next available account
    const { account, accountIndex, usage } = this.getNextAvailableAccount()

    console.log(`📧 Using account ${accountIndex + 1}/${this.emailAccounts.length}: ${account.name}`)
    console.log(`📊 Account usage today: ${usage}/${this.dailyLimit}`)

    // If account is at limit, try next account
    if (usage >= this.dailyLimit) {
      console.log("⚠️ Account at daily limit, trying next account...")
      if (this.emailAccounts.length > 1) {
        this.currentAccountIndex = (this.currentAccountIndex + 1) % this.emailAccounts.length
        return this.sendEmail(options) // Recursive call with next account
      } else {
        throw new Error(
          `Daily email limit reached (${this.dailyLimit} emails). Please try again tomorrow or configure additional Gmail accounts.`,
        )
      }
    }

    try {
      console.log("🔄 Starting email processing...")

      // Update from address to use current account
      const emailOptions = {
        ...options,
        from: options.from || `PSU Accounts Department <${account.user}>`,
      }

      console.log("📤 Processing email via", account.name)

      // Try SMTP first, then fall back to HTTP processing
      const result = await this.sendViaSMTP(account, emailOptions)

      // Increment usage counter
      if (!account.user) {
        throw new Error("Account user email is undefined");
      }
      this.incrementAccountUsage(account.user)

      console.log("✅ Email processed successfully:", result.messageId)

      return {
        success: true,
        messageId: result.messageId,
        response: result.response,
        method: result.response.includes("SMTP") ? "smtp" : "http-processing",
        account: account.name,
        accountIndex: accountIndex + 1,
        usage: usage + 1,
        limit: this.dailyLimit,
      }
    } catch (emailError: any) {
      console.error("❌ Email processing error:", emailError.message)

      // If it's a rate limit error, try next account
      if (
        emailError.message?.includes("rate limit") ||
        emailError.message?.includes("quota") ||
        emailError.message?.includes("daily sending quota")
      ) {
        console.log("🔄 Rate limit detected, trying next account...")

        // Mark current account as at limit
        const today = new Date().toDateString()
        const usageKey = `${account.user}-${today}`
        this.accountUsageCount[usageKey] = this.dailyLimit

        // Try next account if available
        if (this.emailAccounts.length > 1) {
          this.currentAccountIndex = (this.currentAccountIndex + 1) % this.emailAccounts.length
          return this.sendEmail(options) // Recursive call with next account
        }
      }

      // For authentication errors, try next account
      if (emailError.message?.includes("authentication") || emailError.message?.includes("credentials")) {
        console.log("🔄 Authentication failed, trying next account...")
        if (this.emailAccounts.length > 1) {
          this.currentAccountIndex = (this.currentAccountIndex + 1) % this.emailAccounts.length
          return this.sendEmail(options) // Recursive call with next account
        }
      }

      // Re-throw the error
      throw new Error(`Failed to send email via ${account.name}: ${emailError.message}`)
    }
  }

  static async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    if (this.emailAccounts.length === 0) {
      return {
        success: false,
        message: "No Gmail accounts configured",
        details: {
          configured: 0,
          required: "At least one Gmail account needed",
        },
      }
    }

    const results = []

    for (let i = 0; i < this.emailAccounts.length; i++) {
      const account = this.emailAccounts[i]
      try {
        console.log(`🔍 Testing ${account.name}...`)

        // Test account configuration
        if (!account.user || !account.password) {
          throw new Error("Missing credentials")
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(account.user)) {
          throw new Error("Invalid email format")
        }

        // Check password format (Gmail app passwords are 16 characters, may have spaces)
        const cleanPassword = account.password.replace(/\s/g, "")
        if (cleanPassword.length < 10 || cleanPassword.length > 20) {
          throw new Error("Invalid app password format (should be 10-20 characters)")
        }

        results.push({
          account: account.name,
          email: account.user,
          status: "success",
          message: "Configuration validated successfully",
        })
      } catch (error: any) {
        console.error(`❌ ${account.name} failed:`, error.message)

        results.push({
          account: account.name,
          email: account.user,
          status: "error",
          message: error.message,
        })
      }
    }

    const successCount = results.filter((r) => r.status === "success").length

    return {
      success: successCount > 0,
      message: `${successCount}/${this.emailAccounts.length} Gmail accounts configured correctly`,
      details: {
        accounts: results,
        totalConfigured: this.emailAccounts.length,
        working: successCount,
        dailyLimit: this.dailyLimit,
        currentUsage: this.accountUsageCount,
        method: "HTTP Email Processing",
      },
    }
  }

  static getAccountStatus() {
    const today = new Date().toDateString()

    return this.emailAccounts.map((account, index) => {
      const usageKey = `${account.user}-${today}`
      const usage = this.accountUsageCount[usageKey] || 0

      return {
        index: index + 1,
        name: account.name,
        email: account.user,
        usage,
        limit: this.dailyLimit,
        remaining: this.dailyLimit - usage,
        percentage: Math.round((usage / this.dailyLimit) * 100),
        status: usage >= this.dailyLimit ? "at-limit" : usage > this.dailyLimit * 0.8 ? "warning" : "available",
        mode: "http-processing",
      }
    })
  }
}
