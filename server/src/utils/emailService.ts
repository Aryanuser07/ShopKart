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
        }
      });
    }

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass
      }
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
        <h1 style="color: #242b27; margin: 0; font-size: 28px; font-weight: 900; tracking-tight: -0.5px;">Shop<span style="color: #eb9800;">Kart</span></h1>
        <p style="color: #64748b; font-size: 13px; margin-top: 4px; font-weight: 600;">Security & Authentication</p>
      </div>

      <div style="background-color: #ffffff; padding: 28px; border-radius: 20px; border: 1px solid #cbd5e1; shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <h2 style="color: #242b27; font-size: 18px; font-weight: 800; margin-top: 0;">Hello ${recipientName},</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.5;">Your one-time security verification code (OTP) for ShopKart is:</p>
        
        <div style="text-align: center; margin: 24px 0;">
          <span style="display: inline-block; background-color: #242b27; color: #ffffff; font-size: 32px; font-weight: 900; letter-spacing: 8px; padding: 14px 28px; border-radius: 16px; border: 2px solid #eb9800;">
            ${otp}
          </span>
        </div>

        <p style="color: #64748b; font-size: 12px; text-align: center; margin-bottom: 0;">⏱️ This code is valid for <strong>5 minutes</strong>. Do not share this code with anyone.</p>
      </div>

      <div style="text-align: center; margin-top: 24px; color: #94a3b8; font-size: 11px;">
        <p style="margin: 0;">© ${new Date().getFullYear()} ShopKart Inc. All rights reserved.</p>
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
      console.log(`\n==============================================`);
      console.log(`📨 [DEV SMTP SANDBOX] OTP Email for ${targetEmail}`);
      console.log(`🔐 OTP CODE: ${otp}`);
      console.log(`==============================================\n`);
    }
    return true;
  } catch (err: any) {
    console.error(`[SMTP ERROR] Failed to send OTP email: ${err.message}`);
    return false;
  }
};

/**
 * Send Back-In-Stock Alert Email to Waitlisted Customers
 */
export const sendRestockAlertEmail = async (toEmail: string, productTitle: string) => {
  const targetEmail = resolveValidEmail(toEmail);
  const subject = `🎉 Good News! "${productTitle}" is Back in Stock!`;
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background-color: #faf9f6; border-radius: 24px; border: 1px solid #e2e8f0;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #242b27; margin: 0; font-size: 28px; font-weight: 900;">Shop<span style="color: #eb9800;">Kart</span> Alert</h1>
      </div>

      <div style="background-color: #ffffff; padding: 28px; border-radius: 20px; border: 1px solid #cbd5e1;">
        <h2 style="color: #242b27; font-size: 18px; font-weight: 800; margin-top: 0;">Item Restocked! ⚡</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.5;">You previously requested to be notified when <strong>${productTitle}</strong> returned to stock.</p>
        <p style="color: #475569; font-size: 14px; line-height: 1.5;">Great news! Fresh inventory is now available for immediate order on ShopKart.</p>
        
        <div style="text-align: center; margin: 24px 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/products" style="display: inline-block; background-color: #eb9800; color: #0f172a; font-size: 14px; font-weight: 900; text-decoration: none; padding: 12px 24px; border-radius: 12px;">
            Order Now Before It Sells Out
          </a>
        </div>
      </div>
    </div>
  `;

  try {
    const transporter = createTransporter();
    if (transporter) {
      await transporter.sendMail({ from: getFromEmail(), to: targetEmail, subject, html });
      console.log(`[SMTP RESTOCK ALERT DISPATCHED] Sent to ${targetEmail} for "${productTitle}"`);
    } else {
      console.log(`📨 [DEV SMTP SANDBOX] Restock Alert sent to ${targetEmail} for "${productTitle}"`);
    }
  } catch (err: any) {
    console.error(`[SMTP ERROR] Restock alert failed: ${err.message}`);
  }
};

const formatEmailPrice = (amount: number): string => {
  const num = Number(amount) || 0;
  // Convert base INR store values (> 1000) to USD ($) matching frontend useCurrency rate (~83.33)
  if (num > 1000) {
    const usd = (num / 83.333).toFixed(2);
    return `$${usd}`;
  }
  return `$${num.toFixed(2)}`;
};

/**
 * Send Order Receipt Email upon Checkout
 */
export const sendOrderConfirmationEmail = async (toEmail: string, order: any) => {
  const targetEmail = resolveValidEmail(toEmail);
  const orderId = order._id || order.id || 'N/A';
  const formattedTotal = formatEmailPrice(order.totalPrice || 0);
  const subject = `🛍️ ShopKart Order Confirmation #${String(orderId).slice(-8).toUpperCase()}`;
  
  const itemsHtml = (order.orderItems || []).map((item: any) => `
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #334155;">${item.title}</td>
      <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #334155; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right;">${formatEmailPrice((item.price || 0) * (item.quantity || 1))}</td>
    </tr>
  `).join('');

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 540px; margin: 0 auto; padding: 32px; background-color: #faf9f6; border-radius: 24px; border: 1px solid #e2e8f0;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #242b27; margin: 0; font-size: 28px; font-weight: 900;">Shop<span style="color: #eb9800;">Kart</span> Receipt</h1>
        <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Thank you for your order!</p>
      </div>

      <div style="background-color: #ffffff; padding: 28px; border-radius: 20px; border: 1px solid #cbd5e1;">
        <h2 style="color: #242b27; font-size: 16px; font-weight: 800; margin-top: 0;">Order Summary #${String(orderId).slice(-8).toUpperCase()}</h2>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
          <thead>
            <tr style="border-bottom: 2px solid #e2e8f0; text-align: left; font-size: 12px; color: #64748b;">
              <th style="padding-bottom: 8px;">Item</th>
              <th style="padding-bottom: 8px; text-align: center;">Qty</th>
              <th style="padding-bottom: 8px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="margin-top: 20px; text-align: right; font-size: 16px; font-weight: 900; color: #eb9800;">
          Total Paid: ${formattedTotal}
        </div>
      </div>
    </div>
  `;

  try {
    const transporter = createTransporter();
    if (transporter) {
      await transporter.sendMail({ from: getFromEmail(), to: targetEmail, subject, html });
      console.log(`[SMTP ORDER RECEIPT DISPATCHED] Sent to ${targetEmail} for Order #${orderId}`);
    } else {
      console.log(`📨 [DEV SMTP SANDBOX] Order Confirmation sent to ${targetEmail} for Order #${orderId}`);
    }
  } catch (err: any) {
    console.error(`[SMTP ERROR] Order confirmation failed: ${err.message}`);
  }
};
