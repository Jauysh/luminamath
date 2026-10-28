import { NextRequest, NextResponse } from 'next/server';
import {
  checkRateLimit,
  getAdminSessionFromRequest,
  getClientIp,
  isRateLimitExceeded,
  timingSafePinMatch,
} from '@/lib/auth';
import { getStudentByCode, isEmailAuthorizedAdmin } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { studentCode: string } }
) {
  const ip = getClientIp(req);
  const code = (params.studentCode || '').trim();

  // School-wide NAT allowance (600 checks / 10 min per IP) + strict per-student failed PIN lockout (max 15 wrong PINs / 15 min)
  const ipLimit = checkRateLimit(`results_ip:${ip}`, 600, 10 * 60);
  if (!ipLimit.allowed || isRateLimitExceeded(`pin_fail:${code}`, 15)) {
    return NextResponse.json(
      {
        error:
          'Prea multe încercări. Vă rugăm să așteptați câteva minute. / Слишком много попыток.',
      },
      { status: 429 }
    );
  }

  try {
    const pin = (req.nextUrl.searchParams.get('pin') || '').trim();

    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: 'ID-ul trebuie să conțină exact 6 cifre / ID должен состоять из 6 цифр' },
        { status: 400 }
      );
    }

    const student = await getStudentByCode(code);
    if (!student) {
      checkRateLimit(`pin_fail:${code}`, 15, 15 * 60);
      return NextResponse.json(
        {
          error:
            'ID-ul sau Parola (Codul PIN) este incorectă / Неверный ID или Пароль (PIN) / Invalid ID or PIN',
        },
        { status: 401 }
      );
    }

    // Check if caller has valid PIN (constant-time) OR is an authenticated Admin
    let authorized = Boolean(
      pin && student.access_pin && timingSafePinMatch(pin, student.access_pin)
    );
    if (!authorized) {
      const adminSession = getAdminSessionFromRequest(req);
      if (adminSession && (await isEmailAuthorizedAdmin(adminSession.email))) {
        authorized = true;
      }
    }

    if (!authorized) {
      checkRateLimit(`pin_fail:${code}`, 15, 15 * 60);
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
