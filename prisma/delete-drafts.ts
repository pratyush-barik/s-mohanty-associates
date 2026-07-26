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

  console.log("Querying all projects and their reports...");
  const projects = await prisma.project.findMany({
    include: { report: true }
  });
  console.log("Projects and reports:", JSON.stringify(projects, null, 2));

  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
