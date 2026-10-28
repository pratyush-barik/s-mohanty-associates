import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('ERROR: DATABASE_URL is not set in environment or .env');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function migrateProjectCodes() {
  const isExecute = process.argv.includes('--execute');
  const mode = isExecute ? 'EXECUTE' : 'DRY-RUN';

  console.log(`\n======================================================`);
  console.log(`  PROJECT CODE MIGRATION (${mode} MODE)`);
  console.log(`  Format: SMA-YYYY-NNN  →  SMA-YYYY/MM-NNNN`);
  console.log(`======================================================\n`);

  // Fetch all projects that do not already have a '/' in their projectCode
  const projects = await prisma.project.findMany({
    where: {
      projectCode: { not: { contains: '/' } }
    },
    include: {
      report: {
        select: { id: true, data: true }
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  if (projects.length === 0) {
    console.log('No legacy project codes found. All projects already conform to SMA-YYYY/MM-NNNN.');
    return;
  }

  console.log(`Found ${projects.length} legacy project(s) to migrate.\n`);

  // Group by YYYY/MM derived from createdAt
  const groups: Record<string, typeof projects> = {};
  for (const p of projects) {
    const d = new Date(p.createdAt);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const key = `${yyyy}/${mm}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  }

  const plannedUpdates: {
    projectId: string;
    oldCode: string;
    newCode: string;
    createdAt: string;
    status: string;
    hasReportDraft: boolean;
    reportId?: string;
    updatedReportData?: Record<string, any>;
  }[] = [];

  for (const [yearMonth, groupProjects] of Object.entries(groups)) {
    // Count any already migrated projects for this year/month
    const existingCount = await prisma.project.count({
      where: {
        projectCode: { startsWith: `SMA-${yearMonth}-` }
      }
    });

    let serial = existingCount + 1;

    for (const p of groupProjects) {
      const newCode = `SMA-${yearMonth}-${String(serial).padStart(4, '0')}`;
      let updatedReportData: Record<string, any> | undefined;

      if (p.report?.data && typeof p.report.data === 'object') {
        const d = { ...(p.report.data as Record<string, any>) };
        // Update refNo if it matches oldCode, is empty, or uses an old alias
        if (d.refNo === p.projectCode || !d.refNo || d.caseRefNo === p.projectCode || d.proposalNo === p.projectCode) {
          d.refNo = newCode;
        }
        updatedReportData = d;
      }

      plannedUpdates.push({
        projectId: p.id,
        oldCode: p.projectCode,
        newCode,
        createdAt: p.createdAt.toISOString().slice(0, 10),
        status: p.status,
        hasReportDraft: Boolean(p.report),
        reportId: p.report?.id,
        updatedReportData
      });

      serial++;
    }
  }

  // Display summary table
  console.log('-----------------------------------------------------------------------------------------');
  console.log('| Old Code       | Created Date | Status           | New Standard Code      | Draft Sync |');
  console.log('-----------------------------------------------------------------------------------------');
  for (const u of plannedUpdates) {
    const oldP = u.oldCode.padEnd(14, ' ');
    const dateP = u.createdAt.padEnd(12, ' ');
    const statusP = u.status.padEnd(16, ' ');
    const newP = u.newCode.padEnd(22, ' ');
    const draftP = u.hasReportDraft ? 'YES' : 'NO';
    console.log(`| ${oldP} | ${dateP} | ${statusP} | ${newP} | ${draftP.padEnd(10, ' ')} |`);
  }
  console.log('-----------------------------------------------------------------------------------------\n');

  if (!isExecute) {
    console.log('DRY-RUN COMPLETE: 0 database modifications made.');
    console.log('To execute this migration against the database, run:');
    console.log('  npx tsx scripts/migrate-project-codes.ts --execute\n');
    return;
  }

  // Execution phase
  console.log('Executing database updates...');
  let updatedCount = 0;

  for (const u of plannedUpdates) {
    // 1. Update projectCode
    await prisma.project.update({
      where: { id: u.projectId },
      data: { projectCode: u.newCode }
    });

    // 2. Update report draft data if present
    if (u.reportId && u.updatedReportData) {
      await prisma.report.update({
        where: { id: u.reportId },
        data: { data: u.updatedReportData }
      });
    }

    updatedCount++;
    console.log(`  ✓ Migrated: ${u.oldCode} → ${u.newCode}`);
  }

  console.log(`\nSUCCESS: ${updatedCount} project(s) migrated to SMA-YYYY/MM-NNNN.\n`);
}

migrateProjectCodes()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

