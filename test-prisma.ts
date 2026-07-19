import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  try {
    const fieldEmployees = await prisma.employee.findMany({
      where: { role: 'FIELD_EMPLOYEE', isActive: true },
      select: {
        id: true,
        name: true,
        employeeId: true,
        _count: {
          select: {
            fieldProjects: {
              where: { status: { notIn: ['COMPLETED', 'ARCHIVED'] } },
            },
          },
        },
      },
    });
    console.log("Success:", fieldEmployees);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
