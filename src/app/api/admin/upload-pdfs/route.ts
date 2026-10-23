import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { getAdminSessionFromRequest } from '@/lib/auth';
import {
  getAllStudents,
  isEmailAuthorizedAdmin,
  isSuperAdminRecord,
  saveStudentResultPdf,
} from '@/lib/db';
import { generateSampleOmrPdf } from '@/lib/sample-pdf';

async function isAuthorized(req: NextRequest): Promise<boolean> {
  const session = getAdminSessionFromRequest(req);
  if (!session) return false;
  const admin = await isEmailAuthorizedAdmin(session.email);
  return isSuperAdminRecord(admin);
}

function extractSixDigitId(filename: string): string | null {
  const base = filename.split('/').pop() || filename;
  const match6 = base.match(/(\d{6})/);
  if (match6) return match6[1];
  const match5 = base.match(/(?<!\d)(\d{5})(?!\d)/);
  if (match5) return match5[1].padStart(6, '0');
  return null;
}

export async function POST(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (req.nextUrl.searchParams.get('demoGenerate') === '1') {
      const students = await getAllStudents();
      const matchedIds: string[] = [];

      for (const s of students) {
        const pdfBuf = generateSampleOmrPdf({
          studentCode: s.student_code,
          fullName: `${s.first_name} ${s.last_name}`,
          grade: s.grade,
          school: s.school,
          branchName: s.branch_name_ro || `Branch ${s.branch_code}`,
          examLanguage: s.exam_language,
          score: 80 + ((Number(s.student_code.slice(-2)) * 7) % 20),
        });
        await saveStudentResultPdf(s.student_code, `${s.student_code}.pdf`, pdfBuf);
        matchedIds.push(s.student_code);
      }

      return NextResponse.json({
        success: true,
        matchedCount: matchedIds.length,
        unmatchedCount: 0,
        matchedIds,
        unmatchedFiles: [],
      });
    }

    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    const matchedIds: string[] = [];
    const unmatchedFiles: string[] = [];

    for (const file of files) {
      const fileName = file.name;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (fileName.toLowerCase().endsWith('.zip')) {
        const zip = await JSZip.loadAsync(buffer);
        const entries = Object.values(zip.files);

        for (const entry of entries) {
          if (entry.dir) continue;
          if (!entry.name.toLowerCase().endsWith('.pdf')) continue;
          if (entry.name.includes('__MACOSX') || entry.name.split('/').pop()?.startsWith('._')) {
            continue;
          }

          const studentCode = extractSixDigitId(entry.name);
          if (!studentCode) {
            unmatchedFiles.push(`${entry.name} (no 6-digit ID in filename)`);
            continue;
          }

          const pdfBuf = await entry.async('nodebuffer');
          const res = await saveStudentResultPdf(studentCode, `${studentCode}.pdf`, pdfBuf);

          if (res.matched) {
            matchedIds.push(studentCode);
          } else {
            unmatchedFiles.push(`${entry.name} (ID ${studentCode} not registered)`);
          }
        }
      } else if (fileName.toLowerCase().endsWith('.pdf')) {
        const studentCode = extractSixDigitId(fileName);
        if (!studentCode) {
          unmatchedFiles.push(`${fileName} (no 6-digit ID in filename)`);
          continue;
        }

        const res = await saveStudentResultPdf(studentCode, `${studentCode}.pdf`, buffer);
        if (res.matched) {
          matchedIds.push(studentCode);
        } else {
          unmatchedFiles.push(`${fileName} (ID ${studentCode} not registered)`);
        }
      } else {
        unmatchedFiles.push(`${fileName} (unsupported format — upload .pdf or .zip)`);
      }
    }

    return NextResponse.json({
      success: true,
      matchedCount: matchedIds.length,
      unmatchedCount: unmatchedFiles.length,
      matchedIds,
      unmatchedFiles,
    });
  } catch (error) {
    console.error('[POST /api/admin/upload-pdfs] Error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to process uploaded PDFs' },
      { status: 500 }
    );
  }
}
