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
}

export interface ResultPdfEmailPayload {
  to: string;
  studentCode: string;
  accessPin: string;
  firstName: string;
  lastName: string;
  grade: number;
  school: string;
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
  const from = cfg.smtp_from?.trim() || `LuminaMath Moldova <${user || 'info@luminamath.md'}>`;

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
    examDateText = '05 Decembrie 2026, 10:00 – 12:00',
  } = payload;

  const subjectByLang = {
    RO: `LuminaMath Moldova — ID de Examen: ${studentCode} & Parola PIN`,
    RU: `LuminaMath Moldova — Ваш ID: ${studentCode} и Пароль (PIN)`,
    EN: `LuminaMath Moldova — Exam ID: ${studentCode} & Access PIN`,
  };

  const subject = subjectByLang[examLanguage] || subjectByLang.RO;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #1e1b4b, #312e81); color: #ffffff; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">LuminaMath Moldova</h1>
        <p style="margin: 6px 0 0; opacity: 0.9; font-size: 14px;">www.luminamath.md • Confirmare Înregistrare / Registration Confirmation</p>
      </div>
      <div style="padding: 24px; color: #1e293b;">
        <p style="font-size: 16px;">Bună ziua / Здравствуйте / Hello, <strong>${firstName} ${lastName}</strong>!</p>
        <p style="font-size: 14px; line-height: 1.6;">
          Înregistrarea dvs. la concursul național de matematică <strong>LuminaMath Moldova</strong> a fost finalizată cu succes.<br/>
          Ваша регистрация на национальную математическую олимпиаду <strong>LuminaMath Moldova</strong> успешно завершена.
        </p>

        <div style="background: #eef2ff; border: 2px dashed #4f46e5; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0;">
          <div style="font-size: 12px; text-transform: uppercase; color: #3730a3; font-weight: bold; letter-spacing: 1px;">
            NUMĂRUL DVS. ID DE EXAMEN (LOGIN) / ВАШ ID-НОМЕР / YOUR EXAM ID
          </div>
          <div style="font-size: 38px; font-weight: 800; letter-spacing: 6px; color: #1e1b4b; margin-top: 8px; font-family: monospace;">
            ${studentCode}
          </div>
          <div style="margin-top: 14px; padding-top: 14px; border-top: 1px solid #c7d2fe;">
            <div style="font-size: 11px; text-transform: uppercase; color: #065f46; font-weight: bold; letter-spacing: 1px;">
              PAROLA / COD PIN PENTRU VERIFICAREA REZULTATELOR (ПАРОЛЬ / ACCESS PIN)
            </div>
            <div style="font-size: 28px; font-weight: 800; letter-spacing: 5px; color: #047857; margin-top: 4px; font-family: monospace;">
              ${accessPin}
            </div>
          </div>
          <div style="font-size: 12px; color: #475569; margin-top: 10px;">
            Păstrați ID-ul pentru foaia optică (OMR), iar Parola PIN pentru verificarea privată a rezultatului PDF!
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 16px;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Elev / Ученик / Student:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold; text-align: right;">${firstName} ${lastName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Clasa / Класс / Grade:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold; text-align: right;">${grade}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Școala / Школа / School:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold; text-align: right;">${school}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Profesor / Учитель / Teacher:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold; text-align: right;">${teacherName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Limba / Язык / Language:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold; text-align: right;">${examLanguage}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Filiala / Филиал / Branch:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold; text-align: right;">${branchName} (${branchAddress})</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Data Examenului / Дата экзамена:</td>
            <td style="padding: 8px 0; font-weight: bold; color: #4338ca; text-align: right;">${examDateText}</td>
          </tr>
        </table>
      </div>
      <div style="background: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #64748b;">
        © LuminaMath Moldova • www.luminamath.md
      </div>
    </div>
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
    examLanguage,
    branchName,
    resultsUrl,
    pdfBuffer,
  } = payload;

  const subjectByLang = {
    RO: `LuminaMath Moldova — Rezultatul Oficial PDF (ID: ${studentCode})`,
    RU: `LuminaMath Moldova — Официальный результат PDF (ID: ${studentCode})`,
    EN: `LuminaMath Moldova — Official PDF Result (ID: ${studentCode})`,
  };

  const subject = subjectByLang[examLanguage] || subjectByLang.RO;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #065f46, #047857); color: #ffffff; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">LuminaMath Moldova — Rezultate Oficiale</h1>
        <p style="margin: 6px 0 0; opacity: 0.9; font-size: 14px;">Fișa individuală de evaluare OMR (PDF atașat)</p>
      </div>
      <div style="padding: 24px; color: #1e293b;">
        <p style="font-size: 16px;">Felicitări / Поздравляем / Congratulations, <strong>${firstName} ${lastName}</strong>!</p>
        <p style="font-size: 14px; line-height: 1.6;">
          Rezultatul dvs. oficial la concursul de matematică <strong>LuminaMath Moldova</strong> a fost publicat.<br/>
          Официальный результат математической олимпиады <strong>LuminaMath Moldova</strong> опубликован.<br/>
          <strong>Fișierul PDF cu rezultatul detaliat (OMR) este atașat direct la acest email!</strong>
        </p>

        <div style="background: #ecfdf5; border: 2px solid #10b981; border-radius: 10px; padding: 18px; text-align: center; margin: 20px 0;">
          <div style="font-size: 12px; text-transform: uppercase; color: #065f46; font-weight: bold;">
            ID PARTICIPANT (LOGIN): ${studentCode} • PAROLA PIN: ${accessPin}
          </div>
          <div style="font-size: 30px; font-weight: 800; letter-spacing: 5px; color: #064e3b; margin-top: 6px; font-family: monospace;">
            ID: ${studentCode} | PIN: ${accessPin}
          </div>
          <div style="margin-top: 14px;">
            <a href="${resultsUrl}" style="display: inline-block; background: #059669; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 14px; padding: 12px 24px; border-radius: 8px;">
              Deschide Rezultatul pe Site / Открыть на сайте
            </a>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 16px;">
          <tr>
            <td style="padding: 7px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Elev / Ученик:</td>
            <td style="padding: 7px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold; text-align: right;">${firstName} ${lastName} (Clasa ${grade})</td>
          </tr>
          <tr>
            <td style="padding: 7px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Școala / Школа:</td>
            <td style="padding: 7px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold; text-align: right;">${school}</td>
          </tr>
          <tr>
            <td style="padding: 7px 0; color: #64748b;">Filiala / Филиал:</td>
            <td style="padding: 7px 0; font-weight: bold; text-align: right;">${branchName}</td>
          </tr>
        </table>
      </div>
      <div style="background: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #64748b;">
        © LuminaMath Moldova • Document PDF atașat: LuminaMath_Result_${studentCode}.pdf
      </div>
    </div>
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
          filename: `LuminaMath_Result_${studentCode}.pdf`,
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
      error: 'Completați adresa de email SMTP și Google App Password (16 caractere) înainte de testare.',
    };
  }

  try {
    await mailSetup.transporter.sendMail({
      from: mailSetup.from,
      to: recipientEmail,
      subject: 'LuminaMath Moldova — Test Configurare Email (SMTP Activ)',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; border: 2px solid #10b981; border-radius: 12px;">
          <h2 style="color: #065f46; margin-top: 0;">✅ Configurarea Email LuminaMath funcționează!</h2>
          <p style="color: #334155; font-size: 14px; line-height: 1.6;">
            Acesta este un mesaj de test trimis din panoul de administrare <strong>LuminaMath Moldova</strong>.<br/>
            De acum, toate confirmările de înregistrare (cu ID-ul de 6 cifre) și rezultatele PDF vor fi expediate automat de pe contul <strong>${mailSetup.user}</strong>.
          </p>
        </div>
      `,
    });
    return { sent: true };
  } catch (error) {
    return { sent: false, error: (error as Error).message };
  }
}
