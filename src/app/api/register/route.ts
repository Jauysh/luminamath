import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/auth';
import { getSiteSettings, markStudentEmailStatus, registerStudent } from '@/lib/db';
import { sendRegistrationEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = checkRateLimit(`register:${ip}`, 15, 10 * 60); // max 15 registrations per 10 min per IP
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
    if (isNaN(numericGrade) || numericGrade < 1 || numericGrade > 12) {
      return NextResponse.json({ error: 'Invalid grade selected' }, { status: 400 });
    }

    const validLangs = ['RO', 'RU', 'EN'];
    const lang = (validLangs.includes(examLanguage) ? examLanguage : 'RO') as 'RO' | 'RU' | 'EN';

    const [student, settings] = await Promise.all([
      registerStudent({
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
      }),
      getSiteSettings(),
    ]);

    const dateForLang =
      lang === 'RU'
        ? settings.stage2_date_ru
        : lang === 'EN'
        ? settings.stage2_date_en
        : settings.stage2_date_ro;

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
      branchName: student.branch_name_ro || `Branch #${student.branch_code}`,
      branchAddress: student.branch_address || 'Chișinău',
      examDateText: `${dateForLang}, ${settings.exam_time}`,
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
