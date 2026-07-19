import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
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

    return NextResponse.json({ success: true, fieldEmployees });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
