import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/auth';
import {
  getSiteSettings,
  getStudentsByEmail,
  markStudentEmailStatus,
} from '@/lib/db';
import { sendRegistrationEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const ipLimit = checkRateLimit(`recover_ip:${ip}`, 15, 10 * 60);
  if (!ipLimit.allowed) {
    return NextResponse.json(
      {
        error:
          'Prea multe cereri. Vă rugăm să încercați peste câteva minute. / Слишком много запросов.',
      },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const email = String(body.email || '')
      .trim()
      .toLowerCase();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        {
          error:
            'Introduceți o adresă de email validă / Введите корректный email / Enter a valid email',
        },
        { status: 400 }
      );
    }

    const emailLimit = checkRateLimit(`recover_email:${email}`, 3, 10 * 60);
    if (!emailLimit.allowed) {
      return NextResponse.json(
        {
          error:
            'Email-ul a fost deja trimis recent către această adresă. Verificați Inbox / Spam.',
        },
        { status: 429 }
      );
    }

    const students = await getStudentsByEmail(email);
    if (students.length === 0) {
      return NextResponse.json(
        {
          error:
            'Nu am găsit niciun participant înregistrat cu această adresă de email. / Участник с таким email не найден. / No participant found with this email.',
        },
        { status: 404 }
      );
    }

    const settings = await getSiteSettings();
    const origin =
      req.headers.get('origin') ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'https://luminamath.orizont.md';

    let sentCount = 0;
    for (const student of students) {
      const dateForLang =
        student.exam_language === 'RU'
          ? settings.stage2_date_ru
          : student.exam_language === 'EN'
          ? settings.stage2_date_en
          : settings.stage2_date_ro;

      const branchNameForLang =
        student.exam_language === 'RU'
          ? student.branch_name_ru || student.branch_name_ro
          : student.exam_language === 'EN'
          ? student.branch_name_en || student.branch_name_ro
          : student.branch_name_ro;

      const res = await sendRegistrationEmail({
        to: student.email,
        studentCode: student.student_code,
        accessPin: student.access_pin,
        firstName: student.first_name,
        lastName: student.last_name,
        grade: student.grade,
        school: student.school,
        teacherName: student.teacher_name,
        examLanguage: student.exam_language,
        branchName: branchNameForLang || `Filiala #${student.branch_code}`,
        branchAddress: student.branch_address || 'Chișinău',
        examDateText: `${dateForLang}, ${settings.exam_time}`,
        resultsUrl: `${origin}/results?id=${student.student_code}&pin=${student.access_pin}`,
      });

      if (res.sent) {
        sentCount += 1;
        await markStudentEmailStatus(student.student_code, 'registration', true);
      }
    }

    return NextResponse.json({
      success: true,
      count: students.length,
      sentCount,
    });
  } catch (error) {
    console.error('[POST /api/results/recover] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
