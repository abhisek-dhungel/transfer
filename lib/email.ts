import { Resend } from 'resend';

// Lazy-initialize Resend client to avoid build-time errors when env vars are missing
let resendInstance: Resend | null = null;

function getResend(): Resend {
  if (!resendInstance) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is required');
    }
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}

const from = process.env.EMAIL_FROM || 'transfer@techsastra.com';
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://send.techsastra.com';

interface SendTransferEmailParams {
  recipientEmail: string;
  senderName: string;
  subject: string;
  fileName: string;
  fileSizeMb: string;
  downloadUrl: string;
  expiresAt: Date;
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export async function sendTransferEmail({
  recipientEmail,
  senderName,
  subject,
  fileName,
  fileSizeMb,
  downloadUrl,
  expiresAt,
}: SendTransferEmailParams) {
  const expiryDisplay = formatDate(expiresAt);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${senderName} sent you a file</title>
  <style>
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb; }
    .header { padding: 32px 40px; background: #1D4ED8; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
    .body { padding: 32px 40px; }
    .body p { font-size: 16px; color: #374151; line-height: 1.6; }
    .file-card { background: #f3f4f6; border-radius: 8px; padding: 16px 20px; margin: 24px 0; display: flex; align-items: center; gap: 12px; }
    .file-card .icon { font-size: 32px; }
    .file-card .info { flex: 1; }
    .file-card .name { font-weight: 600; color: #111827; }
    .file-card .size { font-size: 14px; color: #6b7280; margin-top: 2px; }
    .btn { display: inline-block; background: #1D4ED8; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 8px 0; }
    .expiry { font-size: 14px; color: #6b7280; margin-top: 16px; }
    .footer { padding: 24px 40px; border-top: 1px solid #e5e7eb; font-size: 13px; color: #9ca3af; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>TechSastra Transfer</h1>
    </div>
    <div class="body">
      <p><strong>${senderName}</strong> sent you a file via TechSastra Transfer.</p>
      <p style="font-size:14px;color:#6b7280;margin-top:8px;"><strong>Subject:</strong> ${subject}</p>
      <div class="file-card">
        <div class="icon">📁</div>
        <div class="info">
          <div class="name">${fileName}</div>
          <div class="size">${fileSizeMb} MB</div>
        </div>
      </div>
      <a class="btn" href="${downloadUrl}">Download file</a>
      <p class="expiry">⏳ This file is available until <strong>${expiryDisplay}</strong>.</p>
      <p style="font-size:14px;color:#6b7280;">If you weren't expecting this file, you can safely ignore this email.</p>
    </div>
    <div class="footer">
      Powered by <a href="${appUrl}" style="color:#1D4ED8;text-decoration:none;">TechSastra Transfer</a>
    </div>
  </div>
</body>
</html>`;

  const text = `${senderName} sent you a file via TechSastra Transfer.

Subject: ${subject}
File: ${fileName} (${fileSizeMb} MB)

Download it here: ${downloadUrl}

This link expires on ${expiryDisplay}.

If you weren't expecting this file, you can safely ignore this email.

Powered by TechSastra Transfer — ${appUrl}`;

  await getResend().emails.send({
    from,
    to: recipientEmail,
    subject: subject,
    html,
    text,
  });
}
