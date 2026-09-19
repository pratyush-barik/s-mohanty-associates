import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { decodeHtmlEntitiesDeep } from '@/lib/html-entities';

/**
 * POST /api/save-draft
 * Beacon-compatible endpoint for reliable save-on-close.
 * sendBeacon() sends application/x-www-form-urlencoded or text/plain,
 * but we accept JSON body for direct fetch fallback as well.
 * 
 * Body: { projectId: string, fields: object }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: { projectId?: string; fields?: any } = {};

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      body = await req.json();
    } else {
      // sendBeacon sends text/plain — body is raw JSON string
      const text = await req.text();
      if (text) {
        try { body = JSON.parse(text); } catch { /* ignore malformed */ }
      }
    }

    const { projectId, fields } = body;

    if (!projectId || typeof projectId !== 'string') {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { report: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const user = await prisma.employee.findUnique({ where: { id: session.user.id } });
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role === 'REPORT_EMPLOYEE' && project.reportEmployeeId && project.reportEmployeeId !== session.user.id) {
      return NextResponse.json({ error: 'Not assigned to this report' }, { status: 403 });
    }

    const cleanFields = decodeHtmlEntitiesDeep(fields || {});

    if (project.report) {
      await prisma.report.update({
        where: { id: project.report.id },
        data: { data: cleanFields, status: 'DRAFTING' },
      });
    } else {
      await prisma.report.create({
        data: {
          projectId,
          employeeId: project.reportEmployeeId || session.user.id,
          status: 'DRAFTING',
          data: cleanFields,
        },
      });
      if (project.status !== 'MANAGER_REVIEW') {
        await prisma.project.update({
          where: { id: projectId },
          data: { status: 'REPORT_DRAFTING' },
        });
      }
    }

    return NextResponse.json({ success: true, savedAt: new Date().toISOString() });
  } catch (err) {
    console.error('[save-draft] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
