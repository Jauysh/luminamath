import { NextRequest, NextResponse } from 'next/server';
import { getStudentResultPdf } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { studentCode: string } }
) {
  try {
    const code = (params.studentCode || '').trim();
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
        // High-concurrency caching for Cloud Run (700+ students viewing results)
        'Cache-Control': 'public, max-age=300, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('[GET /api/results/[studentCode]/pdf] Error:', error);
    return NextResponse.json({ error: 'Failed to serve PDF' }, { status: 500 });
  }
}
