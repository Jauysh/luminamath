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
import {
  ExtractedKarnePdf,
  extractKarnesFromPdfBuffer,
} from '@/lib/omr-pdf-splitter';

export const dynamic = 'force-dynamic';

async function isAuthorized(req: NextRequest): Promise<boolean> {
  const session = getAdminSessionFromRequest(req);
  if (!session) return false;
  const admin = await isEmailAuthorizedAdmin(session.email);
  return isSuperAdminRecord(admin);
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
        totalExtractedCount: matchedIds.length,
        matchedCount: matchedIds.length,
        unmatchedCount: 0,
        matchedIds,
        unmatchedFiles: [],
      });
    }

    const downloadZipMode = req.nextUrl.searchParams.get('downloadZip') === '1';
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    const matchedIds: string[] = [];
    const unmatchedFiles: string[] = [];
    const allExtractedKarnes: ExtractedKarnePdf[] = [];

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
          if (
            entry.name.includes('__MACOSX') ||
            entry.name.split('/').pop()?.startsWith('._')
          ) {
            continue;
          }

          const pdfBuf = await entry.async('nodebuffer');
          const extracted = await extractKarnesFromPdfBuffer(pdfBuf, entry.name);
          if (extracted.length === 0) {
            unmatchedFiles.push(`${entry.name} (Student Num. / ID табылмады)`);
          } else {
            allExtractedKarnes.push(...extracted);
          }
        }
      } else if (fileName.toLowerCase().endsWith('.pdf')) {
        const extracted = await extractKarnesFromPdfBuffer(buffer, fileName);
        if (extracted.length === 0) {
          unmatchedFiles.push(`${fileName} (Student Num. / ID табылмады)`);
        } else {
          allExtractedKarnes.push(...extracted);
        }
      } else {
        unmatchedFiles.push(
          `${fileName} (unsupported format — upload .pdf or .zip)`
        );
      }
    }

    // Match each extracted karne against registered students in DB
    for (const karne of allExtractedKarnes) {
      let matchedCode: string | null = null;

      // 1) Try exact rawId (e.g. 608001 or 040701)
      const resRaw = await saveStudentResultPdf(
        karne.rawId,
        `${karne.rawId}.pdf`,
        karne.pdfBuffer
      );
      if (resRaw.matched) {
        matchedCode = karne.rawId;
      } else if (karne.normalizedId !== karne.rawId) {
        // 2) Try 6-digit zero-padded ID (e.g. 40701 -> 040701)
        const resNorm = await saveStudentResultPdf(
          karne.normalizedId,
          `${karne.normalizedId}.pdf`,
          karne.pdfBuffer
        );
        if (resNorm.matched) {
          matchedCode = karne.normalizedId;
        }
      }

      if (matchedCode) {
        matchedIds.push(
          karne.studentName ? `${matchedCode} (${karne.studentName})` : matchedCode
        );
      } else {
        const labelName = karne.studentName ? ` — ${karne.studentName}` : '';
        unmatchedFiles.push(
          `${karne.rawId}.pdf${labelName} (${karne.sourceFileName}, бет/p.${karne.pageNumber})`
        );
      }
    }

    // If admin requested a .ZIP archive of all split individual {ID}.pdf files
    if (downloadZipMode) {
      const outZip = new JSZip();
      const usedNames = new Set<string>();

      for (const karne of allExtractedKarnes) {
        let outName = `${karne.rawId}.pdf`;
        if (usedNames.has(outName)) {
          outName = `${karne.rawId}_p${karne.pageNumber}_${karne.position}.pdf`;
        }
        usedNames.add(outName);
        outZip.file(outName, karne.pdfBuffer);
      }

      const zipBuffer = await outZip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });

      return new NextResponse(new Uint8Array(zipBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition':
            'attachment; filename="LuminaMath_Individual_Karne_PDFs.zip"',
          'X-Total-Extracted': String(allExtractedKarnes.length),
          'X-Matched-Count': String(matchedIds.length),
        },
      });
    }

    return NextResponse.json({
      success: true,
      totalExtractedCount: allExtractedKarnes.length,
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
