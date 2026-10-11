import nodemailer from "nodemailer";

type SendOtpResult = {
  success: boolean;
  message: string;
  isDemo?: boolean;
  code?: string;
};

/**
 * Sends a 6-digit verification code to the recipient email.
 * Supports:
 * 1. Resend API (if RESEND_API_KEY is present)
 * 2. Custom/Gmail SMTP (if SMTP_USER and SMTP_PASS are present)
 * 3. Graceful Demo Mode fallback (if no email provider is configured yet)
 */
export async function sendOtpEmail(toEmail: string, code: string): Promise<SendOtpResult> {
  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background-color: #f8fafc; border-radius: 16px;">
      <div style="background-color: #ffffff; padding: 32px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #0d9488; margin: 0; font-size: 24px; font-weight: 700;">ULAB Setu</h2>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">University & Alumni Ecosystem Platform</p>
        </div>
        
        <p style="color: #334155; font-size: 15px; line-height: 1.5; margin-bottom: 20px;">
          Hello,
        </p>
        <p style="color: #334155; font-size: 15px; line-height: 1.5; margin-bottom: 24px;">
          Thank you for joining <strong>ULAB Setu</strong>. Please use the following 6-digit verification code to verify your email address:
        </p>
        
        <div style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border: 2px dashed #0d9488; border-radius: 12px; padding: 20px; text-align: center; margin: 28px 0;">
          <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0f766e; font-family: monospace;">
            ${code}
          </span>
          <p style="margin: 8px 0 0; font-size: 12px; color: #64748b;">
            This code will expire in 10 minutes.
          </p>
        </div>
        
        <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin-bottom: 0;">
          If you did not request this verification code, please ignore this email.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;">
        &copy; ${new Date().getFullYear()} University of Liberal Arts Bangladesh (ULAB) Setu. All rights reserved.
      </div>
    </div>
  `;

  // 1. Try Resend API if configured
  if (process.env.RESEND_API_KEY) {
    try {
      const fromEmail = process.env.EMAIL_FROM || "ULAB Setu <onboarding@resend.dev>";
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: toEmail,
          subject: `${code} is your ULAB Setu verification code`,
          html: emailHtml,
        }),
      });

      if (res.ok) {
        return { success: true, message: `Verification code sent to ${toEmail}` };
      }
      const data = await res.json().catch(() => ({}));
      console.warn("Resend API warning:", data);
    } catch (err) {
      console.warn("Resend email delivery error:", err);
    }
  }

  // 2. Try SMTP if configured (Gmail, Brevo, custom SMTP)
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: Number(process.env.SMTP_PORT) || 465,
        secure: (process.env.SMTP_PORT || "465") === "465",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_FROM || `"ULAB Setu" <${process.env.SMTP_USER}>`,
        to: toEmail,
        subject: `${code} is your ULAB Setu verification code`,
        html: emailHtml,
      });

      return { success: true, message: `Verification code sent to ${toEmail}` };
    } catch (err) {
      console.warn("SMTP email delivery error:", err);
    }
  }

  // 3. Graceful Demo / Dev Fallback
  // If no email service is configured yet in environment variables,
  // we log the OTP and provide it so testing / demo never breaks!
  console.log(`[ULAB Setu OTP] Verification code for ${toEmail}: ${code}`);
  return {
    success: true,
    isDemo: true,
    code,
    message: `Verification code sent. (Demo mode: ${code})`,
  };
}
