interface SendMailParams {
  to: string;
  toName?: string;
  subject: string;
  htmlBody: string;
  textBody: string;
}

export function zeptoConfigured(): boolean {
  return Boolean(process.env.ZEPTO_API_TOKEN && process.env.ZEPTO_FROM_EMAIL);
}

export async function sendMail(params: SendMailParams): Promise<void> {
  const token = process.env.ZEPTO_API_TOKEN;
  const fromEmail = process.env.ZEPTO_FROM_EMAIL;
  const fromName = process.env.ZEPTO_FROM_NAME || 'ChopHub';
  if (!token || !fromEmail) {
    throw new Error('Zepto not configured (set ZEPTO_API_TOKEN + ZEPTO_FROM_EMAIL)');
  }

  const response = await fetch('https://api.zeptomail.com/v1.1/email/send', {
    method: 'POST',
    headers: {
      Authorization: `Zoho-enczapikey ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: { address: fromEmail, name: fromName },
      to: [{ email_address: { address: params.to, name: params.toName || '' } }],
      subject: params.subject,
      htmlbody: params.htmlBody,
      textbody: params.textBody,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Zepto send failed (${response.status}): ${text}`);
  }
}

export function verificationEmail(params: { name: string; code: string }): SendMailParams {
  return {
    to: '',
    toName: params.name,
    subject: 'Your ChopHub verification code',
    htmlBody: `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #ea580c; margin: 0 0 16px;">Welcome to ChopHub, ${params.name}!</h2>
        <p>Use this code to verify your email:</p>
        <div style="background: #fff7ed; border: 2px solid #ea580c; padding: 24px; text-align: center; margin: 24px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1f2937;">${params.code}</span>
        </div>
        <p style="color: #6b7280; font-size: 14px;">This code expires in 15 minutes. If you didn't sign up, ignore this email.</p>
      </div>
    `,
    textBody: `Welcome to ChopHub, ${params.name}!\n\nYour verification code: ${params.code}\n\nExpires in 15 minutes.`,
  };
}

export function welcomeEmail(params: { name: string; referralCode: string }): SendMailParams {
  return {
    to: '',
    toName: params.name,
    subject: "You're verified — welcome to ChopHub",
    htmlBody: `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #ea580c; margin: 0 0 16px;">You're in, ${params.name}!</h2>
        <p>Your account is verified. Browse fresh catfish, frozen chicken, cooked African food — delivered.</p>
        <p>Your referral code: <strong style="background: #fff7ed; padding: 4px 8px;">${params.referralCode}</strong></p>
        <p>Share it with friends — both of you get wallet credit on their first order.</p>
      </div>
    `,
    textBody: `Welcome to ChopHub!\n\nYour referral code: ${params.referralCode}\nShare with friends for wallet credit on their first order.`,
  };
}

export function orderConfirmationEmail(params: { name: string; orderId: string; total: number }): SendMailParams {
  return {
    to: '',
    toName: params.name,
    subject: `Order ${params.orderId.slice(-8)} confirmed`,
    htmlBody: `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #ea580c; margin: 0 0 16px;">Order confirmed!</h2>
        <p>Hi ${params.name},</p>
        <p>Your order <strong>#${params.orderId.slice(-8)}</strong> for <strong>₦${params.total.toLocaleString()}</strong> is confirmed.</p>
        <p>We'll email you again when it's dispatched.</p>
      </div>
    `,
    textBody: `Order #${params.orderId.slice(-8)} confirmed.\n\nTotal: ₦${params.total.toLocaleString()}\n\nWe'll email you again when dispatched.`,
  };
}
