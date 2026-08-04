/**
 * Generic Cron Job Framework — S. Mohanty Associates
 * 
 * Usage:
 *   import { runCronJob, CronTask } from '@/lib/cron/runner';
 * 
 * Every cron route just defines a list of CronTasks and calls runCronJob().
 * The runner handles: auth, logging, error isolation, result summarising.
 */

import { NextResponse } from 'next/server';

// ─── Types ───────────────────────────────────────────────────────

export interface CronTaskResult {
  task: string;
  status: 'success' | 'skipped' | 'error';
  message?: string;
  affected?: number;       // rows deleted / processed
  durationMs?: number;
  details?: Record<string, any>;
}

export interface CronRunResult {
  jobName: string;
  ranAt: string;
  totalTasks: number;
  successCount: number;
  skippedCount: number;
  errorCount: number;
  totalDurationMs: number;
  results: CronTaskResult[];
}

/**
 * A CronTask defines a named unit of work.
 * 
 * @param name      Human-readable task name shown in logs + response.
 * @param run       Async function that performs the work. 
 *                  Return a CronTaskResult (status, message, affected, details).
 */
export interface CronTask {
  name: string;
  run: () => Promise<Omit<CronTaskResult, 'task' | 'durationMs'>>;
}

// ─── Auth Helper ─────────────────────────────────────────────────

/**
 * Validates the Bearer token from the Authorization header.
 * Uses CRON_SECRET env var. If not set, access is open (dev mode).
 */
export function validateCronAuth(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true; // No secret set → open in dev

  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${cronSecret}`;
}

// ─── Runner ──────────────────────────────────────────────────────

/**
 * Executes a list of CronTasks in sequence.
 * Each task is isolated — one failure does NOT abort the rest.
 * 
 * @param jobName   Display name for the job (used in logs & response).
 * @param tasks     Ordered list of CronTasks to execute.
 * @param request   The incoming Next.js request (used for auth check).
 * @returns         NextResponse with full result summary.
 */
export async function runCronJob(
  jobName: string,
  tasks: CronTask[],
  request: Request
): Promise<NextResponse> {
  // ── Auth ───────────────────────────────────────────────────────
  if (!validateCronAuth(request)) {
    console.warn(`[CRON][${jobName}] Unauthorized access attempt`);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const jobStart = Date.now();
  console.log(`\n[CRON][${jobName}] ▶ Starting at ${new Date().toISOString()}`);

  const results: CronTaskResult[] = [];

  // ── Run each task ─────────────────────────────────────────────
  for (const task of tasks) {
    const taskStart = Date.now();
    console.log(`[CRON][${jobName}] → Running task: "${task.name}"`);

    try {
      const result = await task.run();
      const durationMs = Date.now() - taskStart;

      const taskResult: CronTaskResult = {
        task: task.name,
        durationMs,
        ...result,
      };

      results.push(taskResult);

      if (result.status === 'success') {
        console.log(`[CRON][${jobName}] ✅ "${task.name}" — ${result.message ?? ''} (${result.affected ?? 0} affected, ${durationMs}ms)`);
      } else if (result.status === 'skipped') {
        console.log(`[CRON][${jobName}] ⏭  "${task.name}" — Skipped: ${result.message ?? ''} (${durationMs}ms)`);
      } else {
        console.error(`[CRON][${jobName}] ❌ "${task.name}" — Error: ${result.message ?? ''} (${durationMs}ms)`);
      }
    } catch (err: any) {
      const durationMs = Date.now() - taskStart;
      const errorMessage = err?.message ?? String(err);

      console.error(`[CRON][${jobName}] 💥 "${task.name}" threw an exception: ${errorMessage}`);

      results.push({
        task: task.name,
        status: 'error',
        message: errorMessage,
        durationMs,
      });
    }
  }

  // ── Summarise ─────────────────────────────────────────────────
  const totalDurationMs = Date.now() - jobStart;
  const successCount = results.filter(r => r.status === 'success').length;
  const skippedCount = results.filter(r => r.status === 'skipped').length;
  const errorCount   = results.filter(r => r.status === 'error').length;

  const summary: CronRunResult = {
    jobName,
    ranAt: new Date().toISOString(),
    totalTasks: tasks.length,
    successCount,
    skippedCount,
    errorCount,
    totalDurationMs,
    results,
  };

  const statusLine = `✅ ${successCount} succeeded | ⏭ ${skippedCount} skipped | ❌ ${errorCount} errors | ⏱ ${totalDurationMs}ms`;
  console.log(`[CRON][${jobName}] ◼ Done — ${statusLine}\n`);

  // Return 207 Multi-Status if there were any errors (but job ran)
  const httpStatus = errorCount > 0 ? 207 : 200;
  return NextResponse.json(summary, { status: httpStatus });
}
