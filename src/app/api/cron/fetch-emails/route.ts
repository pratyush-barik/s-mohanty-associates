import { NextResponse } from 'next/server';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin, STORAGE_BUCKETS, getPublicUrl } from '@/lib/supabase';
import path from 'path';

export const dynamic = 'force-dynamic';

async function uploadAttachment(buffer: Buffer, filename: string, mimeType: string) {
  const ext = path.extname(filename) || '.bin';
  const safeName = `${crypto.randomUUID()}${ext}`;
  const filePath = `emails/${safeName}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(STORAGE_BUCKETS.ENQUIRY_FILES)
    .upload(filePath, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadError) {
    console.error('Supabase upload error for attachment:', uploadError);
    return null;
  }

  return { filePath, publicUrl: getPublicUrl(STORAGE_BUCKETS.ENQUIRY_FILES, filePath) };
}

async function processInbox(host: string, port: number, user: string, pass: string, source: 'EMAIL' | 'PORTAL_SIGNUP') {
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
        const parsedEmail = await simpleParser(messageStream);

        const subject = parsedEmail.subject || '';
        const fromEmail = parsedEmail.from?.value[0]?.address || 'unknown@example.com';
        const fromName = parsedEmail.from?.value[0]?.name || 'Unknown User';
        const bodyText = parsedEmail.text || '';

        const ticketMatch = subject.match(/\[Ticket\s+#(SMA-[A-Z0-9\-]+)\]/i);
        const ticketNumber = ticketMatch ? ticketMatch[1] : null;

        let enquiry = null;

        if (ticketNumber) {
          enquiry = await prisma.enquiry.findUnique({
            where: { ticketNumber },
            include: { project: true, serviceRequest: true, documents: true },
          });

          if (enquiry) {
            await prisma.enquiryMessage.create({
              data: {
                enquiryId: enquiry.id,
                sender: 'CLIENT',
                body: bodyText.trim(),
              },
            });

            await prisma.enquiry.update({
              where: { id: enquiry.id },
              data: { status: 'NEW' },
            });
          }
        } else {
          const count = await prisma.enquiry.count();
          const newTicketNumber = `SMA-${100 + count + 1}`;

          const isOrganisation = bodyText.toLowerCase().includes('organisation:');

          enquiry = await prisma.enquiry.create({
            data: {
               ticketNumber: newTicketNumber,
               source,
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

        // Process attachments if we have an enquiry to link them to
        if (enquiry && parsedEmail.attachments && parsedEmail.attachments.length > 0) {
          const existingDocCount = await prisma.document.count({
            where: { enquiryId: enquiry.id },
          });

          if (existingDocCount === 0) {
            for (const attachment of parsedEmail.attachments) {
              if (!attachment.content) continue;

              const buffer = Buffer.from(attachment.content);
              const fileName = attachment.filename || 'attachment';
              const mimeType = attachment.contentType || 'application/octet-stream';

              const upload = await uploadAttachment(buffer, fileName, mimeType);
              if (!upload) continue;

              await prisma.document.create({
                data: {
                  name: fileName,
                  url: upload.publicUrl,
                  type: mimeType,
                  size: buffer.length,
                  enquiryId: enquiry.id,
                },
              });
            }
          }
        }

        await client.messageFlagsAdd({ seq }, ['\\Seen']);
        processedCount++;
      }
    } finally {
      lock.release();
    }
  } catch (error) {
    console.error(`IMAP Error for ${user}:`, error);
  } finally {
    try {
      await client.logout();
    } catch {
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
    totalProcessed += await processInbox(titanHost, titanPort, titanUser, titanPass, 'EMAIL');
  }

  // Process Gmail Inbox
  if (gmailHost && gmailUser && gmailPass) {
    totalProcessed += await processInbox(gmailHost, gmailPort, gmailUser, gmailPass, 'EMAIL');
  }

  return NextResponse.json({ success: true, processedCount: totalProcessed });
}
