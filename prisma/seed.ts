import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Clear any existing data
  await prisma.auditLog.deleteMany();
  await prisma.projectMessage.deleteMany();
  await prisma.document.deleteMany();
  await prisma.report.deleteMany();
  await prisma.inspection.deleteMany();
  await prisma.project.deleteMany();
  await prisma.serviceRequest.deleteMany();
  await prisma.individualProfile.deleteMany();
  await prisma.organisationProfile.deleteMany();
  await prisma.client.deleteMany();
  await prisma.employee.deleteMany();

  const hashedPassword = await bcrypt.hash('password123', 10);

  // Seed Employees
  const owner = await prisma.employee.create({
    data: {
      name: 'Satyajit Mohanty',
      email: 'owner@example.com',
      password: hashedPassword,
      role: 'OWNER',
      employeeId: '0000O',
      designation: 'Owner & Registered Valuer',
      mobile: '9437012345',
    },
  });

  const manager = await prisma.employee.create({
    data: {
      name: 'S.K. Senapati',
      email: 'manager@example.com',
      password: hashedPassword,
      role: 'MANAGER',
      employeeId: '1000M',
      designation: 'General Manager',
      mobile: '9861012345',
    },
  });

  const reportAgent = await prisma.employee.create({
    data: {
      name: 'Pratyush Barik',
      email: 'report@example.com',
      password: hashedPassword,
      role: 'REPORT_EMPLOYEE',
      employeeId: '1001R',
      designation: 'Report Analyst',
      mobile: '7008012345',
    },
  });

  const fieldAgent = await prisma.employee.create({
    data: {
      name: 'Debasish Panda',
      email: 'field@example.com',
      password: hashedPassword,
      role: 'FIELD_EMPLOYEE',
      employeeId: '1002F',
      designation: 'Field Inspector',
      mobile: '9937012345',
    },
  });

  // Seed Client (Individual)
  const client = await prisma.client.create({
    data: {
      email: 'client@example.com',
      password: hashedPassword,
      clientId: 'C1000',
      clientType: 'INDIVIDUAL',
      individual: {
        create: {
          name: 'Amit Kumar',
          mobile: '9876543210',
        },
      },
    },
  });

  console.log('Seeding completed successfully!');
  console.log({
    owner: owner.employeeId,
    manager: manager.employeeId,
    reportAgent: reportAgent.employeeId,
    fieldAgent: fieldAgent.employeeId,
    client: client.clientId,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
