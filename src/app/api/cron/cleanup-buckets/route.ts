import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin, STORAGE_BUCKETS } from '@/lib/supabase';

// Prevent Next.js from caching this API route
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[CRON] Starting Bucket Cleanup...');

    // 2. Find all projects that were COMPLETED more than 48 hours ago
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const oldCompletedProjects = await prisma.project.findMany({
      where: {
        status: 'COMPLETED',
        updatedAt: {
          lt: twoDaysAgo
        }
      },
      select: { id: true, projectCode: true }
    });

    if (oldCompletedProjects.length === 0) {
      console.log('[CRON] No eligible projects found for bucket cleanup.');
      return NextResponse.json({ success: true, deletedCount: 0, message: 'No eligible projects' });
    }

    const projectIds = oldCompletedProjects.map(p => p.id);
    console.log(`[CRON] Found ${projectIds.length} completed projects eligible for cleanup.`);

    // 3. Find all images belonging to these projects
    const imagesToDelete = await prisma.bucketImage.findMany({
      where: {
        projectId: { in: projectIds }
      }
    });

    if (imagesToDelete.length === 0) {
      console.log('[CRON] No images found inside eligible projects.');
      return NextResponse.json({ success: true, deletedCount: 0, message: 'No images to delete' });
    }

    console.log(`[CRON] Deleting ${imagesToDelete.length} images from Supabase Storage...`);

    // 4. Delete files from Supabase Storage
    const storagePaths = imagesToDelete.map(img => img.storagePath);
    
    // Supabase allows bulk deletion
    const { error: storageError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
      .remove(storagePaths);

    if (storageError) {
      console.error('[CRON] Error deleting files from Supabase:', storageError);
      return NextResponse.json({ error: 'Failed to delete from storage' }, { status: 500 });
    }

    // 5. Delete records from database
    const { count } = await prisma.bucketImage.deleteMany({
      where: {
        id: { in: imagesToDelete.map(img => img.id) }
      }
    });

    console.log(`[CRON] Successfully deleted ${count} images from the database.`);

    return NextResponse.json({ 
      success: true, 
      deletedCount: count,
      projectsProcessed: projectIds.length 
    });

  } catch (error) {
    console.error('[CRON] Bucket Cleanup Failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
