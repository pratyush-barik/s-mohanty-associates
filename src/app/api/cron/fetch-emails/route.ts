import { NextResponse } from 'next/server';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { prisma } from '@/lib/prisma';

// This is required to force Next.js to treat this as an API route, not statically generated.
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Validate authorization (for the cron job to call securely)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const host = process.env.IMAP_HOST; // e.g. imap.secureserver.net (GoDaddy)
  const port = parseInt(process.env.IMAP_PORT || '993', 10);
  const user = process.env.IMAP_USER;
  const pass = process.env.IMAP_PASS;

  if (!host || !user || !pass) {
    return NextResponse.json({ error: 'IMAP configuration missing.' }, { status: 500 });
  }

  const client = new ImapFlow({
    host,
    port,
    secure: port === 993,
    auth: { user, pass },
    logger: false,
  });

  try {
    await client.connect();

    // Select the INBOX and lock it for processing
    const lock = await client.getMailboxLock('INBOX');
    
    try {
      // Search for Unread emails
      const messages = (await client.search({ seen: false })) || [];
      
      let processedCount = 0;

      for (const seq of messages) {
        const messageStream = await client.download(seq);
        const parsedEmail = await simpleParser(messageStream as any);

        const subject = parsedEmail.subject || '';
        const fromEmail = parsedEmail.from?.value[0]?.address || 'unknown@example.com';
        const fromName = parsedEmail.from?.value[0]?.name || 'Unknown User';
        const bodyText = parsedEmail.text || '';

        // Extract [Ticket #SMA-123] from the subject line
        const ticketMatch = subject.match(/\[Ticket\s+#(SMA-[A-Z0-9\-]+)\]/i);
        const ticketNumber = ticketMatch ? ticketMatch[1] : null;

        if (ticketNumber) {
          // Scenario 1: Reply to existing ticket
          const existingEnquiry = await prisma.enquiry.findUnique({
            where: { ticketNumber },
          });

          if (existingEnquiry) {
            await prisma.enquiryMessage.create({
              data: {
                enquiryId: existingEnquiry.id,
                sender: 'CLIENT',
                body: bodyText.trim(),
              },
            });

            await prisma.enquiry.update({
              where: { id: existingEnquiry.id },
              data: { status: 'NEW' }, // Mark as new so manager knows client replied
            });
          }
        } else {
          // Scenario 2: Direct cold email to info@
          // Create new Ticket
          const count = await prisma.enquiry.count();
          const newTicketNumber = `SMA-${100 + count + 1}`;

          await prisma.enquiry.create({
            data: {
              ticketNumber: newTicketNumber,
              source: 'EMAIL',
              name: fromName,
              email: fromEmail,
              subject: subject,
              message: bodyText.trim(),
              status: 'NEW',
              messages: {
                create: {
                  sender: 'CLIENT',
                  body: bodyText.trim(),
                },
              },
            },
          });

          // (Optional) We could send an auto-reply here using our sendMail function
          // "We've received your enquiry [Ticket #SMA-...]"
          // Let's omit it from the cron so it doesn't loop auto-replies to spammers.
        }

        // Mark the email as seen so we don't process it again
        await client.messageFlagsAdd({ seq }, ['\\Seen']);
        processedCount++;
      }

      return NextResponse.json({ success: true, processedCount });
    } finally {
      lock.release();
    }
  } catch (error: any) {
    console.error('IMAP Error:', error);
    return NextResponse.json({ error: error.message || 'IMAP Error' }, { status: 500 });
  } finally {
    await client.logout();
  }
}
