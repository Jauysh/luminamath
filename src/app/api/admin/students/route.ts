import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from '@/lib/auth';
import { getAllStudents, getBranches, isEmailAuthorizedAdmin } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function isAuthorized(req: NextRequest): Promise<boolean> {
  const session = getAdminSessionFromRequest(req);
  if (session) {
    const admin = await isEmailAuthorizedAdmin(session.email);
    if (admin) return true;
  }
  return false;
}

export async function GET(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const branchCode = req.nextUrl.searchParams.get('branchCode')
      ? Number(req.nextUrl.searchParams.get('branchCode'))
      : undefined;
    const grade = req.nextUrl.searchParams.get('grade')
      ? Number(req.nextUrl.searchParams.get('grade'))
      : undefined;
    const language = req.nextUrl.searchParams.get('language') || undefined;
    const search = req.nextUrl.searchParams.get('search') || undefined;
    const format = req.nextUrl.searchParams.get('format');

    const [students, branches] = await Promise.all([
      getAllStudents({ branchCode, grade, language, search }),
      getBranches(true),
    ]);

    if (format === 'csv') {
      const bom = '\uFEFF';
      const header = [
        'STUDENT_ID',
        'ACCESS_PIN',
        'FIRST_NAME',
        'LAST_NAME',
        'GRADE',
        'EXAM_LANGUAGE',
        'BRANCH_CODE',
        'BRANCH_NAME',
        'SCHOOL',
        'TEACHER_NAME',
        'EMAIL',
        'PHONE',
        'HAS_RESULT_PDF',
        'REGISTERED_AT',
      ].join(',');

      const escapeCsv = (val: unknown) => {
        const str = String(val ?? '').replace(/"/g, '""');
        return `"${str}"`;
      };

      const rows = students.map((s) =>
        [
          escapeCsv(s.student_code),
          escapeCsv(s.access_pin),
          escapeCsv(s.first_name),
          escapeCsv(s.last_name),
          escapeCsv(s.grade),
          escapeCsv(s.exam_language),
          escapeCsv(s.branch_code),
          escapeCsv(s.branch_name_ro || ''),
          escapeCsv(s.school),
          escapeCsv(s.teacher_name),
          escapeCsv(s.email),
          escapeCsv(s.phone),
          escapeCsv(s.has_result_pdf ? 'YES' : 'NO'),
          escapeCsv(s.created_at),
        ].join(',')
      );

      const csvContent = bom + [header, ...rows].join('\r\n');
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="LuminaMath_Students_OMR_Export.csv"',
        },
      });
    }

    return NextResponse.json({
      students,
      branches,
      stats: {
        totalStudents: students.length,
        withPdf: students.filter((s) => s.has_result_pdf).length,
        withoutPdf: students.filter((s) => !s.has_result_pdf).length,
      },
    });
  } catch (error) {
    console.error('[GET /api/admin/students] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
