import nodemailer from 'nodemailer';

export async function sendMail({ to, subject, html, from }: { to: string; subject: string; html: string; from?: string }) {
  // Determine if we should use Gmail or Standard SMTP based on sender email
  const isGmailSender = from === process.env.GMAIL_SMTP_FROM;

  const host = isGmailSender ? process.env.GMAIL_SMTP_HOST : process.env.SMTP_HOST;
  const port = isGmailSender ? process.env.GMAIL_SMTP_PORT : process.env.SMTP_PORT;
  const user = isGmailSender ? process.env.GMAIL_SMTP_USER : process.env.SMTP_USER;
  const pass = isGmailSender ? process.env.GMAIL_SMTP_PASS : process.env.SMTP_PASS;
  
  const defaultFrom = isGmailSender 
    ? process.env.GMAIL_SMTP_FROM 
    : (process.env.SMTP_FROM || 'no-reply@smohantyassociates.com');
  
  const senderEmail = from || defaultFrom;

  if (!host || !port || !user || !pass) {
    console.log('═════════════════════════════════════════════');
    console.log(`[MAIL STUB] From: ${senderEmail}`);
    console.log(`[MAIL STUB] To: ${to}`);
    console.log(`[MAIL STUB] Subject: ${subject}`);
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
    });

    return { success: true };
  } catch (error) {
    console.error(`Failed to send mail from ${senderEmail}:`, error);
    return { error: 'Failed to send mail.' };
  }
}
