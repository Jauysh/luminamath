import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getAdminSessionFromRequest, getClientIp } from '@/lib/auth';
import { getStudentByCode, isEmailAuthorizedAdmin } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { studentCode: string } }
) {
  const ip = getClientIp(req);
  const limit = checkRateLimit(`results:${ip}`, 25, 10 * 60); // Brute-force protection
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error:
          'Prea multe încercări. Vă rugăm să așteptați câteva minute. / Слишком много попыток.',
      },
      { status: 429 }
    );
  }

  try {
    const code = (params.studentCode || '').trim();
    const pin = (req.nextUrl.searchParams.get('pin') || '').trim();

    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: 'ID-ul trebuie să conțină exact 6 cifre / ID должен состоять из 6 цифр' },
        { status: 400 }
      );
    }

    const student = await getStudentByCode(code);
    if (!student) {
      return NextResponse.json(
        {
          error:
            'ID-ul sau Parola (Codul PIN) este incorectă / Неверный ID или Пароль (PIN) / Invalid ID or PIN',
        },
        { status: 401 }
      );
    }

    // Check if caller has valid PIN OR is an authenticated Admin
    let authorized = Boolean(pin && student.access_pin && pin === student.access_pin);
    if (!authorized) {
      const adminSession = getAdminSessionFromRequest(req);
      if (adminSession && (await isEmailAuthorizedAdmin(adminSession.email))) {
        authorized = true;
      }
    }

    if (!authorized) {
      return NextResponse.json(
        {
          error:
            'ID-ul sau Parola (Codul PIN) este incorectă / Неверный ID или Пароль (PIN) / Invalid ID or PIN',
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      student: {
        student_code: student.student_code,
        access_pin: student.access_pin,
        first_name: student.first_name,
        last_name: student.last_name,
        grade: student.grade,
        school: student.school,
        teacher_name: student.teacher_name,
        exam_language: student.exam_language,
        branch_code: student.branch_code,
        branch_name_ro: student.branch_name_ro,
        branch_name_ru: student.branch_name_ru,
        branch_name_en: student.branch_name_en,
        branch_address: student.branch_address,
        has_result_pdf: student.has_result_pdf,
        result_uploaded_at: student.result_uploaded_at,
        created_at: student.created_at,
      },
    });
  } catch (error) {
    console.error('[GET /api/results/[studentCode]] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
