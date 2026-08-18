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

async function processInbox(host: string, port: number, user: string, pass: string, source: 'EMAIL' | 'PORTAL_SIGNUP', isGmail: boolean) {
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

        let isProjectMatch = false;
        let isEnquiryMatch = false;
        let matchedRecordId: string | null = null;
        let projectMessageId: string | null = null;

        // ─── 1. Check if Reply to Existing Case ───
        if (ticketNumber) {
          // Try to find an active Project first
          const project = await prisma.project.findUnique({
            where: { projectCode: ticketNumber }
          });

          if (project) {
            isProjectMatch = true;
            matchedRecordId = project.id;
            
            // Log reply as ProjectMessage
            const projectMsg = await prisma.projectMessage.create({
              data: {
                projectId: project.id,
                content: bodyText.trim(),
              }
            });
            projectMessageId = projectMsg.id;

          } else {
            // Try Enquiry
            const enquiry = await prisma.enquiry.findUnique({
              where: { ticketNumber }
            });

            if (enquiry) {
              isEnquiryMatch = true;
              matchedRecordId = enquiry.id;

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
          }
        } 
        
        // ─── 2. If NO Match, Create New Case ───
        if (!isProjectMatch && !isEnquiryMatch) {
          if (isGmail) {
            // Direct Service Request creation for Gmail
            const sr = await prisma.serviceRequest.create({
              data: {
                guestName: fromName,
                guestEmail: fromEmail,
                propertyType: 'Specified in Email',
                purpose: 'Valuation Request',
                propertyAddress: 'Address pending (from email)',
                propertyDetails: bodyText.trim(),
                contactName: fromName,
                contactPhone: '',
                contactEmail: fromEmail,
                status: 'APPROVED' // Ready for assignment
              }
            });

            const count = await prisma.project.count();
            const projectCode = `SMA-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;
            
            const project = await prisma.project.create({
              data: {
                projectCode,
                serviceRequestId: sr.id,
                source: 'GMAIL',
                status: 'PENDING_REVIEW', // Needs manager assignment
                isEmailOnly: true
              }
            });
            
            isProjectMatch = true;
            matchedRecordId = project.id;

          } else {
            // Standard Enquiry creation for Titan/info
            const count = await prisma.enquiry.count();
            const newTicketNumber = `SMA-${100 + count + 1}`;
            const isOrganisation = bodyText.toLowerCase().includes('organisation:');

            const enquiry = await prisma.enquiry.create({
              data: {
                 ticketNumber: newTicketNumber,
                 source,
                senderType: isOrganisation ? 'ORGANISATION' : 'INDIVIDUAL',
                name: fromName,
                email: fromEmail,
                subject: subject,
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
            
            isEnquiryMatch = true;
            matchedRecordId = enquiry.id;
          }
        }

        // ─── 3. Process Attachments ───
        if (matchedRecordId && parsedEmail.attachments && parsedEmail.attachments.length > 0) {
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
                // Link attachment based on match type
                ...(isProjectMatch && projectMessageId ? { messageId: projectMessageId } : {}),
                ...(isProjectMatch && !projectMessageId ? { projectId: matchedRecordId } : {}),
                ...(isEnquiryMatch ? { enquiryId: matchedRecordId } : {}),
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

  const gmailHost = process.env.GMAIL_IMAP_HOST;
  const gmailPort = parseInt(process.env.GMAIL_IMAP_PORT || '993', 10);
  const gmailUser = process.env.GMAIL_IMAP_USER;
  const gmailPass = process.env.GMAIL_IMAP_PASS;

  let totalProcessed = 0;

  // Process Titan Inbox (Queries -> Enquiries)
  if (titanHost && titanUser && titanPass) {
    totalProcessed += await processInbox(titanHost, titanPort, titanUser, titanPass, 'EMAIL', false);
  }

  // Process Gmail Inbox (Requests -> ServiceRequests)
  if (gmailHost && gmailUser && gmailPass) {
    totalProcessed += await processInbox(gmailHost, gmailPort, gmailUser, gmailPass, 'EMAIL', true);
  }

  return NextResponse.json({ success: true, processedCount: totalProcessed });
}
