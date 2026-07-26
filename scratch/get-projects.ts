import { prisma } from '../src/lib/prisma';
async function main() {
  const projects = await prisma.project.findMany({
    take: 5,
    orderBy: { updatedAt: 'desc' },
    select: { id: true, projectCode: true }
  });
  console.log('Projects:', JSON.stringify(projects, null, 2));
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
