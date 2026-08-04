import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin, STORAGE_BUCKETS } from '@/lib/supabase';
import { runCronJob, CronTask } from '@/lib/cron/runner';

export const dynamic = 'force-dynamic';

// Shared state between tasks
let projectIds: string[] = [];

const tasks: CronTask[] = [
  {
    name: 'Find COMPLETED projects older than 48h',
    run: async () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const projects = await prisma.project.findMany({
        where: { status: 'COMPLETED', updatedAt: { lt: twoDaysAgo } },
        select: { id: true, projectCode: true },
      });

      projectIds = projects.map(p => p.id);

      if (projects.length === 0) {
        return { status: 'skipped', message: 'No eligible projects found.', affected: 0 };
      }

      return {
        status: 'success',
        message: `Found ${projects.length} eligible project(s).`,
        affected: projects.length,
        details: { codes: projects.map(p => p.projectCode) },
      };
    },
  },
  {
    name: 'Delete bucket images from Supabase Storage + DB',
    run: async () => {
      if (projectIds.length === 0) {
        return { status: 'skipped', message: 'No eligible projects.', affected: 0 };
      }

      const images = await prisma.bucketImage.findMany({
        where: { projectId: { in: projectIds } },
        select: { id: true, storagePath: true },
      });

      if (images.length === 0) {
        return { status: 'skipped', message: 'No images found.', affected: 0 };
      }

      const { error: storageError } = await supabaseAdmin.storage
        .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
        .remove(images.map(img => img.storagePath));

      if (storageError) {
        return { status: 'error', message: storageError.message, affected: 0 };
      }

      const { count } = await prisma.bucketImage.deleteMany({
        where: { id: { in: images.map(img => img.id) } },
      });

      return {
        status: 'success',
        message: `Deleted ${count} image(s) from storage + DB.`,
        affected: count ?? 0,
      };
    },
  },
];

export async function GET(request: Request) {
  return runCronJob('cleanup-completed-buckets', tasks, request);
}
