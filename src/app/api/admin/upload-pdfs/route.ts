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

    const allRegisteredStudents = await getAllStudents();
    const normalizeNameKey = (str: string) =>
      str
        .toUpperCase()
        .replace(/[ĂÂ]/g, 'A')
        .replace(/Î/g, 'I')
        .replace(/[ȘŞ]/g, 'S')
        .replace(/[ȚŢ]/g, 'T')
        .replace(/Ğ/g, 'G')
        .replace(/Ü/g, 'U')
        .replace(/İ/g, 'I')
        .replace(/Ö/g, 'O')
        .replace(/Ç/g, 'C')
        .replace(/[^A-ZА-ЯЁ0-9]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    // Match each extracted karne against registered students in DB
    for (const karne of allExtractedKarnes) {
      let matchedCode: string | null = null;
      const candidates =
        karne.candidateIds && karne.candidateIds.length > 0
          ? karne.candidateIds
          : [karne.normalizedId, karne.rawId];

      // 1) Try all candidate IDs extracted from filename / PDF (e.g. "010301", "10301" -> "010301", last 6 digits)
      const tried = new Set<string>();
      for (const cand of candidates) {
        if (!cand || tried.has(cand)) continue;
        tried.add(cand);
        const resCand = await saveStudentResultPdf(cand, `${cand}.pdf`, karne.pdfBuffer);
        if (resCand.matched) {
          matchedCode = cand;
          break;
        }
      }

      // 2) Fallback: if numeric ID did not match (e.g. student mis-bubbled 1 digit on OMR sheet),
      // check if the "_NAME_SURNAME_Sonuc_Belgesi.pdf" suffix uniquely matches a registered student
      if (!matchedCode && karne.studentName) {
        const targetKey = normalizeNameKey(karne.studentName);
        if (targetKey.length >= 4) {
          const nameMatches = allRegisteredStudents.filter((st) => {
            const k1 = normalizeNameKey(`${st.first_name} ${st.last_name}`);
            const k2 = normalizeNameKey(`${st.last_name} ${st.first_name}`);
            return k1 === targetKey || k2 === targetKey;
          });
          if (nameMatches.length === 1) {
            const matchedStudent = nameMatches[0];
            const resName = await saveStudentResultPdf(
              matchedStudent.student_code,
              `${matchedStudent.student_code}.pdf`,
              karne.pdfBuffer
            );
            if (resName.matched) {
              matchedCode = matchedStudent.student_code;
            }
          }
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
