import { NextRequest, NextResponse } from 'next/server';
import {
  checkRateLimit,
  getAdminSessionFromRequest,
  getClientIp,
  isRateLimitExceeded,
  timingSafePinMatch,
} from '@/lib/auth';
import {
  getSiteSettings,
  getStudentAwardTier,
  getStudentByCode,
  getStudentResultPdf,
  isEmailAuthorizedAdmin,
  saveStudentResultPdf,
} from '@/lib/db';
import { extractKarnesFromPdfBuffer } from '@/lib/omr-pdf-splitter';
import { generateCertificatePdf } from '@/lib/pdf-documents';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { studentCode: string } }
) {
  try {
    const ip = getClientIp(req);
    const code = (params.studentCode || '').trim();
    const pin = (req.nextUrl.searchParams.get('pin') || '').trim();
    const langParam = (req.nextUrl.searchParams.get('lang') || '').trim().toUpperCase();

    const ipLimit = checkRateLimit(`cert_ip:${ip}`, 600, 10 * 60);
    if (!ipLimit.allowed || isRateLimitExceeded(`pin_fail:${code}`, 15)) {
      return NextResponse.json(
        { error: 'Prea multe încercări. Vă rugăm să așteptați câteva minute.' },
        { status: 429 }
      );
    }

    const student = await getStudentByCode(code);
    if (!student) {
      checkRateLimit(`pin_fail:${code}`, 15, 15 * 60);
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    let isAdmin = false;
    const adminSession = getAdminSessionFromRequest(req);
    if (adminSession && (await isEmailAuthorizedAdmin(adminSession.email))) {
      isAdmin = true;
    }

    const authorized =
      isAdmin ||
      Boolean(pin && student.access_pin && timingSafePinMatch(pin, student.access_pin));

    if (!authorized) {
      checkRateLimit(`pin_fail:${code}`, 15, 15 * 60);
      return NextResponse.json(
        { error: 'Acces neautorizat: Codul PIN este necesar.' },
        { status: 401 }
      );
    }

    if (!student.has_result_pdf && !isAdmin) {
      return NextResponse.json(
        {
          error:
            'Certificatul / Diploma este disponibilă doar după publicarea rezultatelor oficiale. / Сертификат доступен только после публикации результатов экзамена.',
        },
        { status: 403 }
      );
    }

    if (
      student.has_result_pdf &&
      (student.score === null || student.score === undefined)
    ) {
      try {
        const pdfRec = await getStudentResultPdf(student.student_code);
        if (pdfRec) {
          const extracted = await extractKarnesFromPdfBuffer(
            pdfRec.pdfBuffer,
            pdfRec.fileName || `${student.student_code}.pdf`
          );
          if (extracted[0]?.score !== undefined) {
            student.score = extracted[0].score;
            await saveStudentResultPdf(
              student.student_code,
              pdfRec.fileName || `${student.student_code}.pdf`,
              pdfRec.pdfBuffer,
              student.score
            );
          }
        }
      } catch {}
    }

    const settings = await getSiteSettings();
    const origin =
      req.headers.get('origin') ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'https://luminamath.orizont.md';
    const verifyUrl = `${origin}/results?id=${student.student_code}&pin=${student.access_pin}`;
    const preferredLang = (
      ['RO', 'RU', 'EN'].includes(langParam) ? langParam : student.exam_language
    ) as 'RO' | 'RU' | 'EN';

    const pdfBytes = await generateCertificatePdf(
      student,
      settings,
      verifyUrl,
      preferredLang
    );
    const tier = getStudentAwardTier(student.score, settings);
    const filePrefix =
      tier === '1st'
        ? 'LuminaMath_Diploma_1st_Place'
        : tier === '2nd'
        ? 'LuminaMath_Diploma_2nd_Place'
        : tier === '3rd'
        ? 'LuminaMath_Diploma_3rd_Place'
        : tier === 'mention'
        ? 'LuminaMath_Diploma_Mentiune'
        : 'LuminaMath_Certificat_Participare';

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filePrefix}_${code}.pdf"`,
        'Content-Length': String(pdfBytes.length),
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    console.error('[GET /api/results/[studentCode]/certificate] Error:', error);
    return NextResponse.json({ error: 'Failed to generate Certificate PDF' }, { status: 500 });
  }
}
