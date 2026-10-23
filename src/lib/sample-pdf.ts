/**
 * Generates a valid, self-contained single-page PDF buffer representing
 * an Optical Mark Recognition (OMR) Evaluation Report Card (Табель) for a student.
 * Works with zero external native dependencies.
 */
export function generateSampleOmrPdf(params: {
  studentCode: string;
  fullName: string;
  grade: number;
  school: string;
  branchName: string;
  examLanguage: string;
  score?: number;
}): Buffer {
  const {
    studentCode,
    fullName,
    grade,
    school,
    branchName,
    examLanguage,
    score = 92.5,
  } = params;

  // Sanitize ASCII for standard PDF Type1 Helvetica font
  const toAscii = (str: string) =>
    str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\x20-\x7E]/g, '')
      .replace(/[()\\]/g, '');

  const safeName = toAscii(fullName) || 'Student Participant';
  const safeSchool = toAscii(school) || 'Liceul Teoretic';
  const safeBranch = toAscii(branchName) || 'Chisinau';

  const contentLines = [
    'BT',
    '/F1 18 Tf',
    '50 770 Td',
    '(LUMINAMATH MOLDOVA - OPTICAL EVALUATION REPORT) Tj',
    '/F1 11 Tf',
    '0 -22 Td',
    '(National Mathematics Competition - Written Stage OMR Result) Tj',
    '0 -28 Td',
    '/F1 13 Tf',
    `(STUDENT ID CODE: ${studentCode}) Tj`,
    '/F1 11 Tf',
    '0 -20 Td',
    `(Student Name: ${safeName}) Tj`,
    '0 -18 Td',
    `(Grade / Class: Grade ${grade}) Tj`,
    '0 -18 Td',
    `(School: ${safeSchool}) Tj`,
    '0 -18 Td',
    `(Exam Branch: ${safeBranch}) Tj`,
    '0 -18 Td',
    `(Exam Language: ${examLanguage}) Tj`,
    '0 -28 Td',
    '/F1 12 Tf',
    '(------------------------------------------------------------------------) Tj',
    '0 -20 Td',
    '(OMR ANSWER SHEET VERIFICATION SUMMARY) Tj',
    '0 -18 Td',
    '/F1 10 Tf',
    '(Q01: [A] Correct   Q02: [C] Correct   Q03: [B] Correct   Q04: [D] Correct   Q05: [A] Correct) Tj',
    '0 -15 Td',
    '(Q06: [B] Correct   Q07: [E] Correct   Q08: [C] Wrong     Q09: [A] Correct   Q10: [D] Correct) Tj',
    '0 -15 Td',
    '(Q11: [C] Correct   Q12: [B] Correct   Q13: [A] Correct   Q14: [E] Correct   Q15: [B] Correct) Tj',
    '0 -15 Td',
    '(Q16: [D] Correct   Q17: [A] Correct   Q18: [C] Correct   Q19: [B] Blank     Q20: [E] Correct) Tj',
    '0 -15 Td',
    '(Q21: [A] Correct   Q22: [D] Correct   Q23: [B] Correct   Q24: [C] Correct   Q25: [A] Correct) Tj',
    '0 -15 Td',
    '(Q26: [E] Correct   Q27: [B] Correct   Q28: [D] Correct   Q29: [A] Correct   Q30: [C] Correct) Tj',
    '0 -25 Td',
    '/F1 12 Tf',
    '(------------------------------------------------------------------------) Tj',
    '0 -22 Td',
    '/F1 14 Tf',
    `(TOTAL SCORE: ${score.toFixed(1)} / 100.0 POINTS) Tj`,
    '0 -20 Td',
    '/F1 11 Tf',
    '(Correct Answers: 28   |   Wrong Answers: 1   |   Blank: 1) Tj',
    '0 -20 Td',
    '(Official Evaluation Status: VERIFIED - LUMINAMATH MOLDOVA) Tj',
    '0 -35 Td',
    '/F1 9 Tf',
    '(Verified by LuminaMath Optical Scanner System - luminamath.orizont.md) Tj',
    'ET',
  ].join('\n');

  const objects: string[] = [];
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
  objects.push(
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 595 842] /Contents 5 0 R >>\nendobj\n'
  );
  objects.push(
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n'
  );
  const streamBytes = Buffer.byteLength(contentLines, 'utf8');
  objects.push(
    `5 0 obj\n<< /Length ${streamBytes} >>\nstream\n${contentLines}\nendstream\nendobj\n`
  );

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += obj;
  }

  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, 'utf8');
}
