import nodemailer from "nodemailer";

// ── Transport ───────────────────────────────────────

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM_NAME = process.env.SMTP_FROM_NAME ?? "Jewellery Store";
const FROM_EMAIL = process.env.SMTP_USER!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ── Shared layout ───────────────────────────────────

function layout(body: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${FROM_NAME}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color:#f59e0b;padding:28px 40px;text-align:center;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">${FROM_NAME}</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 28px;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 28px;border-top:1px solid #e4e4e7;">
              <p style="margin:0;font-size:12px;color:#a1a1aa;text-align:center;line-height:1.6;">
                You received this email because an action was performed on your ${FROM_NAME} account.<br />
                If you didn't request this, you can safely ignore it.
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:20px 0 0;font-size:11px;color:#a1a1aa;text-align:center;">
          &copy; ${new Date().getFullYear()} ${FROM_NAME}. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

const btnStyle =
  "display:inline-block;padding:14px 32px;background-color:#f59e0b;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;";

// ── Email senders ───────────────────────────────────

export async function sendVerificationEmail(
  to: string,
  name: string | null,
  token: string,
) {
  const url = `${APP_URL}/api/auth/verify-email?token=${token}`;
  const greeting = name ? `Hi ${name},` : "Hi,";

  const html = layout(`
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#18181b;">Verify your email</h2>
    <p style="margin:0 0 12px;font-size:15px;color:#3f3f46;line-height:1.6;">${greeting}</p>
    <p style="margin:0 0 24px;font-size:15px;color:#3f3f46;line-height:1.6;">
      Thanks for creating an account! Please verify your email address by clicking the button below.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td align="center" style="border-radius:8px;background-color:#f59e0b;">
          <a href="${url}" target="_blank" style="${btnStyle}">Verify Email</a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px;font-size:13px;color:#71717a;line-height:1.6;">
      Or copy and paste this link into your browser:
    </p>
    <p style="margin:0 0 12px;font-size:13px;color:#f59e0b;word-break:break-all;line-height:1.6;">
      <a href="${url}" style="color:#f59e0b;text-decoration:underline;">${url}</a>
    </p>
    <p style="margin:0;font-size:13px;color:#a1a1aa;">This link expires in 24 hours.</p>
  `);

  await transporter.sendMail({
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to,
    subject: "Verify your email address",
    html,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  name: string | null,
  token: string,
) {
  const url = `${APP_URL}/api/auth/reset-password?token=${token}`;
  const greeting = name ? `Hi ${name},` : "Hi,";

  const html = layout(`
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#18181b;">Reset your password</h2>
    <p style="margin:0 0 12px;font-size:15px;color:#3f3f46;line-height:1.6;">${greeting}</p>
    <p style="margin:0 0 24px;font-size:15px;color:#3f3f46;line-height:1.6;">
      We received a request to reset the password for your account. Click the button below to choose a new password.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td align="center" style="border-radius:8px;background-color:#f59e0b;">
          <a href="${url}" target="_blank" style="${btnStyle}">Reset Password</a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px;font-size:13px;color:#71717a;line-height:1.6;">
      Or copy and paste this link into your browser:
    </p>
    <p style="margin:0 0 12px;font-size:13px;color:#f59e0b;word-break:break-all;line-height:1.6;">
      <a href="${url}" style="color:#f59e0b;text-decoration:underline;">${url}</a>
    </p>
    <p style="margin:0;font-size:13px;color:#a1a1aa;">This link expires in 1 hour. If you didn't request this, no action is needed.</p>
  `);

  await transporter.sendMail({
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to,
    subject: "Reset your password",
    html,
  });
}
