import { NextResponse } from 'next/server';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

async function processInbox(host: string, port: number, user: string, pass: string) {
  const client = new ImapFlow({
    host,
    port,
    secure: port === 993 || port === 465,
    auth: { user, pass },
    logger: false,
  });

  let processedCount = 0;

  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');
    
    try {
      const messages = (await client.search({ seen: false })) || [];
      
      for (const seq of messages) {
        const messageStream = await client.download(seq);
        const parsedEmail = await simpleParser(messageStream as any);

        const subject = parsedEmail.subject || '';
        const fromEmail = parsedEmail.from?.value[0]?.address || 'unknown@example.com';
        const fromName = parsedEmail.from?.value[0]?.name || 'Unknown User';
        const bodyText = parsedEmail.text || '';

        const ticketMatch = subject.match(/\[Ticket\s+#(SMA-[A-Z0-9\-]+)\]/i);
        const ticketNumber = ticketMatch ? ticketMatch[1] : null;

        if (ticketNumber) {
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
              data: { status: 'NEW' },
            });
          }
        } else {
          const count = await prisma.enquiry.count();
          const newTicketNumber = `SMA-${100 + count + 1}`;

          const isOrganisation = bodyText.toLowerCase().includes('organisation:');

          await prisma.enquiry.create({
            data: {
              ticketNumber: newTicketNumber,
              source: 'EMAIL',
              senderType: isOrganisation ? 'ORGANISATION' : 'INDIVIDUAL',
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
        }

        await client.messageFlagsAdd({ seq }, ['\\Seen']);
        processedCount++;
      }
    } finally {
      lock.release();
    }
  } catch (error: any) {
    console.error(`IMAP Error for ${user}:`, error);
  } finally {
    try {
      await client.logout();
    } catch (e) {
      // Ignore logout errors
    }
  }

  return processedCount;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const titanHost = process.env.IMAP_HOST;
  const titanPort = parseInt(process.env.IMAP_PORT || '993', 10);
  const titanUser = process.env.IMAP_USER;
  const titanPass = process.env.IMAP_PASS;

  const gmailHost = process.env.GMAIL_IMAP_HOST;
  const gmailPort = parseInt(process.env.GMAIL_IMAP_PORT || '993', 10);
  const gmailUser = process.env.GMAIL_IMAP_USER;
  const gmailPass = process.env.GMAIL_IMAP_PASS;

  let totalProcessed = 0;

  // Process Titan Inbox
  if (titanHost && titanUser && titanPass) {
    totalProcessed += await processInbox(titanHost, titanPort, titanUser, titanPass);
  }

  // Process Gmail Inbox
  if (gmailHost && gmailUser && gmailPass) {
    totalProcessed += await processInbox(gmailHost, gmailPort, gmailUser, gmailPass);
  }

  return NextResponse.json({ success: true, processedCount: totalProcessed });
}
