import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { SiteSettingsRecord, StudentRecord } from './db';

/**
 * Converts Unicode text (Romanian diacritics & Cyrillic) into clean WinAnsi-safe ASCII/Latin-1
 * so StandardFonts.Helvetica in pdf-lib never throws encoding errors.
 */
export function toPdfSafeText(input: string | undefined | null): string {
  if (!input) return '';
  const roMap: Record<string, string> = {
    ă: 'a',
    Ă: 'A',
    â: 'a',
    Â: 'A',
    î: 'i',
    Î: 'I',
    ș: 's',
    Ș: 'S',
    ş: 's',
    Ş: 'S',
    ț: 't',
    Ț: 'T',
    ţ: 't',
    Ţ: 'T',
    '„': '"',
    '”': '"',
    '“': '"',
    '’': "'",
    '–': '-',
    '—': '-',
    '•': '-',
  };

  const cyrMap: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z',
    и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
    с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch',
    ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
    А: 'A', Б: 'B', В: 'V', Г: 'G', Д: 'D', Е: 'E', Ё: 'Yo', Ж: 'Zh', З: 'Z',
    И: 'I', Й: 'Y', К: 'K', Л: 'L', М: 'M', Н: 'N', О: 'O', П: 'P', Р: 'R',
    С: 'S', Т: 'T', У: 'U', Ф: 'F', Х: 'Kh', Ц: 'Ts', Ч: 'Ch', Ш: 'Sh', Щ: 'Shch',
    Ъ: '', Ы: 'Y', Ь: '', Э: 'E', Ю: 'Yu', Я: 'Ya',
  };

  let out = '';
  for (const ch of input) {
    if (roMap[ch] !== undefined) {
      out += roMap[ch];
    } else if (cyrMap[ch] !== undefined) {
      out += cyrMap[ch];
    } else if (ch.charCodeAt(0) >= 32 && ch.charCodeAt(0) <= 126) {
      out += ch;
    } else {
      out += ' ';
    }
  }
  return out;
}

/**
 * Pure TypeScript ISO/IEC 18004 QR Code Matrix Generator (Byte Mode, ECC-L, Version 4/5/6).
 */
export function generateQrMatrix(text: string): boolean[][] {
  const bytes = Buffer.from(text, 'utf8');
  // Version parameters for ECC-L (1 single Reed-Solomon block)
  const ver = bytes.length <= 62 ? 4 : bytes.length <= 84 ? 5 : 6;
  const size = 17 + ver * 4;
  const totalData = ver === 4 ? 64 : ver === 5 ? 86 : 108;
  const ecLen = ver === 4 ? 16 : ver === 5 ? 22 : 28;
  const alignCenter = ver === 4 ? 26 : ver === 5 ? 30 : 34;

  const bits: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1);
  };
  pushBits(0b0100, 4); // Byte mode
  pushBits(bytes.length, 8);
  for (let i = 0; i < bytes.length; i++) pushBits(bytes[i], 8);
  for (let i = 0; i < 4 && bits.length < totalData * 8; i++) bits.push(0);
  while (bits.length % 8 !== 0) bits.push(0);

  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
    data.push(b);
  }
  let padIdx = 0;
  while (data.length < totalData) {
    data.push(padIdx % 2 === 0 ? 0xec : 0x11);
    padIdx++;
  }

  // GF(256) with primitive polynomial 0x11D
  const exp = new Uint8Array(512);
  const log = new Uint8Array(256);
  let x = 1;
  for (let i = 0; i < 255; i++) {
    exp[i] = x;
    log[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) exp[i] = exp[i - 255];
  const gfMul = (a: number, b: number) => (a === 0 || b === 0 ? 0 : exp[log[a] + log[b]]);

  let gen = [1];
  for (let i = 0; i < ecLen; i++) {
    const next = new Array(gen.length + 1).fill(0);
    for (let j = 0; j < gen.length; j++) {
      next[j] ^= gen[j];
      next[j + 1] ^= gfMul(gen[j], exp[i]);
    }
    gen = next;
  }

  const msg = [...data, ...new Array(ecLen).fill(0)];
  for (let i = 0; i < data.length; i++) {
    const coef = msg[i];
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j++) {
        msg[i + j] ^= gfMul(gen[j], coef);
      }
    }
  }
  const codewords = [...data, ...msg.slice(data.length)];

  const modules: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const isFunction: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const setFunctionModule = (r: number, c: number, dark: boolean) => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      modules[r][c] = dark;
      isFunction[r][c] = true;
    }
  };

  // Finder patterns + separators
  const drawFinder = (topR: number, leftC: number) => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const r = topR + dr;
        const c = leftC + dc;
        const inOuter = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
        const onBorder = dr === 0 || dr === 6 || dc === 0 || dc === 6;
        const inInner = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
        setFunctionModule(r, c, inOuter && (onBorder || inInner));
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Alignment pattern
  for (let dr = -2; dr <= 2; dr++) {
    for (let dc = -2; dc <= 2; dc++) {
      const dark = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
      setFunctionModule(alignCenter + dr, alignCenter + dc, dark);
    }
  }

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    setFunctionModule(6, i, i % 2 === 0);
    setFunctionModule(i, 6, i % 2 === 0);
  }

  // Reserve format info areas
  for (let i = 0; i <= 8; i++) {
    if (!isFunction[8][i]) setFunctionModule(8, i, false);
    if (!isFunction[i][8]) setFunctionModule(i, 8, false);
  }
  for (let i = 0; i < 8; i++) {
    if (!isFunction[8][size - 1 - i]) setFunctionModule(8, size - 1 - i, false);
    if (!isFunction[size - 1 - i][8]) setFunctionModule(size - 1 - i, 8, false);
  }
  setFunctionModule(size - 8, 8, true); // Dark module

  // Place data bits in upward/downward 2-column zigzag
  let bitIdx = 0;
  const totalBits = codewords.length * 8;
  let upward = true;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      const r = upward ? size - 1 - vert : vert;
      for (let j = 0; j < 2; j++) {
        const c = right - j;
        if (!isFunction[r][c]) {
          let dark = false;
          if (bitIdx < totalBits) {
            dark = ((codewords[bitIdx >> 3] >> (7 - (bitIdx & 7))) & 1) === 1;
            bitIdx++;
          }
          // Mask 0: (r + c) % 2 === 0
          if ((r + c) % 2 === 0) dark = !dark;
          modules[r][c] = dark;
        }
      }
    }
    upward = !upward;
  }

  // Format bits for ECC-L (01) + Mask 0 (000) => 0x77C4
  const formatBits = 0x77c4;
  const getFmtBit = (i: number) => ((formatBits >> i) & 1) === 1;

  for (let i = 0; i <= 5; i++) modules[8][i] = getFmtBit(14 - i);
  modules[8][7] = getFmtBit(8);
  modules[8][8] = getFmtBit(7);
  modules[7][8] = getFmtBit(6);
  for (let i = 0; i <= 5; i++) modules[5 - i][8] = getFmtBit(5 - i);

  for (let i = 0; i < 7; i++) modules[size - 1 - i][8] = getFmtBit(14 - i);
  for (let i = 0; i < 8; i++) modules[8][size - 8 + i] = getFmtBit(7 - i);

  return modules;
}

/**
 * Generates an official A4 Exam Admission Pass PDF with 6-Digit ID, PIN, OMR Preview, and QR Code.
 */
export async function generateExamPassPdf(
  student: StudentRecord,
  settings: SiteSettingsRecord,
  verifyUrl: string
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4 Portrait
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontMono = await doc.embedFont(StandardFonts.CourierBold);

  const navy = rgb(0.17, 0.22, 0.53); // #2C3987
  const orange = rgb(0.96, 0.57, 0.13); // #F59122
  const emerald = rgb(0.02, 0.47, 0.34);
  const slateDark = rgb(0.06, 0.09, 0.16);
  const slateMuted = rgb(0.39, 0.45, 0.55);
  const lightBg = rgb(0.96, 0.97, 0.99);

  // Outer Card Border
  page.drawRectangle({
    x: 32,
    y: 120,
    width: 531,
    height: 690,
    borderColor: navy,
    borderWidth: 2,
    color: rgb(1, 1, 1),
  });

  // Top Header Banner
  page.drawRectangle({
    x: 32,
    y: 725,
    width: 531,
    height: 85,
    color: navy,
  });
  page.drawRectangle({
    x: 32,
    y: 720,
    width: 531,
    height: 5,
    color: orange,
  });

  page.drawText('LUMINAMATH MOLDOVA', {
    x: 52,
    y: 775,
    size: 22,
    font: fontBold,
    color: rgb(1, 1, 1),
  });
  page.drawText(
    toPdfSafeText(
      `CONCURSUL NATIONAL DE MATEMATICA (CLASELE III - VIII) • EDITIA ${settings.edition}`
    ),
    {
      x: 52,
      y: 753,
      size: 10,
      font: fontBold,
      color: rgb(0.98, 0.78, 0.35),
    }
  );
  page.drawText('PERMIS DE ACCES LA EXAMEN / EXAM ADMISSION PASS', {
    x: 52,
    y: 736,
    size: 10,
    font: fontRegular,
    color: rgb(0.88, 0.91, 1),
  });

  // Highlight ID & PIN Section + QR Code
  page.drawRectangle({
    x: 52,
    y: 565,
    width: 345,
    height: 135,
    color: lightBg,
    borderColor: rgb(0.78, 0.82, 0.92),
    borderWidth: 1.5,
  });

  // 6-Digit ID Box
  page.drawRectangle({
    x: 66,
    y: 632,
    width: 150,
    height: 54,
    color: rgb(1, 1, 1),
    borderColor: navy,
    borderWidth: 1.5,
  });
  page.drawText('ID PARTICIPANT (6 CIFRE)', {
    x: 76,
    y: 672,
    size: 7.5,
    font: fontBold,
    color: navy,
  });
  page.drawText(student.student_code, {
    x: 76,
    y: 642,
    size: 26,
    font: fontMono,
    color: slateDark,
  });

  // 6-Digit PIN Box
  page.drawRectangle({
    x: 230,
    y: 632,
    width: 152,
    height: 54,
    color: rgb(0.93, 0.99, 0.96),
    borderColor: emerald,
    borderWidth: 1.5,
  });
  page.drawText('PAROLA / COD PIN REZULTATE', {
    x: 240,
    y: 672,
    size: 7.5,
    font: fontBold,
    color: emerald,
  });
  page.drawText(student.access_pin || '------', {
    x: 240,
    y: 642,
    size: 26,
    font: fontMono,
    color: emerald,
  });

  // Breakdown of 6-digit ID for OMR Sheet
  const sPrefix = student.student_code.slice(0, 2);
  const gPrefix = student.student_code.slice(2, 4);
  const nPrefix = student.student_code.slice(4, 6);
  page.drawText(
    `Structura ID pe foaia optica (OMR):  [Scoala: ${sPrefix}]  +  [Clasa: ${gPrefix}]  +  [Nr. Elev: ${nPrefix}]`,
    {
      x: 66,
      y: 608,
      size: 8.5,
      font: fontBold,
      color: slateDark,
    }
  );
  page.drawText(
    'Pastrati acest permis! Prezentati ID-ul la intrarea in sala de examen si folositi PIN-ul pentru rezultate.',
    {
      x: 66,
      y: 584,
      size: 7.5,
      font: fontRegular,
      color: slateMuted,
    }
  );

  // QR Code Box on the Right
  const qrMatrix = generateQrMatrix(verifyUrl);
  const qrBoxX = 412;
  const qrBoxY = 565;
  const qrBoxSize = 135;
  page.drawRectangle({
    x: qrBoxX,
    y: qrBoxY,
    width: qrBoxSize,
    height: qrBoxSize,
    color: rgb(1, 1, 1),
    borderColor: navy,
    borderWidth: 1.5,
  });

  const qrDim = qrMatrix.length;
  const cell = 96 / qrDim;
  const qrStartX = qrBoxX + (qrBoxSize - 96) / 2;
  const qrStartY = qrBoxY + 26;

  for (let r = 0; r < qrDim; r++) {
    for (let c = 0; c < qrDim; c++) {
      if (qrMatrix[r][c]) {
        page.drawRectangle({
          x: qrStartX + c * cell,
          y: qrStartY + (qrDim - 1 - r) * cell,
          width: cell + 0.15,
          height: cell + 0.15,
          color: slateDark,
        });
      }
    }
  }
  page.drawText('SCAN QR PENTRU REZULTATE', {
    x: qrBoxX + 14,
    y: qrBoxY + 10,
    size: 7,
    font: fontBold,
    color: navy,
  });

  // Student Details Table
  const drawField = (
    label: string,
    value: string,
    x: number,
    y: number,
    width: number
  ) => {
    page.drawRectangle({
      x,
      y,
      width,
      height: 46,
      color: rgb(0.98, 0.98, 0.99),
      borderColor: rgb(0.86, 0.89, 0.94),
      borderWidth: 1,
    });
    page.drawText(label, {
      x: x + 12,
      y: y + 31,
      size: 7.5,
      font: fontBold,
      color: slateMuted,
    });
    page.drawText(toPdfSafeText(value).slice(0, 58), {
      x: x + 12,
      y: y + 12,
      size: 11.5,
      font: fontBold,
      color: slateDark,
    });
  };

  const fullName = `${student.first_name} ${student.last_name}`;
  drawField('NUME SI PRENUME PARTICIPANT / FULL NAME', fullName, 52, 502, 330);
  drawField(
    'CLASA & LIMBA TESTULUI',
    `Clasa ${student.grade}  •  Limba: ${student.exam_language}`,
    394,
    502,
    150
  );

  drawField('INSTITUTIA DE INVATAMANT / SCHOOL', student.school, 52, 444, 330);
  drawField('PROFESOR COORDONATOR / TEACHER', student.teacher_name, 394, 444, 150);

  const branchTitle = student.branch_name_ro || `Filiala #${student.branch_code}`;
  drawField('CENTRUL DE EXAMEN (FILIALA ASIGNATA)', branchTitle, 52, 386, 492);
  drawField(
    'ADRESA CENTRULUI DE EXAMEN / EXAM CENTER ADDRESS',
    student.branch_address || 'Chisinau, Moldova',
    52,
    328,
    492
  );

  drawField(
    'DATA SI ORA EXAMENULUI / EXAM DATE & TIME',
    `${settings.stage2_date_ro}  •  Ora: ${settings.exam_time}`,
    52,
    270,
    240
  );
  drawField(
    'DATA AFISARII REZULTATELOR / RESULTS DATE',
    settings.stage3_date_ro,
    304,
    270,
    240
  );

  // Important Exam Day Instructions Box
  page.drawRectangle({
    x: 52,
    y: 155,
    width: 492,
    height: 98,
    color: rgb(1, 0.98, 0.93),
    borderColor: orange,
    borderWidth: 1,
  });
  page.drawText('REGULI IMPORTANTE PENTRU ZIUA EXAMENULUI / EXAM DAY RULES:', {
    x: 66,
    y: 236,
    size: 8.5,
    font: fontBold,
    color: slateDark,
  });
  const rules = [
    '1. Prezentati-va la centrul de examen cu cel putin 30 de minute inainte de inceperea probei (la ora 09:30).',
    '2. Aveti asupra dvs. acest Permis de Acces (tiparit sau pe telefon) si carnetul de elev.',
    '3. Pe foaia optica de raspuns (OMR), completati exact ID-ul dvs. din 6 cifre: ' +
      student.student_code,
    '4. Telefoanele mobile, ceasurile inteligente si calculatoarele sunt strict interzise in timpul probei.',
  ];
  rules.forEach((rule, idx) => {
    page.drawText(rule, {
      x: 66,
      y: 218 - idx * 14,
      size: 8,
      font: fontRegular,
      color: slateDark,
    });
  });

  // Footer
  page.drawText(
    'Portal Oficial: https://luminamath.orizont.md   |   Email: luminamath@orizont.md   |   IPLT "Orizont"',
    {
      x: 95,
      y: 132,
      size: 8.5,
      font: fontBold,
      color: navy,
    }
  );

  return doc.save();
}

/**
 * Generates an official Landscape A4 Certificate of Participation PDF with QR Verification.
 */
export async function generateCertificatePdf(
  student: StudentRecord,
  settings: SiteSettingsRecord,
  verifyUrl: string
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([841.89, 595.28]); // A4 Landscape
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontRomanBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const fontRomanItalic = await doc.embedFont(StandardFonts.TimesRomanItalic);

  const navy = rgb(0.17, 0.22, 0.53); // #2C3987
  const gold = rgb(0.85, 0.52, 0.08);
  const slateDark = rgb(0.08, 0.11, 0.18);
  const slateMuted = rgb(0.38, 0.44, 0.53);

  // Ornamental Double Frame
  page.drawRectangle({
    x: 24,
    y: 24,
    width: 793.89,
    height: 547.28,
    borderColor: navy,
    borderWidth: 4,
    color: rgb(0.995, 0.995, 1),
  });
  page.drawRectangle({
    x: 34,
    y: 34,
    width: 773.89,
    height: 527.28,
    borderColor: gold,
    borderWidth: 1.5,
  });

  // Top Navy Header Bar
  page.drawRectangle({
    x: 34,
    y: 485,
    width: 773.89,
    height: 76.28,
    color: navy,
  });
  page.drawRectangle({
    x: 34,
    y: 480,
    width: 773.89,
    height: 5,
    color: gold,
  });

  const drawCentered = (
    text: string,
    y: number,
    size: number,
    font: typeof fontBold,
    color = slateDark
  ) => {
    const safe = toPdfSafeText(text);
    const w = font.widthOfTextAtSize(safe, size);
    page.drawText(safe, {
      x: (841.89 - w) / 2,
      y,
      size,
      font,
      color,
    });
  };

  drawCentered('LUMINAMATH MOLDOVA', 525, 24, fontBold, rgb(1, 1, 1));
  drawCentered(
    `CONCURSUL NATIONAL DE MATEMATICA • EDITIA ${settings.edition}`,
    500,
    11,
    fontBold,
    rgb(0.98, 0.82, 0.42)
  );

  // Certificate Title
  drawCentered('CERTIFICAT DE PARTICIPARE', 425, 32, fontRomanBold, navy);
  drawCentered('CERTIFICATE OF PARTICIPATION', 402, 11, fontBold, gold);

  drawCentered(
    'Se acorda cu deosebita apreciere elevului / elevei:',
    362,
    13,
    fontRomanItalic,
    slateMuted
  );

  // Student Full Name Highlight
  const fullName = `${student.first_name} ${student.last_name}`.toUpperCase();
  drawCentered(fullName, 315, 28, fontRomanBold, slateDark);

  page.drawLine({
    start: { x: 180, y: 302 },
    end: { x: 661.89, y: 302 },
    thickness: 1.2,
    color: gold,
  });

  // School & Grade description
  drawCentered(
    `Clasa a ${student.grade}-a   •   ${student.school}`,
    272,
    14,
    fontBold,
    navy
  );
  drawCentered(
    `Pentru participarea remarcabila la etapa nationala a Concursului de Matematica LuminaMath Moldova (${settings.edition})`,
    240,
    11.5,
    fontRegular,
    slateDark
  );
  drawCentered(
    `Profesor coordonator: ${student.teacher_name}   |   Centrul de examen: ${
      student.branch_name_ro || 'Chisinau'
    }`,
    216,
    10.5,
    fontRegular,
    slateMuted
  );

  // Bottom Left: ID & Date
  page.drawText(`ID Participant: ${student.student_code}`, {
    x: 68,
    y: 120,
    size: 11,
    font: fontBold,
    color: navy,
  });
  page.drawText(toPdfSafeText(`Data: ${settings.stage3_date_ro}`), {
    x: 68,
    y: 100,
    size: 10,
    font: fontRegular,
    color: slateMuted,
  });
  page.drawText('Verificare online: https://luminamath.orizont.md/results', {
    x: 68,
    y: 82,
    size: 9,
    font: fontRegular,
    color: slateMuted,
  });

  // Center QR Code for Verification
  const qrMatrix = generateQrMatrix(verifyUrl);
  const qrDim = qrMatrix.length;
  const qrSize = 78;
  const cell = qrSize / qrDim;
  const qrX = (841.89 - qrSize) / 2;
  const qrY = 76;

  page.drawRectangle({
    x: qrX - 6,
    y: qrY - 6,
    width: qrSize + 12,
    height: qrSize + 12,
    color: rgb(1, 1, 1),
    borderColor: gold,
    borderWidth: 1,
  });

  for (let r = 0; r < qrDim; r++) {
    for (let c = 0; c < qrDim; c++) {
      if (qrMatrix[r][c]) {
        page.drawRectangle({
          x: qrX + c * cell,
          y: qrY + (qrDim - 1 - r) * cell,
          width: cell + 0.15,
          height: cell + 0.15,
          color: slateDark,
        });
      }
    }
  }

  // Bottom Right: Official Signature Block
  page.drawLine({
    start: { x: 560, y: 115 },
    end: { x: 765, y: 115 },
    thickness: 1,
    color: slateDark,
  });
  page.drawText('COMITETUL DE ORGANIZARE', {
    x: 585,
    y: 98,
    size: 10,
    font: fontBold,
    color: navy,
  });
  page.drawText('LuminaMath Moldova • IPLT "Orizont"', {
    x: 582,
    y: 82,
    size: 9,
    font: fontRegular,
    color: slateMuted,
  });

  return doc.save();
}
