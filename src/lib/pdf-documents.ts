import fs from 'fs';
import path from 'path';
import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { getStudentAwardTier, SiteSettingsRecord, StudentRecord } from './db';

let cachedRegularFontBytes: Buffer | null = null;
let cachedBoldFontBytes: Buffer | null = null;
const cachedDiplomaBgBytes: Record<string, Buffer | null> = {};

function getAssetBuffer(relPath: string): Buffer | null {
  try {
    const full = path.join(process.cwd(), 'public', relPath);
    if (fs.existsSync(full)) {
      return fs.readFileSync(full);
    }
  } catch {}
  return null;
}

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
  // Exact ISO/IEC 18004 ECC-L (1 single Reed-Solomon block) parameters:
  // V3: 55 data + 15 EC = 70 codewords (max 53 bytes)
  // V4: 80 data + 20 EC = 100 codewords (max 78 bytes)
  // V5: 108 data + 26 EC = 134 codewords (max 106 bytes)
  const ver = bytes.length <= 53 ? 3 : bytes.length <= 78 ? 4 : 5;
  const size = 17 + ver * 4;
  const totalData = ver === 3 ? 55 : ver === 4 ? 80 : 108;
  const ecLen = ver === 3 ? 15 : ver === 4 ? 20 : 26;
  const alignCenter = ver === 3 ? 22 : ver === 4 ? 26 : 30;

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
    '1. Examenul incepe la ora 10:00. Elevul trebuie sa fie prezent la scoala cu 20 de minute inainte (ora 09:40).',
    '2. Elevii trebuie sa aduca cu ei pix (stilou / rucka) pentru completarea lucrarii.',
    '3. Prezentati-va cu Pasaportul, Buletinul de identitate (ID) sau Carnetul de elev + acest Permis (ID: ' +
      student.student_code +
      ').',
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
 * Generates an official Landscape A4 Diploma (1st, 2nd, 3rd Place, Honorable Mention)
 * or Certificate of Participation PDF in 3 languages (RO / RU / EN) matching the
 * Bright Academic Prestige poster and website theme, with QR Verification.
 */
export async function generateCertificatePdf(
  student: StudentRecord,
  settings: SiteSettingsRecord,
  verifyUrl: string,
  preferredLang?: 'RO' | 'RU' | 'EN'
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const page = doc.addPage([841.89, 595.28]); // A4 Landscape (841.89 x 595.28 pt)

  if (!cachedRegularFontBytes) {
    cachedRegularFontBytes = getAssetBuffer('fonts/Roboto-Regular.ttf');
  }
  if (!cachedBoldFontBytes) {
    cachedBoldFontBytes = getAssetBuffer('fonts/Roboto-Bold.ttf');
  }

  const hasUnicodeFont = Boolean(cachedRegularFontBytes && cachedBoldFontBytes);
  const fontRegular = hasUnicodeFont
    ? await doc.embedFont(cachedRegularFontBytes!)
    : await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = hasUnicodeFont
    ? await doc.embedFont(cachedBoldFontBytes!)
    : await doc.embedFont(StandardFonts.HelveticaBold);

  const safeStr = (txt: string | undefined | null) => {
    if (!txt) return '';
    const cleaned = String(txt)
      .replace(/[„“”]/g, '"')
      .replace(/[’‘]/g, "'")
      .replace(/[–—]/g, '-')
      .replace(/•/g, '|');
    return hasUnicodeFont ? cleaned : toPdfSafeText(cleaned);
  };

  const lang: 'RO' | 'RU' | 'EN' =
    preferredLang && ['RO', 'RU', 'EN'].includes(preferredLang)
      ? preferredLang
      : student.exam_language || 'RO';

  const tier = getStudentAwardTier(student.score, settings);

  // Palette definitions matching our Luminous Academic Poster & Website
  const navy = rgb(0.11, 0.21, 0.54); // #1C358A
  const navyDeep = rgb(0.06, 0.11, 0.28); // #0F1C47
  const luminaOrange = rgb(0.93, 0.33, 0.15); // #ED5526
  const slateDark = rgb(0.06, 0.09, 0.16);
  const slateMuted = rgb(0.32, 0.38, 0.48);

  const tierConfig = {
    '1st': {
      titleColor: rgb(0.71, 0.33, 0.04), // Rich Imperial Gold #B45309
      pillText: rgb(0.47, 0.21, 0.02),
      scoreText: rgb(0.57, 0.25, 0.05),
      titleRo: 'DIPLOMĂ DE PREMIUL I',
      titleRu: 'ДИПЛОМ I СТЕПЕНИ',
      titleEn: 'FIRST PRIZE DIPLOMA',
      badgeRo: 'LOCUL I  |  MEDALIA DE AUR (GOLD MEDAL)',
      badgeRu: 'I МЕСТО  |  ЗОЛОТАЯ МЕДАЛЬ (GOLD MEDAL)',
      badgeEn: '1ST PLACE  |  GOLD MEDAL LAUREATE',
    },
    '2nd': {
      titleColor: rgb(0.12, 0.23, 0.58), // Royal Indigo-Silver
      pillText: rgb(0.15, 0.23, 0.42),
      scoreText: rgb(0.18, 0.25, 0.38),
      titleRo: 'DIPLOMĂ DE PREMIUL II',
      titleRu: 'ДИПЛОМ II СТЕПЕНИ',
      titleEn: 'SECOND PRIZE DIPLOMA',
      badgeRo: 'LOCUL II  |  MEDALIA DE ARGINT (SILVER MEDAL)',
      badgeRu: 'II МЕСТО  |  СЕРЕБРЯНАЯ МЕДАЛЬ (SILVER MEDAL)',
      badgeEn: '2ND PLACE  |  SILVER MEDAL LAUREATE',
    },
    '3rd': {
      titleColor: rgb(0.65, 0.24, 0.05), // Noble Bronze #9A3412
      pillText: rgb(0.48, 0.18, 0.04),
      scoreText: rgb(0.55, 0.2, 0.05),
      titleRo: 'DIPLOMĂ DE PREMIUL III',
      titleRu: 'ДИПЛОМ III СТЕПЕНИ',
      titleEn: 'THIRD PRIZE DIPLOMA',
      badgeRo: 'LOCUL III  |  MEDALIA DE BRONZ (BRONZE MEDAL)',
      badgeRu: 'III МЕСТО  |  БРОНЗОВАЯ МЕДАЛЬ (BRONZE MEDAL)',
      badgeEn: '3RD PLACE  |  BRONZE MEDAL LAUREATE',
    },
    mention: {
      titleColor: rgb(0.02, 0.42, 0.3), // Emerald Prestige #047857
      pillText: rgb(0.02, 0.35, 0.25),
      scoreText: rgb(0.02, 0.38, 0.27),
      titleRo: 'DIPLOMĂ DE MENȚIUNE',
      titleRu: 'ПОХВАЛЬНАЯ ГРАМОТА (MENȚIUNE)',
      titleEn: 'HONORABLE MENTION DIPLOMA',
      badgeRo: 'MENȚIUNE DE ONOARE  |  DIPLOMĂ & MEDALIE',
      badgeRu: 'ПОЧЁТНАЯ ГРАМОТА И МЕДАЛЬ  |  HONORABLE MENTION',
      badgeEn: 'HONORABLE MENTION  |  DIPLOMA & MEDAL',
    },
    participation: {
      titleColor: navy,
      pillText: navy,
      scoreText: rgb(0.76, 0.25, 0.05),
      titleRo: 'CERTIFICAT DE PARTICIPARE',
      titleRu: 'СЕРТИФИКАТ УЧАСТНИКА',
      titleEn: 'CERTIFICATE OF PARTICIPATION',
      badgeRo: 'PARTICIPANT OFICIAL  |  ETAPA NAȚIONALĂ',
      badgeRu: 'ОФИЦИАЛЬНЫЙ УЧАСТНИК  |  НАЦИОНАЛЬНЫЙ ЭТАП',
      badgeEn: 'OFFICIAL PARTICIPANT  |  NATIONAL STAGE',
    },
  }[tier];

  // 1. Embed Vibrant Website-Style Full-Bleed Artwork Canvas (Mesh Gradient, Math Grid,
  //    Formulas, Corner Ribbons, Logos, 3D Medal + Laurel Wreath, and Shadowed EdTech Cards)
  if (cachedDiplomaBgBytes[tier] === undefined) {
    cachedDiplomaBgBytes[tier] = getAssetBuffer(`logos/diploma-bg-${tier}.jpg`);
  }
  const bgBuffer = cachedDiplomaBgBytes[tier];
  if (bgBuffer) {
    try {
      const bgImg = await doc.embedJpg(bgBuffer);
      page.drawImage(bgImg, {
        x: 0,
        y: 0,
        width: 841.89,
        height: 595.28,
      });
    } catch {}
  }

  const centerX = 841.89 / 2;

  const drawCentered = (
    text: string,
    y: number,
    size: number,
    font: typeof fontBold,
    color = slateDark
  ) => {
    const s = safeStr(text);
    const w = font.widthOfTextAtSize(s, size);
    page.drawText(s, {
      x: (841.89 - w) / 2,
      y,
      size,
      font,
      color,
    });
  };

  // 2. Top Institutional Header Titles (centered between LuminaMath logo and Orizont 1993 seal)
  const drawHeaderCentered = (
    text: string,
    y: number,
    size: number,
    font: typeof fontBold,
    color = navy
  ) => {
    const safe = safeStr(text);
    const width = font.widthOfTextAtSize(safe, size);
    const headerMidX = 454;
    page.drawText(safe, {
      x: headerMidX - width / 2,
      y,
      size,
      font,
      color,
    });
  };

  drawHeaderCentered(
    'INSTITUȚIA PRIVATĂ DE ÎNVĂȚĂMÂNT LICEUL TEORETIC "ORIZONT"',
    552,
    9.8,
    fontBold,
    navy
  );
  drawHeaderCentered(
    `CONCURSUL NAȚIONAL DE MATEMATICĂ LUMINAMATH MOLDOVA  |  EDIȚIA ${settings.edition}`,
    534,
    10.4,
    fontBold,
    luminaOrange
  );
  drawHeaderCentered(
    'НАЦИОНАЛЬНАЯ МАТЕМАТИЧЕСКАЯ ОЛИМПИАДА  |  NATIONAL MATHEMATICS COMPETITION (CLASELE III - VIII)',
    517,
    7.8,
    fontBold,
    slateMuted
  );

  // 3. Primary Award Title & Trilingual Subtitle (below the 3D Laurel Medal)
  const mainTitle =
    lang === 'RU'
      ? tierConfig.titleRu
      : lang === 'EN'
      ? tierConfig.titleEn
      : tierConfig.titleRo;

  const secondaryTitles =
    lang === 'RU'
      ? `${tierConfig.titleRo}  |  ${tierConfig.titleEn}`
      : lang === 'EN'
      ? `${tierConfig.titleRo}  |  ${tierConfig.titleRu}`
      : `${tierConfig.titleEn}  |  ${tierConfig.titleRu}`;

  drawCentered(mainTitle, 362, 24.5, fontBold, tierConfig.titleColor);
  drawCentered(secondaryTitles, 346, 8.8, fontBold, slateMuted);

  // Award Pill Badge Text inside the SVG gradient pill (y_svg = 254..276 -> y_pdf = 319..341)
  const badgeText = safeStr(
    lang === 'RU'
      ? tierConfig.badgeRu
      : lang === 'EN'
      ? tierConfig.badgeEn
      : tierConfig.badgeRo
  );
  drawCentered(badgeText, 326.5, 9.2, fontBold, tierConfig.pillText);

  // 4. Recipient Intro Line (RO / RU / EN)
  const introLine =
    lang === 'RU'
      ? 'Награждается ученик / ученица за высокие результаты на Национальной олимпиаде по математике:'
      : lang === 'EN'
      ? 'Proudly awarded in recognition of outstanding performance at the National Mathematics Competition to:'
      : 'Se acordă cu deosebită apreciere pentru rezultatele obținute la etapa națională elevului / elevei:';
  drawCentered(introLine, 302, 10.2, fontBold, slateMuted);

  // 5. Student Full Name inside the Elevated Centerpiece Card (y_svg = 304..358 -> y_pdf = 237..291)
  const fullName = `${student.first_name} ${student.last_name}`.toUpperCase();
  const nameFontSize = fullName.length > 26 ? 20 : 25;
  drawCentered(fullName, 256, nameFontSize, fontBold, navyDeep);

  // 6. Three Website-Style EdTech Achievement Pill Cards (y_svg = 370..406 -> y_pdf = 189..225)
  const romanGrades: Record<number, string> = {
    3: 'III-a',
    4: 'IV-a',
    5: 'V-a',
    6: 'VI-a',
    7: 'VII-a',
    8: 'VIII-a',
  };
  const gradeLabelTop =
    lang === 'RU' ? 'КЛАСС' : lang === 'EN' ? 'GRADE LEVEL' : 'CLASA';
  const gradeText =
    lang === 'RU'
      ? `${student.grade} класс`
      : lang === 'EN'
      ? `Grade ${student.grade}`
      : `Clasa a ${romanGrades[student.grade] || student.grade}`;

  // Pill 1 Text (x = 98..206)
  page.drawText(safeStr(gradeLabelTop), {
    x: 100,
    y: 211,
    size: 6.8,
    font: fontBold,
    color: slateMuted,
  });
  page.drawText(safeStr(gradeText), {
    x: 100,
    y: 197,
    size: 11.2,
    font: fontBold,
    color: navy,
  });

  // Pill 2 Text: School (x = 256..592)
  const schoolLabelTop =
    lang === 'RU'
      ? 'УЧЕБНОЕ ЗАВЕДЕНИЕ / ШКОЛА'
      : lang === 'EN'
      ? 'EDUCATIONAL INSTITUTION / SCHOOL'
      : 'INSTITUȚIA DE ÎNVĂȚĂMÂNT / ȘCOALA';
  const rawSchool = safeStr(student.school);
  const schoolDisplay =
    rawSchool.length > 52 ? rawSchool.slice(0, 50) + '...' : rawSchool;
  const schoolFontSize = schoolDisplay.length > 40 ? 9.5 : 10.8;

  page.drawText(safeStr(schoolLabelTop), {
    x: 258,
    y: 211,
    size: 6.8,
    font: fontBold,
    color: slateMuted,
  });
  page.drawText(schoolDisplay, {
    x: 258,
    y: 197,
    size: schoolFontSize,
    font: fontBold,
    color: slateDark,
  });

  // Pill 3 Text: Official Score / Status (x = 642..772)
  const hasNumericScore =
    student.score !== null &&
    student.score !== undefined &&
    !isNaN(Number(student.score));
  const scoreFormatted = hasNumericScore
    ? Number(student.score) % 1 === 0
      ? String(Number(student.score))
      : Number(student.score).toFixed(2)
    : null;

  const scoreLabelTop =
    lang === 'RU'
      ? 'РЕЗУЛЬТАТ (БАЛЛЫ)'
      : lang === 'EN'
      ? 'OFFICIAL SCORE'
      : 'PUNCTAJ OBȚINUT';
  const scoreValueText = scoreFormatted
    ? lang === 'RU'
      ? `${scoreFormatted} баллов`
      : lang === 'EN'
      ? `${scoreFormatted} points`
      : `${scoreFormatted} puncte`
    : lang === 'RU'
    ? 'Участник'
    : lang === 'EN'
    ? 'Confirmed'
    : 'Confirmat';

  page.drawText(safeStr(scoreLabelTop), {
    x: 644,
    y: 211,
    size: 6.8,
    font: fontBold,
    color: slateMuted,
  });
  page.drawText(safeStr(scoreValueText), {
    x: 644,
    y: 197,
    size: 11.2,
    font: fontBold,
    color: tierConfig.scoreText,
  });

  // 7. Teacher & Exam Center Citation Line (between pills and bottom cards)
  const branchName =
    lang === 'RU'
      ? student.branch_name_ru || student.branch_name_ro || 'Кишинёв'
      : lang === 'EN'
      ? student.branch_name_en || student.branch_name_ro || 'Chisinau'
      : student.branch_name_ro || 'Chișinău';

  const teacherAndCenterLine =
    lang === 'RU'
      ? `Учитель-наставник: ${student.teacher_name}   |   Экзаменационный центр: ${branchName}`
      : lang === 'EN'
      ? `Coordinating Teacher: ${student.teacher_name}   |   Examination Center: ${branchName}`
      : `Profesor coordonator: ${student.teacher_name}   |   Centrul de examen: ${branchName}`;

  drawCentered(teacherAndCenterLine, 169, 9.8, fontBold, slateDark);

  const citationSub =
    lang === 'RU'
      ? `Национальная математическая олимпиада LuminaMath Moldova (${settings.edition})  |  Теоретический лицей "Orizont"`
      : lang === 'EN'
      ? `LuminaMath Moldova National Mathematics Competition (${settings.edition})  |  "Orizont" Theoretical Lyceum`
      : `Concursul Național de Matematică LuminaMath Moldova (${settings.edition})  |  IPLT "Orizont" Republica Moldova`;
  drawCentered(citationSub, 154, 8.5, fontRegular, slateMuted);

  // 8. Bottom 3 Cards: Left (Participant Verification), Center (QR Code), Right (Jury & Stamp)
  // Left Card Header Text (in the Royal Blue bar at y_pdf = 123)
  page.drawText(safeStr(`ID PARTICIPANT: ${student.student_code}`), {
    x: 66,
    y: 123,
    size: 10.5,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  const awardCodeLabel =
    tier === '1st'
      ? 'PREMIUL I / GOLD MEDAL'
      : tier === '2nd'
      ? 'PREMIUL II / SILVER MEDAL'
      : tier === '3rd'
      ? 'PREMIUL III / BRONZE MEDAL'
      : tier === 'mention'
      ? 'MENȚIUNE / HONORABLE MENTION'
      : 'CERTIFICAT DE PARTICIPARE';

  page.drawText(safeStr(`Statut: ${awardCodeLabel}`), {
    x: 66,
    y: 96,
    size: 8.8,
    font: fontBold,
    color: tierConfig.titleColor,
  });

  const dateDisplay =
    lang === 'RU'
      ? settings.stage2_date_ru
      : lang === 'EN'
      ? settings.stage2_date_en
      : settings.stage2_date_ro;

  page.drawText(safeStr(`Data examenului: ${dateDisplay}`), {
    x: 66,
    y: 80,
    size: 8.5,
    font: fontRegular,
    color: slateDark,
  });
  page.drawText('Verificare: https://luminamath.orizont.md/results', {
    x: 66,
    y: 64,
    size: 8,
    font: fontBold,
    color: navy,
  });
  page.drawText(
    safeStr(`Limba probei: ${student.exam_language}  |  Clasa: ${student.grade}`),
    {
      x: 66,
      y: 48,
      size: 7.8,
      font: fontRegular,
      color: slateMuted,
    }
  );

  // Center QR Code inside the elevated QR card (x = 364.95..476.95, y_pdf = 34.28..150.28)
  const qrMatrix = generateQrMatrix(verifyUrl);
  const qrDim = qrMatrix.length;
  const qrSize = 84;
  const cell = qrSize / qrDim;
  const qrX = (841.89 - qrSize) / 2;
  const qrY = 56;

  for (let r = 0; r < qrDim; r++) {
    for (let c = 0; c < qrDim; c++) {
      if (qrMatrix[r][c]) {
        page.drawRectangle({
          x: qrX + c * cell,
          y: qrY + (qrDim - 1 - r) * cell,
          width: cell + 0.15,
          height: cell + 0.15,
          color: navyDeep,
        });
      }
    }
  }

  const qrCaption = 'SCAN QR VERIFICARE';
  const qrCapW = fontBold.widthOfTextAtSize(qrCaption, 6.8);
  page.drawText(qrCaption, {
    x: centerX - qrCapW / 2,
    y: 42,
    size: 6.8,
    font: fontBold,
    color: navy,
  });

  // Right Card Header Text (in the Royal Blue bar at y_pdf = 123)
  page.drawText(
    safeStr(
      lang === 'RU'
        ? 'НАЦИОНАЛЬНЫЙ ОРГКОМИТЕТ И ЖЮРИ'
        : lang === 'EN'
        ? 'NATIONAL ORGANIZING COMMITTEE & JURY'
        : 'COMISIA NAȚIONALĂ DE ORGANIZARE ȘI JURIUL'
    ),
    {
      x: 514,
      y: 123,
      size: 8.8,
      font: fontBold,
      color: rgb(1, 1, 1),
    }
  );

  page.drawText('LuminaMath Moldova  |  IPLT "Orizont"', {
    x: 514,
    y: 96,
    size: 9.5,
    font: fontBold,
    color: luminaOrange,
  });

  page.drawLine({
    start: { x: 514, y: 66 },
    end: { x: 768, y: 66 },
    thickness: 1,
    color: slateMuted,
  });

  page.drawText(
    safeStr(
      lang === 'RU'
        ? 'Подпись председателя жюри / М.П. (Chișinău, Moldova)'
        : lang === 'EN'
        ? 'Chairman Signature & Official Seal (Chișinău, Moldova)'
        : 'Semnătura Președintelui & Ștampila Oficială (Chișinău)'
    ),
    {
      x: 514,
      y: 50,
      size: 7.8,
      font: fontRegular,
      color: slateMuted,
    }
  );

  return doc.save();
}
