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
  getStudentByCode,
  isEmailAuthorizedAdmin,
} from '@/lib/db';
import { generateExamPassPdf } from '@/lib/pdf-documents';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { studentCode: string } }
) {
  try {
    const ip = getClientIp(req);
    const code = (params.studentCode || '').trim();
    const pin = (req.nextUrl.searchParams.get('pin') || '').trim();

    const ipLimit = checkRateLimit(`ticket_ip:${ip}`, 600, 10 * 60);
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
        { error: 'Acces neautorizat: Codul PIN este necesar.' },
        { status: 401 }
      );
    }

    const settings = await getSiteSettings();
    const origin =
      req.headers.get('origin') ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'https://luminamath.orizont.md';
    const verifyUrl = `${origin}/results?id=${student.student_code}&pin=${student.access_pin}`;

    const pdfBytes = await generateExamPassPdf(student, settings, verifyUrl);

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="LuminaMath_Permis_${code}.pdf"`,
        'Content-Length': String(pdfBytes.length),
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch (error) {
    console.error('[GET /api/results/[studentCode]/ticket] Error:', error);
    return NextResponse.json({ error: 'Failed to generate Exam Pass PDF' }, { status: 500 });
  }
}
