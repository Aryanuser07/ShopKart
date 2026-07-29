import nodemailer from 'nodemailer';

// Configure SMTP Transporter using environment variables or fallback configuration
const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = (process.env.EMAIL_USER || process.env.SMTP_USER || '').trim();
  const rawPass = (process.env.EMAIL_PASS || process.env.SMTP_PASS || '').trim();
  // Strip any accidental spaces in App Passwords (e.g. "bjda vagz mqek dkek" -> "bjdavagzmqekdkek")
  const pass = rawPass.replace(/\s+/g, '');

  if (user && pass) {
    if (user.endsWith('@gmail.com') || host.includes('gmail')) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user,
          pass
        },
        connectionTimeout: 4000,
        greetingTimeout: 4000,
        socketTimeout: 4000
      });
    }

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass
      },
      connectionTimeout: 4000,
      greetingTimeout: 4000,
      socketTimeout: 4000
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
    } else {
      console.log(`📨 [DEV SMTP SANDBOX] OTP Email for ${targetEmail} | OTP CODE: ${otp}`);
    }
  } catch (err: any) {
    console.error(`⚠️ [SMTP WARNING] Email dispatch failed (${err.message}). Defaulting to sandbox mode.`);
    console.log(`📨 [DEV SMTP SANDBOX] OTP Email for ${targetEmail} | OTP CODE: ${otp}`);
  }
};

/**
 * Send Order Receipt Email upon Checkout
 */
export const sendOrderConfirmationEmail = async (toEmail: string, order: any) => {
  try {
    const targetEmail = resolveValidEmail(toEmail);
    const orderId = order._id || order.id || 'Order';
    const subject = `🛍️ ShopKart Order Confirmation #${String(orderId).slice(-8).toUpperCase()}`;

    const transporter = createTransporter();
    if (transporter) {
      await transporter.sendMail({
        from: getFromEmail(),
        to: targetEmail,
        subject,
        html: `<p>Thank you for your order #${orderId}!</p>`
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

    const transporter = createTransporter();
    if (transporter) {
      await transporter.sendMail({
        from: getFromEmail(),
        to: targetEmail,
        subject,
        html: `<p>${productName} is back in stock on ShopKart!</p>`
      });
    }
  } catch (err: any) {
    console.error(`⚠️ [SMTP WARNING] Restock email failed: ${err.message}`);
  }
};
