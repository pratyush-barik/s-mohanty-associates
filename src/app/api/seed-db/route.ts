import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    // 1. Clear any existing data
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

    // 2. Seed Employees
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

    // 3. Seed Client (Individual)
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

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully with new separate tables and user IDs.',
      data: {
        owner: owner.employeeId,
        manager: manager.employeeId,
        reportAgent: reportAgent.employeeId,
        fieldAgent: fieldAgent.employeeId,
        client: client.clientId,
      },
    });
  } catch (error: any) {
    console.error('Seeding error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Seeding failed' },
      { status: 500 }
    );
  }
}
