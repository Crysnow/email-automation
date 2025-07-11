"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, Mail, Shield, Key, ExternalLink } from "lucide-react"

export function GmailSetupGuide() {
  const openGmailSecurity = () => {
    window.open("https://myaccount.google.com/security", "_blank")
  }

  const openAppPasswords = () => {
    window.open("https://myaccount.google.com/apppasswords", "_blank")
  }

  const openGmail2FA = () => {
    window.open("https://myaccount.google.com/signinoptions/two-step-verification", "_blank")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Mail className="w-5 h-5" />
          <span>Gmail SMTP Setup Guide</span>
          <Badge variant="destructive">Required for Email Sending</Badge>
        </CardTitle>
        <CardDescription>Complete Gmail 2FA and App Password setup to enable email automation</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Step-by-Step Setup */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-3">🚀 Required Setup Steps:</h4>
            <ol className="text-sm text-blue-800 space-y-4 list-decimal list-inside">
              <li>
                <div className="flex items-center justify-between">
                  <div>
                    <strong>Enable 2-Factor Authentication (2FA)</strong>
                    <p className="text-xs text-blue-600 mt-1">Required before creating app passwords</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={openGmail2FA} className="ml-2 bg-transparent">
                    <Shield className="w-3 h-3 mr-1" />
                    Enable 2FA
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </li>

              <li>
                <div className="flex items-center justify-between">
                  <div>
                    <strong>Generate Gmail App Password</strong>
                    <p className="text-xs text-blue-600 mt-1">
                      Select "Mail" as the app and copy the 16-character password
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={openAppPasswords} className="ml-2 bg-transparent">
                    <Key className="w-3 h-3 mr-1" />
                    Create App Password
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </li>

              <li>
                <strong>Update Environment Variables (.env.local):</strong>
                <div className="bg-blue-100 p-3 rounded border text-sm font-mono mt-2">
                  <div>GMAIL_USER=your-psu-email@gmail.com</div>
                  <div>GMAIL_APP_PASSWORD=abcd efgh ijkl mnop</div>
                  <div>NEXT_PUBLIC_BASE_URL=http://localhost:3000</div>
                </div>
              </li>

              <li>
                <strong>Restart your application</strong> to load the new environment variables
              </li>

              <li>
                <strong>Test the email system</strong> using the test email feature below
              </li>
            </ol>
          </div>

          {/* Gmail SMTP Configuration */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">📧 Gmail SMTP Configuration:</h4>
            <div className="text-sm text-green-800 space-y-1">
              <p>
                <strong>SMTP Server:</strong> smtp.gmail.com
              </p>
              <p>
                <strong>Port:</strong> 587 (TLS/STARTTLS)
              </p>
              <p>
                <strong>Security:</strong> TLS enabled
              </p>
              <p>
                <strong>Authentication:</strong> Gmail App Password (16 characters)
              </p>
            </div>
          </div>

          {/* Security Information */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-semibold text-purple-900 mb-2">🔐 Security Best Practices:</h4>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>
                • <strong>Use a dedicated PSU Gmail account</strong> for sending emails
              </li>
              <li>
                • <strong>Never share your app password</strong> - treat it like your Gmail password
              </li>
              <li>
                • <strong>App passwords bypass 2FA</strong> - keep them secure
              </li>
              <li>
                • <strong>You can revoke app passwords</strong> anytime from Google Account settings
              </li>
              <li>
                • <strong>Use descriptive names</strong> when creating app passwords (e.g., "PSU Payment System")
              </li>
            </ul>
          </div>

          {/* Gmail Limits */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-900 mb-1">📊 Gmail Sending Limits:</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>
                    • <strong>500 emails per day</strong> for regular Gmail accounts
                  </li>
                  <li>
                    • <strong>2000 emails per day</strong> for Google Workspace accounts
                  </li>
                  <li>
                    • <strong>100 recipients per email</strong> maximum
                  </li>
                  <li>
                    • <strong>Rate limiting:</strong> Don't send too many emails too quickly
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex space-x-2">
            <Button onClick={openGmailSecurity} className="flex-1">
              <Shield className="w-4 h-4 mr-2" />
              Gmail Security Settings
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
            <Button onClick={openAppPasswords} variant="outline" className="flex-1 bg-transparent">
              <Key className="w-4 h-4 mr-2" />
              Create App Password
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Benefits */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">✅ Benefits of Gmail SMTP:</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>
                <CheckCircle className="w-3 h-3 inline mr-1 text-green-600" />
                No domain ownership required
              </li>
              <li>
                <CheckCircle className="w-3 h-3 inline mr-1 text-green-600" />
                Free to use with existing Gmail account
              </li>
              <li>
                <CheckCircle className="w-3 h-3 inline mr-1 text-green-600" />
                Reliable email delivery with Google's infrastructure
              </li>
              <li>
                <CheckCircle className="w-3 h-3 inline mr-1 text-green-600" />
                Familiar Gmail interface for monitoring sent emails
              </li>
              <li>
                <CheckCircle className="w-3 h-3 inline mr-1 text-green-600" />
                Built-in spam protection and security
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
