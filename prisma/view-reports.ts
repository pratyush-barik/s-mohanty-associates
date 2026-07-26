import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

async function main() {
  console.log("Connecting to database...");
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not defined in process.env!");
  }
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("Fetching all reports...");
  const reports = await prisma.report.findMany({
    include: {
      project: {
        select: { projectCode: true }
      }
    }
  });

  if (reports.length === 0) {
    console.log("No reports found in the database.");
  } else {
    reports.forEach((r, idx) => {
      console.log(`\n================ REPORT #${idx + 1} ================`);
      console.log(`Report ID:    ${r.id}`);
      console.log(`Project Code: ${r.project?.projectCode} (${r.projectId})`);
      console.log(`Status:       ${r.status}`);
      console.log(`Created At:   ${r.createdAt}`);
      console.log("Data Fields:  ", JSON.stringify(r.data, null, 2));
    });
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
