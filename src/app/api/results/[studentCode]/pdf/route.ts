import { NextRequest, NextResponse } from 'next/server';
import {
  checkRateLimit,
  getAdminSessionFromRequest,
  getClientIp,
  isRateLimitExceeded,
  timingSafePinMatch,
} from '@/lib/auth';
import {
  getStudentByCode,
  getStudentResultPdf,
  isEmailAuthorizedAdmin,
} from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { studentCode: string } }
) {
  try {
    const ip = getClientIp(req);
    const code = (params.studentCode || '').trim();
    const pin = (req.nextUrl.searchParams.get('pin') || '').trim();

    const ipLimit = checkRateLimit(`pdf_ip:${ip}`, 600, 10 * 60);
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

    // Verify PIN (constant-time) or Admin session before serving private PDF
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
        { error: 'Acces neautorizat: Parola (PIN) este necesară pentru a vizualiza PDF-ul.' },
        { status: 401 }
      );
    }

    const result = await getStudentResultPdf(code);

    if (!result) {
      return NextResponse.json(
        { error: 'Result PDF not found for this student ID' },
        { status: 404 }
      );
    }

    const isDownload = req.nextUrl.searchParams.get('download') === '1';
    const disposition = isDownload
      ? `attachment; filename="LuminaMath_Result_${code}.pdf"`
      : `inline; filename="LuminaMath_Result_${code}.pdf"`;

    return new NextResponse(new Uint8Array(result.pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': disposition,
        'Content-Length': String(result.pdfBuffer.length),
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch (error) {
    console.error('[GET /api/results/[studentCode]/pdf] Error:', error);
    return NextResponse.json({ error: 'Failed to serve PDF' }, { status: 500 });
  }
}
