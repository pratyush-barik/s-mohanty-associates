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

  const targetProjectId = "cmrxhff30000104l12cd2ggzb";
  const targetServiceRequestId = "cmrxhfes3000004l18bultnq1";

  console.log(`Starting cleanup for project ID: ${targetProjectId}...`);

  // 1. Delete associated project messages
  const msgDel = await prisma.projectMessage.deleteMany({
    where: { projectId: targetProjectId }
  });
  console.log(`Deleted ${msgDel.count} messages.`);

  // 2. Delete associated documents
  const docDel = await prisma.document.deleteMany({
    where: {
      OR: [
        { projectId: targetProjectId },
        { serviceRequestId: targetServiceRequestId }
      ]
    }
  });
  console.log(`Deleted ${docDel.count} documents.`);

  // 3. Delete the project itself (this will cascade delete inspection/report)
  try {
    const projDel = await prisma.project.delete({
      where: { id: targetProjectId }
    });
    console.log(`Successfully deleted project Code: ${projDel.projectCode}`);
  } catch (err: any) {
    console.log("Project deletion notice:", err.message);
  }

  // 4. Delete the associated service request
  try {
    const srDel = await prisma.serviceRequest.delete({
      where: { id: targetServiceRequestId }
    });
    console.log(`Successfully deleted service request ID: ${srDel.id} (${srDel.contactName})`);
  } catch (err: any) {
    console.log("Service request deletion notice:", err.message);
  }

  console.log("Cleanup completed successfully!");

  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
