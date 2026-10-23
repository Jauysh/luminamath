import zlib from 'zlib';
import { PDFArray, PDFDocument, PDFRawStream } from 'pdf-lib';

export interface ExtractedKarnePdf {
  rawId: string;
  normalizedId: string;
  studentName?: string;
  sourceFileName: string;
  pageNumber: number;
  position: 'top' | 'bottom' | 'full';
  pdfBuffer: Buffer;
}

export function extractSixDigitIdFromFilename(filename: string): string | null {
  const base = filename.split('/').pop() || filename;
  const match6 = base.match(/(\d{6})/);
  if (match6) return match6[1];
  const match5 = base.match(/(?<!\d)(\d{5})(?!\d)/);
  if (match5) return match5[1].padStart(6, '0');
  return null;
}

function decodePdfStreamObject(streamObj: unknown): string {
  if (!streamObj || typeof streamObj !== 'object') return '';
  const raw = (streamObj as PDFRawStream).contents;
  if (!raw) return '';
  const buf = Buffer.from(raw);
  try {
    return zlib.inflateSync(buf).toString('latin1');
  } catch {
    return buf.toString('latin1');
  }
}

function extractTextTokensFromStream(streamText: string): string[] {
  const tokens: string[] = [];
  const regex = /\[([\s\S]*?)\]\s*TJ|\(([\s\S]*?)\)\s*Tj/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(streamText)) !== null) {
    if (m[1] !== undefined) {
      const inner = m[1];
      const parts: string[] = [];
      const partRegex = /\((?:\\.|[^\\()])*\)/g;
      let pm: RegExpExecArray | null;
      while ((pm = partRegex.exec(inner)) !== null) {
        parts.push(pm[0].slice(1, -1));
      }
      tokens.push(parts.join(''));
    } else if (m[2] !== undefined) {
      tokens.push(m[2]);
    }
  }
  return tokens;
}

function parseCardsFromTokens(
  tokens: string[]
): Array<{ rawId: string; studentName?: string }> {
  const cards: Array<{ rawId: string; studentName?: string }> = [];

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (tok.includes('Student Num')) {
      let foundId: string | null = null;
      for (let j = i + 1; j < Math.min(i + 7, tokens.length); j++) {
        const cand = tokens[j].trim();
        if (/^\d{4,7}$/.test(cand)) {
          foundId = cand;
          break;
        }
      }

      if (foundId) {
        // Attempt to locate student name near the beginning of this card's token block
        let studentName: string | undefined;
        for (let k = Math.max(0, i - 18); k < i; k++) {
          const t = tokens[k].trim();
          // In OMR exports, the name token looks like "BEJENAR ALEXEI 26/04/2026"
          const dateMatch = t.match(/^([A-ZА-ЯЁĂÂÎȘȚ\s\-]{3,})\s+\d{2}\/\d{2}\/\d{4}$/i);
          if (dateMatch) {
            studentName = dateMatch[1].trim();
          }
        }
        cards.push({ rawId: foundId, studentName });
      }
    }
  }

  return cards;
}

export async function extractKarnesFromPdfBuffer(
  pdfBuffer: Buffer,
  fileName: string
): Promise<ExtractedKarnePdf[]> {
  const results: ExtractedKarnePdf[] = [];

  let srcDoc: PDFDocument;
  try {
    srcDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  } catch {
    // Fallback if PDF cannot be parsed by pdf-lib: try filename matching
    const fallbackId = extractSixDigitIdFromFilename(fileName);
    if (fallbackId) {
      results.push({
        rawId: fallbackId,
        normalizedId: fallbackId,
        sourceFileName: fileName,
        pageNumber: 1,
        position: 'full',
        pdfBuffer,
      });
    }
    return results;
  }

  const pages = srcDoc.getPages();

  for (let pIdx = 0; pIdx < pages.length; pIdx++) {
    const page = pages[pIdx];
    const contents = page.node.Contents();
    let pageStreamText = '';

    if (contents instanceof PDFArray) {
      for (let i = 0; i < contents.size(); i++) {
        const ref = contents.get(i);
        const streamObj = srcDoc.context.lookup(ref);
        pageStreamText += '\n' + decodePdfStreamObject(streamObj);
      }
    } else if (contents) {
      const streamObj = srcDoc.context.lookup(contents);
      pageStreamText = decodePdfStreamObject(streamObj);
    }

    const tokens = extractTextTokensFromStream(pageStreamText);
    const cards = parseCardsFromTokens(tokens);
    const { width, height } = page.getSize();
    const midY = height / 2 + 10; // ~431pt on A4 (841.98pt)

    if (cards.length >= 2) {
      // 1) Top Card
      const topCard = cards[0];
      const topDoc = await PDFDocument.create();
      const [topPage] = await topDoc.copyPages(srcDoc, [pIdx]);
      topPage.setMediaBox(0, midY, width, height - midY);
      topPage.setCropBox(0, midY, width, height - midY);
      topDoc.addPage(topPage);
      const topBytes = await topDoc.save();

      results.push({
        rawId: topCard.rawId,
        normalizedId:
          topCard.rawId.length === 5 ? topCard.rawId.padStart(6, '0') : topCard.rawId,
        studentName: topCard.studentName,
        sourceFileName: fileName,
        pageNumber: pIdx + 1,
        position: 'top',
        pdfBuffer: Buffer.from(topBytes),
      });

      // 2) Bottom Card
      const botCard = cards[1];
      const botDoc = await PDFDocument.create();
      const [botPage] = await botDoc.copyPages(srcDoc, [pIdx]);
      botPage.setMediaBox(0, 20, width, midY - 20);
      botPage.setCropBox(0, 20, width, midY - 20);
      botDoc.addPage(botPage);
      const botBytes = await botDoc.save();

      results.push({
        rawId: botCard.rawId,
        normalizedId:
          botCard.rawId.length === 5 ? botCard.rawId.padStart(6, '0') : botCard.rawId,
        studentName: botCard.studentName,
        sourceFileName: fileName,
        pageNumber: pIdx + 1,
        position: 'bottom',
        pdfBuffer: Buffer.from(botBytes),
      });
    } else if (cards.length === 1) {
      const singleCard = cards[0];
      const singleDoc = await PDFDocument.create();
      const [singlePage] = await singleDoc.copyPages(srcDoc, [pIdx]);

      // Check if this single card is an upper-half OMR card on a full A4 page
      const isTopHalfOmrLayout =
        height > 700 &&
        (pageStreamText.includes('451.22') || pageStreamText.includes('750.5'));

      if (isTopHalfOmrLayout) {
        singlePage.setMediaBox(0, midY, width, height - midY);
        singlePage.setCropBox(0, midY, width, height - midY);
      }

      singleDoc.addPage(singlePage);
      const singleBytes = await singleDoc.save();

      results.push({
        rawId: singleCard.rawId,
        normalizedId:
          singleCard.rawId.length === 5
            ? singleCard.rawId.padStart(6, '0')
            : singleCard.rawId,
        studentName: singleCard.studentName,
        sourceFileName: fileName,
        pageNumber: pIdx + 1,
        position: isTopHalfOmrLayout ? 'top' : 'full',
        pdfBuffer: Buffer.from(singleBytes),
      });
    }
  }

  // If no "Student Num." cards were found inside the PDF text, fallback to filename ID if 1-page or individual PDF
  if (results.length === 0) {
    const fallbackId = extractSixDigitIdFromFilename(fileName);
    if (fallbackId) {
      results.push({
        rawId: fallbackId,
        normalizedId: fallbackId,
        sourceFileName: fileName,
        pageNumber: 1,
        position: 'full',
        pdfBuffer,
      });
    }
  }

  return results;
}
