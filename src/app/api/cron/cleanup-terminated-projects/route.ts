import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin, STORAGE_BUCKETS } from '@/lib/supabase';
import { runCronJob, CronTask } from '@/lib/cron/runner';

export const dynamic = 'force-dynamic';

// ─── How long after termination before cleanup fires ─────────────
const CLEANUP_AFTER_HOURS = 24; // 1 day

// ─── Helpers ─────────────────────────────────────────────────────

function cutoffDate(): Date {
  const d = new Date();
  d.setHours(d.getHours() - CLEANUP_AFTER_HOURS);
  return d;
}

// ─── Task 1: Find eligible terminated projects ────────────────────
// (Shared state between tasks — populated by Task 1, consumed by 2+3)
let eligibleProjectIds: string[] = [];
let eligibleProjectCodes: string[] = [];

async function findTerminatedProjects(): Promise<{ status: 'success' | 'skipped'; message: string; affected: number; details?: any }> {
  const cutoff = cutoffDate();

  const projects = await prisma.project.findMany({
    where: {
      status: 'TERMINATED',
      updatedAt: { lt: cutoff },
    },
    select: { id: true, projectCode: true },
  });

  eligibleProjectIds = projects.map(p => p.id);
  eligibleProjectCodes = projects.map(p => p.projectCode);

  if (projects.length === 0) {
    return {
      status: 'skipped',
      message: `No TERMINATED projects older than ${CLEANUP_AFTER_HOURS}h found.`,
      affected: 0,
    };
  }

  return {
    status: 'success',
    message: `Found ${projects.length} eligible terminated project(s).`,
    affected: projects.length,
    details: { projectCodes: eligibleProjectCodes },
  };
}

// ─── Task 2: Delete photo bucket images from Supabase Storage ─────
async function deletePhotoBucket(): Promise<{ status: 'success' | 'skipped' | 'error'; message: string; affected: number; details?: any }> {
  if (eligibleProjectIds.length === 0) {
    return { status: 'skipped', message: 'No eligible projects.', affected: 0 };
  }

  // Find all bucket images for terminated projects
  const images = await prisma.bucketImage.findMany({
    where: { projectId: { in: eligibleProjectIds } },
    select: { id: true, storagePath: true, projectId: true },
  });

  if (images.length === 0) {
    return { status: 'skipped', message: 'No bucket images found for eligible projects.', affected: 0 };
  }

  // Delete from Supabase Storage (batch delete)
  const storagePaths = images.map(img => img.storagePath).filter(Boolean);

  if (storagePaths.length > 0) {
    const { error: storageError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
      .remove(storagePaths);

    if (storageError) {
      return {
        status: 'error',
        message: `Supabase storage deletion failed: ${storageError.message}`,
        affected: 0,
        details: { storageError },
      };
    }
  }

  // Delete DB records
  const { count } = await prisma.bucketImage.deleteMany({
    where: { id: { in: images.map(img => img.id) } },
  });

  return {
    status: 'success',
    message: `Deleted ${count} bucket image(s) from storage + database.`,
    affected: count ?? 0,
  };
}

// ─── Task 3: Delete project messages (employee ↔ client chat) ─────
async function deleteProjectMessages(): Promise<{ status: 'success' | 'skipped' | 'error'; message: string; affected: number }> {
  if (eligibleProjectIds.length === 0) {
    return { status: 'skipped', message: 'No eligible projects.', affected: 0 };
  }

  // Delete all document attachments linked to messages of these projects first
  // (FK constraint: documents.messageId → project_messages.id)
  const messages = await prisma.projectMessage.findMany({
    where: { projectId: { in: eligibleProjectIds } },
    select: { id: true },
  });

  const messageIds = messages.map(m => m.id);

  if (messageIds.length > 0) {
    // 1. Delete attached documents from DB (storage URLs are already external/enquiry-files bucket)
    await prisma.document.deleteMany({
      where: { messageId: { in: messageIds } },
    });
  }

  // 2. Delete the messages themselves (cascade won't help here since we need to control order)
  const { count } = await prisma.projectMessage.deleteMany({
    where: { projectId: { in: eligibleProjectIds } },
  });

  return {
    status: 'success',
    message: `Deleted ${count} project message(s) (employee↔client chat) across ${eligibleProjectIds.length} project(s).`,
    affected: count ?? 0,
  };
}

// ─── Task 4: Delete project-level documents from DB ───────────────
// (The actual PDF report has already been delivered; we only clean DB refs)
async function deleteProjectDocuments(): Promise<{ status: 'success' | 'skipped'; message: string; affected: number }> {
  if (eligibleProjectIds.length === 0) {
    return { status: 'skipped', message: 'No eligible projects.', affected: 0 };
  }

  const { count } = await prisma.document.deleteMany({
    where: { projectId: { in: eligibleProjectIds } },
  });

  return {
    status: 'success',
    message: `Deleted ${count} project document reference(s) from DB.`,
    affected: count ?? 0,
  };
}

// ─── Route Handler ───────────────────────────────────────────────

export async function GET(request: Request) {
  const tasks: CronTask[] = [
    {
      name: 'Find eligible TERMINATED projects (>24h old)',
      run: findTerminatedProjects,
    },
    {
      name: 'Delete photo bucket images (Supabase Storage + DB)',
      run: deletePhotoBucket,
    },
    {
      name: 'Delete employee↔client project chat messages',
      run: deleteProjectMessages,
    },
    {
      name: 'Delete project document references from DB',
      run: deleteProjectDocuments,
    },
  ];

  return runCronJob('cleanup-terminated-projects', tasks, request);
}
