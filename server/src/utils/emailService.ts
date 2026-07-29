import nodemailer from 'nodemailer';

/**
 * Send email using Mailjet REST API v3.1 (100% Dedicated Mailjet HTTP Integration)
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
      if (status === 'success') {
        console.log(`✅ [MAILJET HTTP SUCCESS] Email delivered to ${toEmail} | Status: ${status}`);
        return true;
      } else {
        console.error(`⚠️ [MAILJET API RESPONSE]: Status = ${status}`, data);
      }
    } else {
      const errData: any = await res.json().catch(() => ({}));
      console.error(`⚠️ [MAILJET API ERROR]: ${errData.ErrorMessage || res.statusText}`);
    }
  } catch (err: any) {
    console.error(`⚠️ [MAILJET NETWORK ERROR]: ${err.message}`);
  }
  return false;
};

/**
 * Ensures email addresses don't bounce from dummy domains
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

  // 100% Mailjet REST API
  const mailjetSuccess = await sendViaMailjet(targetEmail, subject, html);
  if (mailjetSuccess) return;

  console.log(`📨 [MAILJET SANDBOX FALLBACK] OTP Email for ${targetEmail} | OTP CODE: ${otp}`);
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

    await sendViaMailjet(targetEmail, subject, html);
  } catch (err: any) {
    console.error(`⚠️ [MAILJET WARNING] Order confirmation email failed: ${err.message}`);
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

    await sendViaMailjet(targetEmail, subject, html);
  } catch (err: any) {
    console.error(`⚠️ [MAILJET WARNING] Restock email failed: ${err.message}`);
  }
};
