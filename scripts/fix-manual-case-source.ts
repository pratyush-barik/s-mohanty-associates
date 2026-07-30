/**
 * One-time migration script to fix the source field for manually created projects.
 * 
 * Bug: Projects created via the manual case feature (isEmailOnly = true) before the
 * source fix was applied got the default source value of 'WEBSITE' instead of 'EXTERNAL'.
 * 
 * Usage: npx tsx scripts/fix-manual-case-source.ts
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL!;
if (!connectionString) {
  console.error('❌ DATABASE_URL is not set. Make sure .env file exists.');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Find all projects that are email-only but incorrectly marked as WEBSITE
  const badProjects = await prisma.project.findMany({
    where: {
      isEmailOnly: true,
      source: 'WEBSITE',
    },
    select: {
      id: true,
      projectCode: true,
      source: true,
    },
  });

  if (badProjects.length === 0) {
    console.log('✅ No projects need fixing. All manual cases already have correct source.');
    return;
  }

  console.log(`Found ${badProjects.length} manual case(s) with incorrect source:`);
  for (const p of badProjects) {
    console.log(`  - ${p.projectCode} (${p.id}): ${p.source} → EXTERNAL`);
  }

  // Update them all
  const result = await prisma.project.updateMany({
    where: {
      isEmailOnly: true,
      source: 'WEBSITE',
    },
    data: {
      source: 'EXTERNAL',
    },
  });

  console.log(`\n✅ Fixed ${result.count} project(s). Source updated from WEBSITE → EXTERNAL.`);
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
