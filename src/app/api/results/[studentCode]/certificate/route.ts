import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from '@/lib/auth';
import {
  getSiteSettings,
  getStudentByCode,
  isEmailAuthorizedAdmin,
} from '@/lib/db';
import { generateCertificatePdf } from '@/lib/pdf-documents';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { studentCode: string } }
) {
  try {
    const code = (params.studentCode || '').trim();
    const pin = (req.nextUrl.searchParams.get('pin') || '').trim();

    const student = await getStudentByCode(code);
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    let authorized = Boolean(pin && student.access_pin && pin === student.access_pin);
    if (!authorized) {
      const adminSession = getAdminSessionFromRequest(req);
      if (adminSession && (await isEmailAuthorizedAdmin(adminSession.email))) {
        authorized = true;
      }
    }

    if (!authorized) {
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

    const pdfBytes = await generateCertificatePdf(student, settings, verifyUrl);

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="LuminaMath_Certificat_${code}.pdf"`,
        'Content-Length': String(pdfBytes.length),
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch (error) {
    console.error('[GET /api/results/[studentCode]/certificate] Error:', error);
    return NextResponse.json({ error: 'Failed to generate Certificate PDF' }, { status: 500 });
  }
}
