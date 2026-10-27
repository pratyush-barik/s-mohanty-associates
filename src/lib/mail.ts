import nodemailer from 'nodemailer';

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export interface MailAttachment {
  filename: string;
  path?: string;
  content?: any;
  contentType?: string;
}

export async function sendMail({ 
  to, 
  subject, 
  html, 
  from,
  attachments,
}: { 
  to: string; 
  subject: string; 
  html: string; 
  from?: string;
  attachments?: MailAttachment[];
}) {
  // Determine if we should use Gmail or Standard SMTP based on sender email
  const isGmailSender = from === process.env.GMAIL_SMTP_FROM || (!!from && from.toLowerCase().includes('gmail.com'));

  const host = isGmailSender ? process.env.GMAIL_SMTP_HOST : process.env.SMTP_HOST;
  const port = isGmailSender ? process.env.GMAIL_SMTP_PORT : process.env.SMTP_PORT;
  const user = isGmailSender ? process.env.GMAIL_SMTP_USER : process.env.SMTP_USER;
  const pass = isGmailSender ? process.env.GMAIL_SMTP_PASS : process.env.SMTP_PASS;
  
  const defaultFrom = isGmailSender 
    ? (process.env.GMAIL_SMTP_FROM || 'smohantyassociates@gmail.com')
    : (process.env.SMTP_FROM || 'no-reply@smohantyassociates.com');
  
  const senderEmail = from || defaultFrom;

  if (!host || !port || !user || !pass) {
    console.log('═════════════════════════════════════════════');
    console.log(`[MAIL STUB] From: ${senderEmail}`);
    console.log(`[MAIL STUB] To: ${to}`);
    console.log(`[MAIL STUB] Subject: ${subject}`);
    if (attachments && attachments.length > 0) {
      console.log(`[MAIL STUB] Attachments: ${attachments.map(a => a.filename).join(', ')}`);
    }
    console.log(`[MAIL STUB] Body:\n${html.replace(/<[^>]*>/g, '')}`);
    console.log('═════════════════════════════════════════════');
    return { success: true, logged: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: parseInt(port),
      secure: port === '465',
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: senderEmail,
      to,
      subject,
      html,
      attachments,
    });

    return { success: true };
  } catch (error) {
    console.error(`Failed to send mail from ${senderEmail}:`, error);
    return { error: 'Failed to send mail.' };
  }
}
