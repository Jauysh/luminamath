import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/auth';
import {
  getSiteSettings,
  isRegistrationCurrentlyOpen,
  markStudentEmailStatus,
  registerStudent,
} from '@/lib/db';
import { sendRegistrationEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  // Allow up to 300 registrations per 10 minutes per IP so entire school computer labs / teachers on shared NAT Wi-Fi are never blocked
  const limit = checkRateLimit(`register:${ip}`, 300, 10 * 60);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many registration requests from this IP. Please try again in a few minutes.' },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();

    // Anti-bot honeypot field check
    if (body.website_url) {
      return NextResponse.json({ error: 'Spam detected' }, { status: 400 });
    }

    const {
      firstName,
      lastName,
      grade,
      school,
      schoolCode,
      teacherName,
      examLanguage,
      branchId,
      email,
      phone,
    } = body;

    if (
      !firstName?.trim() ||
      !lastName?.trim() ||
      !grade ||
      !school?.trim() ||
      !teacherName?.trim() ||
      !examLanguage ||
      !branchId ||
      !email?.trim() ||
      !phone?.trim()
    ) {
      return NextResponse.json(
        { error: 'Toate câmpurile sunt obligatorii / Все поля обязательны / All fields are required' },
        { status: 400 }
      );
    }

    const numericGrade = Number(grade);
    if (isNaN(numericGrade) || numericGrade < 3 || numericGrade > 8) {
      return NextResponse.json(
        { error: 'Clasa trebuie să fie între III și VIII (3–8) / Класс должен быть с 3 по 8 / Grade must be between 3 and 8' },
        { status: 400 }
      );
    }

    const numericSchoolCode = Number(schoolCode) || 8;
    if (numericSchoolCode === 7 && numericGrade > 4) {
      return NextResponse.json(
        { error: 'Orizont Kindergarten School este destinată doar claselor III – IV (3–4).' },
        { status: 400 }
      );
    }

    const validLangs = ['RO', 'RU', 'EN'];
    const lang = (validLangs.includes(examLanguage) ? examLanguage : 'RO') as 'RO' | 'RU' | 'EN';

    const settings = await getSiteSettings();
    if (!isRegistrationCurrentlyOpen(settings)) {
      return NextResponse.json(
        {
          error:
            'Înregistrarea la concursul LuminaMath Moldova s-a încheiat. / Регистрация на олимпиаду LuminaMath Moldova завершена. / Registration for LuminaMath Moldova is now closed.',
        },
        { status: 403 }
      );
    }

    const student = await registerStudent({
      firstName: String(firstName).slice(0, 100),
      lastName: String(lastName).slice(0, 100),
      grade: numericGrade,
      school: String(school).slice(0, 200),
      schoolCode: Number(schoolCode) || 8,
      teacherName: String(teacherName).slice(0, 150),
      examLanguage: lang,
      branchId: Number(branchId),
      email: String(email).slice(0, 150),
      phone: String(phone).slice(0, 50),
    });

    const dateForLang =
      lang === 'RU'
        ? settings.stage2_date_ru
        : lang === 'EN'
        ? settings.stage2_date_en
        : settings.stage2_date_ro;

    const branchNameForLang =
      lang === 'RU'
        ? student.branch_name_ru || student.branch_name_ro
        : lang === 'EN'
        ? student.branch_name_en || student.branch_name_ro
        : student.branch_name_ro;

    const origin =
      req.headers.get('origin') ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'https://luminamath.orizont.md';

    const emailResult = await sendRegistrationEmail({
      to: student.email,
      studentCode: student.student_code,
      accessPin: student.access_pin,
      firstName: student.first_name,
      lastName: student.last_name,
      grade: student.grade,
      school: student.school,
      teacherName: student.teacher_name,
      examLanguage: student.exam_language,
      branchName: branchNameForLang || `Branch #${student.branch_code}`,
      branchAddress: student.branch_address || 'Chișinău',
      examDateText: `${dateForLang}, ${settings.exam_time}`,
      resultsUrl: `${origin}/results?id=${student.student_code}&pin=${student.access_pin}`,
    });

    if (emailResult.sent && emailResult.mode === 'smtp') {
      await markStudentEmailStatus(student.student_code, 'registration', true);
      student.email_sent = true;
    }

    return NextResponse.json({
      success: true,
      student,
      emailMode: emailResult.mode,
    });
  } catch (error) {
    console.error('[POST /api/register] Error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Registration failed' },
      { status: 500 }
    );
  }
}
