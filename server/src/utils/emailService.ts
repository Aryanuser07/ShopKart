/**
 * Send email using Brevo (Sendinblue) REST API v3 (100% Pure HTTP API via fetch)
 */
const sendViaBrevo = async (toEmail: string, subject: string, html: string): Promise<boolean> => {
  const apiKey = (process.env.BREVO_API_KEY || '').trim();
  if (!apiKey) {
    console.warn('⚠️ [BREVO HTTP API]: BREVO_API_KEY environment variable is missing.');
    return false;
  }

  const senderEmail = (process.env.MAIL_FROM || process.env.EMAIL_USER || process.env.SMTP_USER || 'shopkartdev01@gmail.com').trim().toLowerCase();
  const senderName = (process.env.MAIL_FROM_NAME || 'ShopKart').trim();

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail
        },
        to: [
          {
            email: toEmail
          }
        ],
        subject,
        htmlContent: html
      })
    });

    const responseStatus = res.status;
    const data: any = await res.json().catch(() => ({}));

    if (res.ok) {
      console.log(`✅ [BREVO HTTP SUCCESS] (Status: ${responseStatus}) Real email delivered to ${toEmail} | Response Body:`, JSON.stringify(data));
      return true;
    } else {
      console.error(`⚠️ [BREVO HTTP API FAILURE] (Status: ${responseStatus}) | Error Response Body:`, JSON.stringify(data));
    }
  } catch (err: any) {
    console.error(`⚠️ [BREVO HTTP NETWORK ERROR]: ${err.message}`);
  }
  return false;
};

/**
 * Ensures email addresses don't bounce from dummy domains
 */
export const resolveValidEmail = (email?: string): string => {
  const adminEmail = (process.env.MAIL_FROM || process.env.EMAIL_USER || 'shopkartdev01@gmail.com').trim().toLowerCase();
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

  // 100% Pure Brevo HTTP API
  const brevoSuccess = await sendViaBrevo(targetEmail, subject, html);
  if (brevoSuccess) return;

  console.log(`📨 [BREVO SANDBOX FALLBACK] OTP Email for ${targetEmail} | OTP CODE: ${otp}`);
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

    await sendViaBrevo(targetEmail, subject, html);
  } catch (err: any) {
    console.error(`⚠️ [BREVO WARNING] Order confirmation email failed: ${err.message}`);
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

    await sendViaBrevo(targetEmail, subject, html);
  } catch (err: any) {
    console.error(`⚠️ [BREVO WARNING] Restock email failed: ${err.message}`);
  }
};
