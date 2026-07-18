import nodemailer from 'nodemailer';

export async function sendMail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || 'no-reply@smohantyassociates.com';

  if (!host || !port || !user || !pass) {
    console.log('═════════════════════════════════════════════');
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
      from,
      to,
      subject,
      html,
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to send mail:', error);
    return { error: 'Failed to send mail.' };
  }
}
