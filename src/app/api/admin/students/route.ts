import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from '@/lib/auth';
import {
  getAllStudents,
  getBranches,
  isEmailAuthorizedAdmin,
  updateStudentDetails,
} from '@/lib/db';

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
    const schoolCode = req.nextUrl.searchParams.get('schoolCode')
      ? Number(req.nextUrl.searchParams.get('schoolCode'))
      : undefined;
    const grade = req.nextUrl.searchParams.get('grade')
      ? Number(req.nextUrl.searchParams.get('grade'))
      : undefined;
    const language = req.nextUrl.searchParams.get('language') || undefined;
    const search = req.nextUrl.searchParams.get('search') || undefined;
    const format = req.nextUrl.searchParams.get('format');

    const [students, allStudents, branches] = await Promise.all([
      getAllStudents({ branchCode, schoolCode, grade, language, search }),
      getAllStudents(),
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
        'SCHOOL_CODE',
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
          escapeCsv(String(s.school_code || 8).padStart(2, '0')),
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
      allStudents,
      branches,
      stats: {
        totalStudents: allStudents.length,
        withPdf: allStudents.filter((s) => s.has_result_pdf).length,
        withoutPdf: allStudents.filter((s) => !s.has_result_pdf).length,
      },
    });
  } catch (error) {
    console.error('[GET /api/admin/students] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      studentCode,
      firstName,
      lastName,
      grade,
      school,
      schoolCode,
      teacherName,
      examLanguage,
      branchCode,
      email,
      phone,
    } = body;

    if (
      !studentCode ||
      !firstName?.trim() ||
      !lastName?.trim() ||
      !grade ||
      !school?.trim() ||
      !teacherName?.trim() ||
      !examLanguage ||
      !branchCode
    ) {
      return NextResponse.json(
        { error: 'Toate câmpurile principale sunt obligatorii' },
        { status: 400 }
      );
    }

    const updated = await updateStudentDetails(String(studentCode), {
      firstName: String(firstName),
      lastName: String(lastName),
      grade: Number(grade),
      school: String(school),
      schoolCode: Number(schoolCode) || 8,
      teacherName: String(teacherName),
      examLanguage: (['RO', 'RU', 'EN'].includes(examLanguage) ? examLanguage : 'RO') as
        | 'RO'
        | 'RU'
        | 'EN',
      branchCode: Number(branchCode),
      email: String(email || ''),
      phone: String(phone || ''),
    });

    if (!updated) {
      return NextResponse.json({ error: 'Elevul nu a fost găsit' }, { status: 404 });
    }

    return NextResponse.json({ success: true, student: updated });
  } catch (error) {
    console.error('[PUT /api/admin/students] Error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
