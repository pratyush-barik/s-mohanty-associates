import { NextResponse } from 'next/server';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin, STORAGE_BUCKETS, getPublicUrl } from '@/lib/supabase';
import { decodeHtmlEntities } from '@/lib/html-entities';
import { generateUniqueEnquiryTicketNumber } from '@/app/actions/enquiry';
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
        const parsedEmail = await simpleParser(messageStream.content as any);

        const subject = decodeHtmlEntities(parsedEmail.subject || '');
        const fromEmail = parsedEmail.from?.value[0]?.address || 'unknown@example.com';
        const fromName = decodeHtmlEntities(parsedEmail.from?.value[0]?.name || 'Unknown User');
        const bodyText = decodeHtmlEntities(parsedEmail.text || '');

        // Extract ticket number if this is a reply (e.g. [Ticket #SMA-2026-123456] or [SMA-2026-123456])
        const ticketMatch = subject.match(/\[(?:Ticket\s+#)?(SMA-[A-Z0-9\-]+)\]/i);
        const ticketNumber = ticketMatch ? ticketMatch[1] : null;

        let enquiryId: string | null = null;

        // ─── 1. Check if Reply to Existing Enquiry ───
        if (ticketNumber) {
          const existingEnquiry = await prisma.enquiry.findUnique({
            where: { ticketNumber }
          });

          if (existingEnquiry) {
            enquiryId = existingEnquiry.id;

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
        }

        // ─── 2. If NO Match, Create New Enquiry ───
        if (!enquiryId) {
          const newTicketNumber = await generateUniqueEnquiryTicketNumber();
          const isOrganisation = bodyText.toLowerCase().includes('organisation:');

          const newEnquiry = await prisma.enquiry.create({
            data: {
              ticketNumber: newTicketNumber,
              source: 'EMAIL',
              senderType: isOrganisation ? 'ORGANISATION' : 'INDIVIDUAL',
              name: fromName,
              email: fromEmail,
              subject: subject || 'Email Enquiry',
              message: bodyText.trim(),
              status: 'NEW',
              enquiries: {
                create: {
                  sender: 'CLIENT',
                  body: bodyText.trim(),
                },
              },
            },
          });

          enquiryId = newEnquiry.id;
        }

        // ─── 3. Process Attachments for Enquiry ───
        if (enquiryId && parsedEmail.attachments && parsedEmail.attachments.length > 0) {
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
                enquiryId,
              },
            });
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

  let totalProcessed = 0;

  // Process Titan Inbox (Queries / Inquiries -> Enquiries)
  if (titanHost && titanUser && titanPass) {
    totalProcessed += await processInbox(titanHost, titanPort, titanUser, titanPass);
  }

  return NextResponse.json({ success: true, processedCount: totalProcessed });
}
