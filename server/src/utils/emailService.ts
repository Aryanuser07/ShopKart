import nodemailer from 'nodemailer';

/**
 * Send email using Mailjet REST API v3.1 (Port 443 HTTPS - Works 100% on Render Cloud to ANY email recipient!)
 */
const sendViaMailjet = async (toEmail: string, subject: string, html: string): Promise<boolean> => {
  const pubKey = (process.env.MJ_APIKEY_PUBLIC || '').trim();
  const privKey = (process.env.MJ_APIKEY_PRIVATE || '').trim();
  if (!pubKey || !privKey) return false;

  const authHeader = 'Basic ' + Buffer.from(`${pubKey}:${privKey}`).toString('base64');
  const senderEmail = (process.env.EMAIL_USER || process.env.SMTP_USER || 'rawataryan55@gmail.com').trim().toLowerCase();

  try {
    const res = await fetch('https://api.mailjet.com/v3.1/send', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        Messages: [
          {
            From: {
              Email: senderEmail,
              Name: 'ShopKart'
            },
            To: [
              {
                Email: toEmail
              }
            ],
            Subject: subject,
            HTMLPart: html
          }
        ]
      })
    });

    if (res.ok) {
      const data: any = await res.json();
      const status = data.Messages?.[0]?.Status;
      console.log(`✅ [MAILJET HTTP SUCCESS] Real email delivered to ${toEmail} | Status: ${status}`);
      return true;
    } else {
      const errData: any = await res.json().catch(() => ({}));
      console.error(`⚠️ [MAILJET API WARNING]: ${errData.ErrorMessage || res.statusText}`);
    }
  } catch (err: any) {
    console.error(`⚠️ [MAILJET API WARNING]: ${err.message}`);
  }
  return false;
};

/**
 * Fallback Resend HTTP API
 */
const sendViaResend = async (toEmail: string, subject: string, html: string): Promise<boolean> => {
  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  if (!apiKey) return false;

  const adminEmail = (process.env.EMAIL_USER || process.env.SMTP_USER || 'rawataryan55@gmail.com').trim().toLowerCase();

  const attemptSend = async (recipient: string) => {
    return await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'ShopKart <onboarding@resend.dev>',
        to: [recipient],
        subject,
        html
      })
    });
  };

  try {
    let res = await attemptSend(toEmail);

    if (res.ok) {
      const data: any = await res.json();
      console.log(`✅ [RESEND HTTP SUCCESS] Real email sent to ${toEmail} | ID: ${data?.id}`);
      return true;
    }

    const errData: any = await res.json().catch(() => ({}));

    if (errData.message?.includes('testing emails to your own email address') && toEmail !== adminEmail) {
      console.log(`ℹ️ [RESEND FREE TIER] Redirecting email for ${toEmail} to registered owner address (${adminEmail})...`);
      let retryRes = await attemptSend(adminEmail);
      if (retryRes.ok) {
        const retryData: any = await retryRes.json();
        console.log(`✅ [RESEND HTTP SUCCESS] Email delivered to owner inbox (${adminEmail}) | ID: ${retryData?.id}`);
        return true;
      }
    }
  } catch (err: any) {
    console.error(`⚠️ [RESEND API WARNING]: ${err.message}`);
  }
  return false;
};

// Configure SMTP Transporter using SSL Port 465 for cloud fallback
const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 465;
  const user = (process.env.EMAIL_USER || process.env.SMTP_USER || '').trim();
  const rawPass = (process.env.EMAIL_PASS || process.env.SMTP_PASS || '').trim();
  const pass = rawPass.replace(/\s+/g, '');

  if (user && pass) {
    return nodemailer.createTransport({
      host: host.includes('gmail') ? 'smtp.gmail.com' : host,
      port: host.includes('gmail') ? 465 : port,
      secure: host.includes('gmail') ? true : port === 465,
      auth: {
        user,
        pass
      },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 5000
    });
  }

  return null;
};

const getFromEmail = () => process.env.SMTP_FROM || process.env.EMAIL_USER || 'ShopKart <no-reply@shopkart.com>';

/**
 * Ensures email addresses don't bounce from dummy domains (e.g. @shopkart.com -> EMAIL_USER)
 */
export const resolveValidEmail = (email?: string): string => {
  const adminEmail = (process.env.EMAIL_USER || process.env.SMTP_USER || 'rawataryan55@gmail.com').trim().toLowerCase();
  if (!email || typeof email !== 'string' || !email.includes('@')) return adminEmail;
  const lower = email.trim().toLowerCase();
  if (lower.endsWith('@shopkart.com') || lower.endsWith('@example.com') || lower.endsWith('@test.com') || lower.endsWith('@localhost')) {
    return adminEmail;
  }
  return lower;
};

/**
 * Send 6-Digit OTP Email for authentication & verification
 */
export const sendOTPEmail = async (toEmail: string, otp: string, name?: string) => {
  const targetEmail = resolveValidEmail(toEmail);
  const recipientName = name || targetEmail.split('@')[0];
  const subject = `🔐 Your ShopKart Verification Code: ${otp}`;
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background-color: #faf9f6; border-radius: 24px; border: 1px solid #e2e8f0;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #242b27; margin: 0; font-size: 28px; font-weight: 900;">Shop<span style="color: #eb9800;">Kart</span></h1>
        <p style="color: #64748b; font-size: 13px; margin-top: 4px; font-weight: 600;">Security & Authentication</p>
      </div>

      <div style="background-color: #ffffff; padding: 28px; border-radius: 20px; border: 1px solid #cbd5e1;">
        <h2 style="color: #242b27; font-size: 18px; font-weight: 800; margin-top: 0;">Hello ${recipientName},</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.5;">Your one-time security verification code (OTP) for ShopKart is:</p>
        
        <div style="text-align: center; margin: 24px 0;">
          <span style="display: inline-block; background-color: #242b27; color: #ffffff; font-size: 32px; font-weight: 900; letter-spacing: 8px; padding: 14px 28px; border-radius: 16px; border: 2px solid #eb9800;">
            ${otp}
          </span>
        </div>

        <p style="color: #64748b; font-size: 12px; text-align: center; margin-bottom: 0;">⏱️ This code is valid for <strong>5 minutes</strong>.</p>
      </div>
    </div>
  `;

  // 1. Try Mailjet HTTP API first (delivers to ANY recipient email address over HTTPS port 443!)
  const mailjetSuccess = await sendViaMailjet(targetEmail, subject, html);
  if (mailjetSuccess) return;

  // 2. Try Resend HTTP API
  const resendSuccess = await sendViaResend(targetEmail, subject, html);
  if (resendSuccess) return;

  // 3. Fallback to Nodemailer SMTP
  try {
    const transporter = createTransporter();
    if (transporter) {
      await transporter.sendMail({
        from: getFromEmail(),
        to: targetEmail,
        subject,
        html
      });
      console.log(`[SMTP EMAIL DISPATCHED] OTP sent to ${targetEmail}`);
      return;
    }
  } catch (err: any) {
    console.error(`⚠️ [SMTP WARNING] Email dispatch failed (${err.message}). Defaulting to sandbox mode.`);
  }

  console.log(`📨 [DEV SMTP SANDBOX] OTP Email for ${targetEmail} | OTP CODE: ${otp}`);
};

/**
 * Send Order Receipt Email upon Checkout
 */
export const sendOrderConfirmationEmail = async (toEmail: string, order: any) => {
  try {
    const targetEmail = resolveValidEmail(toEmail);
    const orderId = order._id || order.id || 'Order';
    const subject = `🛍️ ShopKart Order Confirmation #${String(orderId).slice(-8).toUpperCase()}`;
    const html = `<p>Thank you for your order #${orderId}!</p>`;

    const mailjetSuccess = await sendViaMailjet(targetEmail, subject, html);
    if (mailjetSuccess) return;

    const resendSuccess = await sendViaResend(targetEmail, subject, html);
    if (resendSuccess) return;

    const transporter = createTransporter();
    if (transporter) {
      await transporter.sendMail({
        from: getFromEmail(),
        to: targetEmail,
        subject,
        html
      });
    }
  } catch (err: any) {
    console.error(`⚠️ [SMTP WARNING] Order confirmation email failed: ${err.message}`);
  }
};

/**
 * Send Restock Notification Email
 */
export const sendRestockAlertEmail = async (toEmail: string, productName: string) => {
  try {
    const targetEmail = resolveValidEmail(toEmail);
    const subject = `📦 Back in Stock: ${productName}!`;
    const html = `<p>${productName} is back in stock on ShopKart!</p>`;

    const mailjetSuccess = await sendViaMailjet(targetEmail, subject, html);
    if (mailjetSuccess) return;

    const resendSuccess = await sendViaResend(targetEmail, subject, html);
    if (resendSuccess) return;

    const transporter = createTransporter();
    if (transporter) {
      await transporter.sendMail({
        from: getFromEmail(),
        to: targetEmail,
        subject,
        html
      });
    }
  } catch (err: any) {
    console.error(`⚠️ [SMTP WARNING] Restock email failed: ${err.message}`);
  }
};
