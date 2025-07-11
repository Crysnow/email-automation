interface PaymentConfirmationProps {
  vendorName: string
  paymentDate: string
  amount: number
  vendorId: string
}

export function generatePaymentConfirmationHTML({
  vendorName,
  paymentDate,
  amount,
  vendorId,
}: PaymentConfirmationProps): string {
  const formattedAmount = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount)

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Confirmation</title>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 0; 
          background-color: #f5f5f5;
        }
        .container { background-color: white; margin: 20px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { 
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); 
          color: white; 
          padding: 30px 20px; 
          text-align: center; 
        }
        .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; font-size: 16px; }
        .content { padding: 40px 30px; }
        .payment-details { 
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); 
          padding: 25px; 
          border-radius: 12px; 
          margin: 25px 0; 
          border-left: 5px solid #10b981; 
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        .payment-details h3 { margin-top: 0; color: #065f46; font-size: 20px; }
        .details-table { width: 100%; border-collapse: collapse; }
        .details-table td { 
          padding: 12px 0; 
          border-bottom: 1px solid #d1fae5; 
          vertical-align: top;
        }
        .details-table td:first-child { font-weight: 600; color: #374151; width: 40%; }
        .amount { font-size: 28px; font-weight: bold; color: #10b981; }
        .status-badge { 
          background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
          color: white; 
          padding: 6px 16px; 
          border-radius: 25px; 
          font-size: 14px; 
          font-weight: 600; 
          display: inline-block;
        }
        .notice-box { 
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); 
          border: 1px solid #f59e0b; 
          border-radius: 12px; 
          padding: 20px; 
          margin: 25px 0; 
        }
        .notice-box p { margin: 0; color: #92400e; font-weight: 500; }
        .contact-info { 
          background-color: #f8fafc; 
          padding: 20px; 
          border-radius: 12px; 
          margin: 25px 0; 
        }
        .contact-info ul { margin: 10px 0; padding-left: 0; list-style: none; }
        .contact-info li { padding: 5px 0; }
        .footer { 
          background: linear-gradient(135deg, #64748b 0%, #475569 100%); 
          color: white; 
          padding: 25px; 
          text-align: center; 
          font-size: 14px; 
        }
        .footer p { margin: 5px 0; opacity: 0.9; }
        @media (max-width: 600px) {
          .container { margin: 10px; }
          .content { padding: 25px 20px; }
          .header { padding: 25px 15px; }
          .header h1 { font-size: 24px; }
          .amount { font-size: 24px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Payment Confirmation</h1>
          <p>Public Sector Undertaking - Government of India</p>
        </div>
        
        <div class="content">
          <p>Dear <strong>${vendorName}</strong>,</p>
          
          <p>We are pleased to confirm that your payment has been successfully processed and credited to your account.</p>
          
          <div class="payment-details">
            <h3>Payment Details</h3>
            <table class="details-table">
              <tr>
                <td>Vendor Name:</td>
                <td>${vendorName}</td>
              </tr>
              <tr>
                <td>Payment Date:</td>
                <td>${paymentDate}</td>
              </tr>
              <tr>
                <td>Amount:</td>
                <td class="amount">${formattedAmount}</td>
              </tr>
              <tr>
                <td>Status:</td>
                <td><span class="status-badge">PAID</span></td>
              </tr>
              <tr>
                <td>Reference ID:</td>
                <td>${vendorId}</td>
              </tr>
            </table>
          </div>
          
          <div class="notice-box">
            <p><strong>Important:</strong> Please allow 2-3 business days for the amount to reflect in your bank statement.</p>
          </div>
          
          <div class="contact-info">
            <p><strong>For any queries regarding this payment, please contact:</strong></p>
            <ul>
              <li><strong>📧 Email:</strong> accounts@psu.gov.in</li>
              <li><strong>📞 Phone:</strong> 1800-XXX-XXXX</li>
              <li><strong>🕒 Office Hours:</strong> Monday to Friday, 9:00 AM to 5:00 PM</li>
            </ul>
          </div>
          
          <p>Thank you for your continued partnership with our organization.</p>
          
          <p>Best regards,<br>
          <strong>Accounts Department</strong><br>
          Public Sector Undertaking<br>
          Government of India</p>
        </div>
        
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>© 2024 Public Sector Undertaking - Government of India. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

export function generatePaymentConfirmationText({
  vendorName,
  paymentDate,
  amount,
  vendorId,
}: PaymentConfirmationProps): string {
  const formattedAmount = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount)

  return `
Dear ${vendorName},

Payment Confirmation - PSU Vendor Payment

We are pleased to confirm that your payment has been successfully processed.

Payment Details:
- Vendor Name: ${vendorName}
- Payment Date: ${paymentDate}
- Amount: ${formattedAmount}
- Status: PAID
- Reference ID: ${vendorId}

This payment has been credited to your registered account. Please allow 2-3 business days for the amount to reflect in your bank statement.

For any queries regarding this payment, please contact:
- Email: accounts@psu.gov.in
- Phone: 1800-XXX-XXXX
- Office Hours: Monday to Friday, 9:00 AM to 5:00 PM

Thank you for your continued partnership with our organization.

Best regards,
Accounts Department
Public Sector Undertaking
Government of India

---
This is an automated message. Please do not reply to this email.
  `
}
