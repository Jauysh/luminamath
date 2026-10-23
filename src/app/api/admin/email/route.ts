import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from '@/lib/auth';
import {
  getAllStudents,
  getEmailConfig,
  getSiteSettings,
  getStudentByCode,
  getStudentResultPdf,
  isEmailAuthorizedAdmin,
  isSuperAdminRecord,
  markStudentEmailStatus,
  updateEmailConfig,
} from '@/lib/db';
import {
  sendRegistrationEmail,
  sendResultPdfEmail,
  sendTestSmtpEmail,
} from '@/lib/email';

export const dynamic = 'force-dynamic';

async function requireAdmin(req: NextRequest) {
  const session = getAdminSessionFromRequest(req);
  if (!session) return null;
  const admin = await isEmailAuthorizedAdmin(session.email);
  return admin ? { session, admin } : null;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cfg = await getEmailConfig();
  return NextResponse.json({
    config: {
      smtp_host: cfg.smtp_host,
      smtp_port: cfg.smtp_port,
      smtp_user: cfg.smtp_user,
      smtp_from: cfg.smtp_from,
      has_password: Boolean(cfg.smtp_pass && cfg.smtp_pass.trim().length > 0),
    },
  });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth || !isSuperAdminRecord(auth.admin)) {
    return NextResponse.json(
      { error: 'Acces permis doar pentru Super Admin' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const updated = await updateEmailConfig({
      smtp_host: body.smtp_host,
      smtp_port: body.smtp_port,
      smtp_user: body.smtp_user,
      smtp_pass: body.smtp_pass,
      smtp_from: body.smtp_from,
    });

    if (body.sendTestTo) {
      const testRes = await sendTestSmtpEmail(String(body.sendTestTo).trim());
      if (!testRes.sent) {
        return NextResponse.json(
          {
            error: `Salvat, dar trimiterea de test a eșuat: ${testRes.error}`,
            config: {
              smtp_host: updated.smtp_host,
              smtp_port: updated.smtp_port,
              smtp_user: updated.smtp_user,
              smtp_from: updated.smtp_from,
              has_password: Boolean(updated.smtp_pass),
            },
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      testSent: Boolean(body.sendTestTo),
      config: {
        smtp_host: updated.smtp_host,
        smtp_port: updated.smtp_port,
        smtp_user: updated.smtp_user,
        smtp_from: updated.smtp_from,
        has_password: Boolean(updated.smtp_pass),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const action = body.action as
      | 'send_registration'
      | 'send_result'
      | 'send_bulk_results';

    if (
      (action === 'send_result' || action === 'send_bulk_results') &&
      !isSuperAdminRecord(auth.admin)
    ) {
      return NextResponse.json(
        { error: 'Acces permis doar pentru Super Admin' },
        { status: 403 }
      );
    }

    const origin =
      req.headers.get('origin') ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'https://luminamath-md-592645627631.europe-west1.run.app';

    // 1. Send / Resend Registration Confirmation Email (with 6-digit ID) to 1 student
    if (action === 'send_registration') {
      const studentCode = String(body.studentCode || '').trim();
      const student = await getStudentByCode(studentCode);
      if (!student) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }

      const settings = await getSiteSettings();
      const dateForLang =
        student.exam_language === 'RU'
          ? settings.stage2_date_ru
          : student.exam_language === 'EN'
          ? settings.stage2_date_en
          : settings.stage2_date_ro;

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
        branchName: student.branch_name_ro || `Filiala #${student.branch_code}`,
        branchAddress: student.branch_address || 'Chișinău',
        examDateText: `${dateForLang}, ${settings.exam_time}`,
      });

      if (!res.sent || res.mode !== 'smtp') {
        return NextResponse.json(
          {
            error:
              res.error ||
              'SMTP nu este configurat! Adăugați Google App Password în tab-ul Administratori & Email.',
          },
          { status: 400 }
        );
      }

      await markStudentEmailStatus(student.student_code, 'registration', true);
      return NextResponse.json({
        success: true,
        message: `Email de confirmare ID (${student.student_code}) trimis către ${student.email}`,
      });
    }

    // 2. Send Result PDF Email to 1 student
    if (action === 'send_result') {
      const studentCode = String(body.studentCode || '').trim();
      const student = await getStudentByCode(studentCode);
      if (!student) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }

      const pdfRecord = await getStudentResultPdf(studentCode);
      if (!pdfRecord) {
        return NextResponse.json(
          { error: `Elevul ${studentCode} nu are încă un fișier PDF încărcat.` },
          { status: 400 }
        );
      }

      const res = await sendResultPdfEmail({
        to: student.email,
        studentCode: student.student_code,
        accessPin: student.access_pin,
        firstName: student.first_name,
        lastName: student.last_name,
        grade: student.grade,
        school: student.school,
        examLanguage: student.exam_language,
        branchName: student.branch_name_ro || `Filiala #${student.branch_code}`,
        resultsUrl: `${origin}/results?id=${student.student_code}&pin=${student.access_pin}`,
        pdfBuffer: pdfRecord.pdfBuffer,
      });

      if (!res.sent) {
        return NextResponse.json(
          { error: res.error || 'Eroare la expedierea email-ului cu rezultat PDF.' },
          { status: 400 }
        );
      }

      await markStudentEmailStatus(student.student_code, 'result', true);
      return NextResponse.json({
        success: true,
        message: `Rezultatul PDF (${student.student_code}.pdf) a fost trimis pe email către ${student.email}`,
      });
    }

    // 3. Bulk Send Result PDF Emails to all students with uploaded PDFs
    if (action === 'send_bulk_results') {
      const onlyUnsent = body.onlyUnsent !== false;
      const allStudents = await getAllStudents();
      const targets = allStudents.filter(
        (s) => s.has_result_pdf && (onlyUnsent ? !s.result_email_sent : true)
      );

      if (targets.length === 0) {
        return NextResponse.json({
          success: true,
          totalTargeted: 0,
          sentCount: 0,
          failedCount: 0,
          sentCodes: [],
          errors: [],
        });
      }

      let sentCount = 0;
      let failedCount = 0;
      const sentCodes: string[] = [];
      const errors: string[] = [];

      for (const student of targets) {
        const pdfRecord = await getStudentResultPdf(student.student_code);
        if (!pdfRecord) {
          failedCount += 1;
          errors.push(`${student.student_code}: PDF lipsește`);
          continue;
        }

        const res = await sendResultPdfEmail({
          to: student.email,
          studentCode: student.student_code,
          accessPin: student.access_pin,
          firstName: student.first_name,
          lastName: student.last_name,
          grade: student.grade,
          school: student.school,
          examLanguage: student.exam_language,
          branchName: student.branch_name_ro || `Filiala #${student.branch_code}`,
          resultsUrl: `${origin}/results?id=${student.student_code}&pin=${student.access_pin}`,
          pdfBuffer: pdfRecord.pdfBuffer,
        });

        if (res.sent) {
          sentCount += 1;
          sentCodes.push(`${student.student_code} (${student.email})`);
          await markStudentEmailStatus(student.student_code, 'result', true);
        } else {
          failedCount += 1;
          errors.push(`${student.student_code} (${student.email}): ${res.error}`);
          // Stop early if SMTP credentials themselves are missing/invalid
          if (res.mode === 'simulated' || res.error?.includes('Invalid login')) {
            break;
          }
        }

        // Polite 150ms pacing for Google Workspace SMTP rate-limiting
        await new Promise((r) => setTimeout(r, 150));
      }

      return NextResponse.json({
        success: true,
        totalTargeted: targets.length,
        sentCount,
        failedCount,
        sentCodes,
        errors,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
