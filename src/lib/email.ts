import nodemailer from 'nodemailer';
import { getEmailConfig } from './db';

export interface RegistrationEmailPayload {
  to: string;
  studentCode: string;
  accessPin: string;
  firstName: string;
  lastName: string;
  grade: number;
  school: string;
  teacherName: string;
  examLanguage: 'RO' | 'RU' | 'EN';
  branchName: string;
  branchAddress: string;
  examDateText?: string;
  resultsUrl?: string;
}

export interface ResultPdfEmailPayload {
  to: string;
  studentCode: string;
  accessPin: string;
  firstName: string;
  lastName: string;
  grade: number;
  school: string;
  teacherName?: string;
  examLanguage: 'RO' | 'RU' | 'EN';
  branchName: string;
  resultsUrl: string;
  pdfBuffer: Buffer;
}

async function createConfiguredTransporter() {
  const cfg = await getEmailConfig();
  const host = cfg.smtp_host?.trim();
  const port = Number(cfg.smtp_port || 465);
  const user = cfg.smtp_user?.trim();
  const pass = cfg.smtp_pass?.trim();
  const from =
    cfg.smtp_from?.trim() || `LuminaMath Moldova <${user || 'luminamath@orizont.md'}>`;

  if (!host || !user || !pass) {
    return null;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });

  return { transporter, from, user };
}

const LANG_DISPLAY: Record<'RO' | 'RU' | 'EN', string> = {
  RO: 'RO — Română',
  RU: 'RU — Русский',
  EN: 'EN — English',
};

function getOrderedLanguages(primary: 'RO' | 'RU' | 'EN'): Array<'RO' | 'RU' | 'EN'> {
  const all: Array<'RO' | 'RU' | 'EN'> = ['RO', 'RU', 'EN'];
  const validPrimary: 'RO' | 'RU' | 'EN' = all.includes(primary) ? primary : 'RO';
  return [validPrimary, ...all.filter((l) => l !== validPrimary)];
}

export async function sendRegistrationEmail(
  payload: RegistrationEmailPayload
): Promise<{ sent: boolean; mode: 'smtp' | 'simulated'; error?: string }> {
  const {
    to,
    studentCode,
    accessPin,
    firstName,
    lastName,
    grade,
    school,
    teacherName,
    examLanguage,
    branchName,
    branchAddress,
    examDateText = '05 December 2026, 10:00 – 12:00',
    resultsUrl,
  } = payload;

  const lang: 'RO' | 'RU' | 'EN' = ['RO', 'RU', 'EN'].includes(examLanguage)
    ? examLanguage
    : 'RO';
  const orderedLangs = getOrderedLanguages(lang);
  const fullName = `${firstName} ${lastName}`;

  const subjectByLang: Record<'RO' | 'RU' | 'EN', string> = {
    RO: `LuminaMath Moldova — Confirmare Înregistrare / Registration Pass (ID: ${studentCode})`,
    RU: `LuminaMath Moldova — Подтверждение регистрации / Registration Pass (ID: ${studentCode})`,
    EN: `LuminaMath Moldova — Registration Confirmation / Exam Pass (ID: ${studentCode})`,
  };
  const subject = subjectByLang[lang];

  const introByLang: Record<'RO' | 'RU' | 'EN', { tag: string; text: string }> = {
    RO: {
      tag: 'RO',
      text: 'Înregistrarea dvs. la Concursul Național de Matematică <strong>LuminaMath Moldova</strong> a fost finalizată cu succes.',
    },
    RU: {
      tag: 'RU',
      text: 'Ваша регистрация на Национальную математическую олимпиаду <strong>LuminaMath Moldova</strong> успешно завершена.',
    },
    EN: {
      tag: 'EN',
      text: 'Your registration for the <strong>LuminaMath Moldova</strong> National Mathematics Competition has been successfully completed.',
    },
  };

  const reminderByLang: Record<'RO' | 'RU' | 'EN', string> = {
    RO: '<strong>RO:</strong> Păstrați <strong>ID-ul (6 cifre)</strong> pentru foaia optică (OMR) în ziua examenului, iar <strong>Codul PIN</strong> pentru verificarea privată a rezultatului PDF pe site!',
    RU: '<strong>RU:</strong> Сохраните <strong>ID-номер (6 цифр)</strong> для бланка ответов (OMR) в день экзамена, а <strong>PIN-код</strong> — для личной проверки PDF-результата на сайте!',
    EN: '<strong>EN:</strong> Keep your <strong>6-digit Exam ID</strong> for your optical answer sheet (OMR) on exam day, and your <strong>Access PIN</strong> to privately view your PDF result online!',
  };

  const linkUrl =
    resultsUrl ||
    `https://luminamath.md/results?id=${encodeURIComponent(
      studentCode
    )}&pin=${encodeURIComponent(accessPin)}`;

  const html = `
  <!DOCTYPE html>
  <html lang="${lang.toLowerCase()}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${subject}</title>
  </head>
  <body style="margin: 0; padding: 20px 10px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color: #1e293b;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 640px; margin: 0 auto; background-color: #ffffff; border-radius: 18px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);">
      <!-- Header Banner -->
      <tr>
        <td style="background: linear-gradient(135deg, #2C3987 0%, #1e2866 100%); padding: 28px 24px; text-align: center; color: #ffffff;">
          <div style="display: inline-block; background-color: rgba(248, 167, 26, 0.2); border: 1px solid rgba(248, 167, 26, 0.55); color: #fde68a; font-size: 11px; font-weight: 800; letter-spacing: 1px; padding: 4px 14px; border-radius: 999px; text-transform: uppercase; margin-bottom: 10px;">
            CONFIRMARE ÎNREGISTRARE • ПОДТВЕРЖДЕНИЕ • REGISTRATION CONFIRMED
          </div>
          <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.3px; color: #ffffff;">
            Lumina<span style="color: #F8A71A;">Math</span> Moldova
          </h1>
          <p style="margin: 6px 0 0; font-size: 13px; color: #cbd5e1;">
            www.luminamath.md • Clasele III–VIII / 3–8 Классы / Grades 3–8
          </p>
        </td>
      </tr>

      <!-- Greeting & Trilingual Intro (Ordered by Student Language) -->
      <tr>
        <td style="padding: 26px 26px 10px 26px;">
          <h2 style="margin: 0 0 14px 0; font-size: 19px; font-weight: 800; color: #0f172a;">
            Bună ziua / Здравствуйте / Hello, <span style="color: #2C3987;">${fullName}</span>!
          </h2>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 14px;">
            ${orderedLangs
              .map(
                (l, idx) => `
              <tr>
                <td style="padding: ${idx === 0 ? '2px 0 6px 0' : '6px 0 2px 0'}; ${
                  idx < 2 ? 'border-bottom: 1px dashed #e2e8f0;' : ''
                } font-size: 13.5px; line-height: 1.55; color: ${
                  idx === 0 ? '#0f172a' : '#475569'
                };">
                  <span style="display: inline-block; font-size: 10px; font-weight: 800; background-color: ${
                    idx === 0 ? '#2C3987' : '#cbd5e1'
                  }; color: ${
                  idx === 0 ? '#ffffff' : '#1e293b'
                }; padding: 2px 6px; border-radius: 4px; margin-right: 6px; vertical-align: middle;">${
                  introByLang[l].tag
                }</span>
                  ${introByLang[l].text}
                </td>
              </tr>`
              )
              .join('')}
          </table>
        </td>
      </tr>

      <!-- Separate Clean Cards for EXAM ID and ACCESS PIN -->
      <tr>
        <td style="padding: 12px 26px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <!-- EXAM ID BOX -->
            <tr>
              <td style="background-color: #eef2ff; border: 2px solid #6366f1; border-radius: 14px; padding: 18px 16px; text-align: center;">
                <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #312e81;">
                  NUMĂRUL ID DE EXAMEN (LOGIN) &nbsp;•&nbsp; ВАШ ID-НОМЕР &nbsp;•&nbsp; YOUR EXAM ID
                </div>
                <div style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 7px; color: #1e1b4b; margin: 6px 0 2px 0;">
                  ${studentCode}
                </div>
                <div style="font-size: 11.5px; color: #4338ca; font-weight: 600;">
                  6 cifre pentru foaia optică (OMR) • 6 цифр для бланка ответов • 6-digit code for OMR answer sheet
                </div>
              </td>
            </tr>

            <tr><td style="height: 10px;"></td></tr>

            <!-- PIN CODE BOX -->
            <tr>
              <td style="background-color: #ecfdf5; border: 2px solid #10b981; border-radius: 14px; padding: 16px; text-align: center;">
                <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #065f46;">
                  PAROLA / COD PIN REZULTATE &nbsp;•&nbsp; ПАРОЛЬ (PIN-КОД) &nbsp;•&nbsp; RESULTS ACCESS PIN
                </div>
                <div style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #064e3b; margin: 6px 0 2px 0;">
                  ${accessPin}
                </div>
                <div style="font-size: 11.5px; color: #047857; font-weight: 600;">
                  Pentru verificarea rezultatului PDF • Для проверки результата • For checking your PDF result
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Student & Exam Information Table (Full RO / RU / EN Labels) -->
      <tr>
        <td style="padding: 10px 26px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; font-size: 13.5px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <tr style="background-color: #f8fafc;">
              <td style="padding: 11px 14px; border-bottom: 1px solid #e2e8f0; color: #64748b; width: 46%; font-weight: 600;">
                Elev / Ученик / Student:
              </td>
              <td style="padding: 11px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 800; color: #0f172a;">
                ${fullName}
              </td>
            </tr>
            <tr>
              <td style="padding: 11px 14px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 600;">
                Clasa / Класс / Grade:
              </td>
              <td style="padding: 11px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 800; color: #0f172a;">
                ${grade}
              </td>
            </tr>
            <tr style="background-color: #f8fafc;">
              <td style="padding: 11px 14px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 600;">
                Limba / Язык / Language:
              </td>
              <td style="padding: 11px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 800; color: #0f172a;">
                ${LANG_DISPLAY[lang]}
              </td>
            </tr>
            <tr>
              <td style="padding: 11px 14px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 600;">
                Școala / Школа / School:
              </td>
              <td style="padding: 11px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #0f172a;">
                ${school}
              </td>
            </tr>
            <tr style="background-color: #f8fafc;">
              <td style="padding: 11px 14px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 600;">
                Profesor / Учитель / Teacher:
              </td>
              <td style="padding: 11px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #0f172a;">
                ${teacherName}
              </td>
            </tr>
            <tr>
              <td style="padding: 11px 14px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 600;">
                Filiala / Филиал / Branch:
              </td>
              <td style="padding: 11px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 800; color: #2C3987;">
                ${branchName}
                <div style="font-size: 12px; font-weight: 500; color: #475569; margin-top: 2px;">
                  ${branchAddress}
                </div>
              </td>
            </tr>
            <tr style="background-color: #fffbeb;">
              <td style="padding: 12px 14px; color: #92400e; font-weight: 700;">
                Data Examenului / Дата экзамена / Exam Date:
              </td>
              <td style="padding: 12px 14px; font-weight: 900; color: #b45309; font-size: 14.5px;">
                ${examDateText}
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Trilingual Reminder Note -->
      <tr>
        <td style="padding: 10px 26px;">
          <div style="background-color: #fffbeb; border-left: 4px solid #F59122; border-radius: 8px; padding: 12px 14px; font-size: 12.5px; line-height: 1.55; color: #78350f;">
            ${orderedLangs.map((l) => `<div style="margin-bottom: 4px;">${reminderByLang[l]}</div>`).join('')}
          </div>
        </td>
      </tr>

      <!-- CTA Button -->
      <tr>
        <td style="padding: 14px 26px 24px 26px; text-align: center;">
          <a href="${linkUrl}" style="display: inline-block; background: linear-gradient(90deg, #2C3987, #4338ca); color: #ffffff; text-decoration: none; font-weight: 800; font-size: 13.5px; padding: 13px 26px; border-radius: 12px;">
            Verifică pe Site &nbsp;•&nbsp; Проверить на сайте &nbsp;•&nbsp; Check Online
          </a>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background-color: #0f172a; color: #94a3b8; padding: 18px 24px; text-align: center; font-size: 12px; line-height: 1.6;">
          <strong style="color: #ffffff;">© LuminaMath Moldova • IPLT „Orizont”</strong><br/>
          Web: <a href="https://luminamath.md" style="color: #F8A71A; text-decoration: none;">www.luminamath.md</a> &nbsp;|&nbsp;
          Email: <a href="mailto:luminamath@orizont.md" style="color: #F8A71A; text-decoration: none;">luminamath@orizont.md</a> &nbsp;|&nbsp;
          Tel: +373 (79) 000 073
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  const mailSetup = await createConfiguredTransporter();
  if (mailSetup) {
    try {
      await mailSetup.transporter.sendMail({
        from: mailSetup.from,
        to,
        subject,
        html,
      });
      return { sent: true, mode: 'smtp' };
    } catch (error) {
      console.error('[Email SMTP Error on Registration]:', error);
      return { sent: false, mode: 'simulated', error: (error as Error).message };
    }
  }

  console.log(`[Simulated Registration Email] To: ${to} | Student ID: ${studentCode}`);
  return { sent: true, mode: 'simulated' };
}

export async function sendResultPdfEmail(
  payload: ResultPdfEmailPayload
): Promise<{ sent: boolean; mode: 'smtp' | 'simulated'; error?: string }> {
  const {
    to,
    studentCode,
    accessPin,
    firstName,
    lastName,
    grade,
    school,
    teacherName,
    examLanguage,
    branchName,
    resultsUrl,
    pdfBuffer,
  } = payload;

  const lang: 'RO' | 'RU' | 'EN' = ['RO', 'RU', 'EN'].includes(examLanguage)
    ? examLanguage
    : 'RO';
  const orderedLangs = getOrderedLanguages(lang);
  const fullName = `${firstName} ${lastName}`;
  const pdfFilename = `LuminaMath_Result_${studentCode}.pdf`;

  const subjectByLang: Record<'RO' | 'RU' | 'EN', string> = {
    RO: `LuminaMath Moldova — Rezultatul Oficial PDF / Official Result (ID: ${studentCode})`,
    RU: `LuminaMath Moldova — Официальный результат PDF / Official Result (ID: ${studentCode})`,
    EN: `LuminaMath Moldova — Official Exam Result PDF (ID: ${studentCode})`,
  };
  const subject = subjectByLang[lang];

  const resultIntroByLang: Record<'RO' | 'RU' | 'EN', { tag: string; text: string }> = {
    RO: {
      tag: 'RO',
      text: 'Rezultatul dvs. oficial la Concursul Național de Matematică <strong>LuminaMath Moldova</strong> a fost publicat. Fișierul <strong>PDF</strong> cu fișa detaliată de evaluare (OMR) este atașat direct la acest email!',
    },
    RU: {
      tag: 'RU',
      text: 'Официальный результат Национальной математической олимпиады <strong>LuminaMath Moldova</strong> опубликован. <strong>PDF-файл</strong> с вашим подробным табелем (OMR) прикреплен прямо к этому письму!',
    },
    EN: {
      tag: 'EN',
      text: 'Your official result for the <strong>LuminaMath Moldova</strong> National Mathematics Competition has been published. Your detailed <strong>PDF</strong> evaluation report (OMR) is attached directly to this email!',
    },
  };

  const html = `
  <!DOCTYPE html>
  <html lang="${lang.toLowerCase()}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${subject}</title>
  </head>
  <body style="margin: 0; padding: 20px 10px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color: #1e293b;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 640px; margin: 0 auto; background-color: #ffffff; border-radius: 18px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);">
      <!-- Emerald Header Banner -->
      <tr>
        <td style="background: linear-gradient(135deg, #065f46 0%, #047857 100%); color: #ffffff; padding: 28px 24px; text-align: center;">
          <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.16); border: 1px solid rgba(255, 255, 255, 0.35); color: #ecfdf5; font-size: 11px; font-weight: 800; letter-spacing: 1px; padding: 4px 14px; border-radius: 999px; text-transform: uppercase; margin-bottom: 10px;">
            REZULTATE OFICIALE • ОФИЦИАЛЬНЫЕ РЕЗУЛЬТАТЫ • OFFICIAL RESULTS
          </div>
          <h1 style="margin: 0; font-size: 26px; font-weight: 900; color: #ffffff;">
            Lumina<span style="color: #fde68a;">Math</span> Moldova
          </h1>
          <p style="margin: 6px 0 0; color: #d1fae5; font-size: 13px;">
            Fișa individuală de evaluare OMR (PDF) • Индивидуальный табель • Individual Score Report
          </p>
        </td>
      </tr>

      <!-- Greeting & Trilingual Announcement -->
      <tr>
        <td style="padding: 26px 26px 10px 26px;">
          <h2 style="margin: 0 0 14px 0; font-size: 19px; font-weight: 800; color: #0f172a;">
            Felicitări / Поздравляем / Congratulations, <span style="color: #047857;">${fullName}</span>!
          </h2>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 14px;">
            ${orderedLangs
              .map(
                (l, idx) => `
              <tr>
                <td style="padding: ${idx === 0 ? '2px 0 6px 0' : '6px 0 2px 0'}; ${
                  idx < 2 ? 'border-bottom: 1px dashed #e2e8f0;' : ''
                } font-size: 13.5px; line-height: 1.55; color: ${
                  idx === 0 ? '#0f172a' : '#475569'
                };">
                  <span style="display: inline-block; font-size: 10px; font-weight: 800; background-color: ${
                    idx === 0 ? '#047857' : '#cbd5e1'
                  }; color: ${
                  idx === 0 ? '#ffffff' : '#1e293b'
                }; padding: 2px 6px; border-radius: 4px; margin-right: 6px; vertical-align: middle;">${
                  resultIntroByLang[l].tag
                }</span>
                  ${resultIntroByLang[l].text}
                </td>
              </tr>`
              )
              .join('')}
          </table>
        </td>
      </tr>

      <!-- Attached PDF Notice Banner -->
      <tr>
        <td style="padding: 8px 26px;">
          <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 12px 16px; text-align: center; font-size: 13px; color: #92400e; font-weight: 700;">
            📎 Fișier PDF atașat / Прикрепленный PDF / Attached PDF: <span style="font-family: monospace; color: #78350f; font-weight: 900;">${pdfFilename}</span>
          </div>
        </td>
      </tr>

      <!-- Credentials & Direct Online Result Link (Clean Side-by-Side Cards, No Duplication) -->
      <tr>
        <td style="padding: 10px 26px;">
          <div style="background-color: #ecfdf5; border: 2px solid #10b981; border-radius: 14px; padding: 18px; text-align: center;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td width="50%" style="padding: 6px; border-right: 1px solid #a7f3d0; text-align: center;">
                  <div style="font-size: 10.5px; font-weight: 800; text-transform: uppercase; color: #065f46; letter-spacing: 0.5px;">
                    ID PARTICIPANT / ID УЧАСТНИКА / EXAM ID
                  </div>
                  <div style="font-family: 'Courier New', Courier, monospace; font-size: 28px; font-weight: 900; letter-spacing: 4px; color: #064e3b; margin-top: 4px;">
                    ${studentCode}
                  </div>
                </td>
                <td width="50%" style="padding: 6px; text-align: center;">
                  <div style="font-size: 10.5px; font-weight: 800; text-transform: uppercase; color: #065f46; letter-spacing: 0.5px;">
                    COD PIN / ПАРОЛЬ PIN / ACCESS PIN
                  </div>
                  <div style="font-family: 'Courier New', Courier, monospace; font-size: 28px; font-weight: 900; letter-spacing: 4px; color: #064e3b; margin-top: 4px;">
                    ${accessPin}
                  </div>
                </td>
              </tr>
            </table>

            <div style="margin-top: 16px; padding-top: 14px; border-top: 1px dashed #a7f3d0;">
              <a href="${resultsUrl}" style="display: inline-block; background: linear-gradient(90deg, #059669, #047857); color: #ffffff; text-decoration: none; font-weight: 800; font-size: 13.5px; padding: 13px 26px; border-radius: 10px;">
                Deschide Rezultatul pe Site &nbsp;•&nbsp; Открыть на сайте &nbsp;•&nbsp; Open Result Online
              </a>
            </div>
          </div>
        </td>
      </tr>

      <!-- Student Summary Table (Full RO / RU / EN Labels) -->
      <tr>
        <td style="padding: 10px 26px 24px 26px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; font-size: 13.5px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <tr style="background-color: #f8fafc;">
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #64748b; width: 46%; font-weight: 600;">
                Elev / Ученик / Student:
              </td>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 800; color: #0f172a;">
                ${fullName}
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 600;">
                Clasa / Класс / Grade:
              </td>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 800; color: #0f172a;">
                ${grade} (${LANG_DISPLAY[lang]})
              </td>
            </tr>
            <tr style="background-color: #f8fafc;">
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 600;">
                Școala / Школа / School:
              </td>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #0f172a;">
                ${school}
              </td>
            </tr>
            ${
              teacherName
                ? `
            <tr>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 600;">
                Profesor / Учитель / Teacher:
              </td>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #0f172a;">
                ${teacherName}
              </td>
            </tr>`
                : ''
            }
            <tr style="background-color: #f8fafc;">
              <td style="padding: 10px 14px; color: #64748b; font-weight: 600;">
                Filiala / Филиал / Branch:
              </td>
              <td style="padding: 10px 14px; font-weight: 800; color: #065f46;">
                ${branchName}
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background-color: #0f172a; color: #94a3b8; padding: 18px 24px; text-align: center; font-size: 12px; line-height: 1.6;">
          <strong style="color: #ffffff;">© LuminaMath Moldova • IPLT „Orizont”</strong><br/>
          Web: <a href="https://luminamath.md" style="color: #F8A71A; text-decoration: none;">www.luminamath.md</a> &nbsp;|&nbsp;
          Email: <a href="mailto:luminamath@orizont.md" style="color: #F8A71A; text-decoration: none;">luminamath@orizont.md</a> &nbsp;|&nbsp;
          Document PDF: <span style="color: #e2e8f0;">${pdfFilename}</span>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  const mailSetup = await createConfiguredTransporter();
  if (!mailSetup) {
    return {
      sent: false,
      mode: 'simulated',
      error:
        'SMTP nu este configurat! Introduceți email-ul și Google App Password în secțiunea Administratori -> Configurare Email (SMTP).',
    };
  }

  try {
    await mailSetup.transporter.sendMail({
      from: mailSetup.from,
      to,
      subject,
      html,
      attachments: [
        {
          filename: pdfFilename,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
    return { sent: true, mode: 'smtp' };
  } catch (error) {
    console.error(`[Result Email SMTP Error for ${studentCode}]:`, error);
    return { sent: false, mode: 'smtp', error: (error as Error).message };
  }
}

export async function sendTestSmtpEmail(
  recipientEmail: string
): Promise<{ sent: boolean; error?: string }> {
  const mailSetup = await createConfiguredTransporter();
  if (!mailSetup) {
    return {
      sent: false,
      error:
        'Completați adresa de email SMTP și Google App Password (16 caractere) înainte de testare.',
    };
  }

  try {
    await mailSetup.transporter.sendMail({
      from: mailSetup.from,
      to: recipientEmail,
      subject: 'LuminaMath Moldova — Test Configurare Email / SMTP Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 2px solid #10b981; border-radius: 14px; background: #ffffff;">
          <h2 style="color: #065f46; margin-top: 0;">✅ LuminaMath Moldova — SMTP Email Active!</h2>
          <p style="color: #334155; font-size: 14px; line-height: 1.6;">
            <strong>RO:</strong> Configurarea email funcționează! Toate confirmările de înregistrare și rezultatele PDF vor fi trimise de pe <strong>${mailSetup.user}</strong>.<br/><br/>
            <strong>RU:</strong> Настройка почты работает! Все подтверждения регистрации и PDF-результаты будут отправляться с <strong>${mailSetup.user}</strong>.<br/><br/>
            <strong>EN:</strong> Email configuration is working! All registration confirmations and PDF results will be sent from <strong>${mailSetup.user}</strong>.
          </p>
        </div>
      `,
    });
    return { sent: true };
  } catch (error) {
    return { sent: false, error: (error as Error).message };
  }
}
