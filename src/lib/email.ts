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

const REG_COPY = {
  RO: {
    subject: (id: string) => `LuminaMath Moldova — Permis de Participare (ID: ${id})`,
    headerSubtitle: 'Concursul Național de Matematică • Clasele III – VIII',
    badge: 'CONFIRMARE ÎNREGISTRARE',
    greeting: (name: string) => `Bună ziua, ${name}!`,
    intro:
      'Înregistrarea dvs. la Concursul Național de Matematică <strong>LuminaMath Moldova</strong> (organizat de IPLT „Orizont”) a fost finalizată cu succes. Participarea este <strong>100% gratuită</strong>.',
    idBoxLabel: 'ID PARTICIPANT (6 CIFRE)',
    idBoxHint: 'Se completează pe foaia de concurs în ziua examenului',
    pinBoxLabel: 'PAROLA / COD PIN (6 CIFRE)',
    pinBoxHint: 'Pentru verificarea privată a rezultatului PDF pe site',
    detailsTitle: 'Detaliile Înregistrării & Examenului',
    lblStudent: 'Elev / Participant',
    lblGrade: 'Clasa',
    lblLang: 'Limba de susținere',
    lblSchool: 'Școala / Liceul',
    lblTeacher: 'Profesor de matematică',
    lblBranch: 'Centrul de examen (Filiala)',
    lblAddress: 'Adresa centrului de examen',
    lblExamDate: 'Data și ora probei scrise',
    rulesTitle: 'Important pentru ziua examenului:',
    rulesItems: [
      'Prezentați-vă la centrul de examen cu 20–30 de minute înainte de începerea probei.',
      'Aveți asupra dvs. carnetul de elev (sau actul de identitate), acest permis cu numărul ID și un pix sau creion.',
      'Telefoanele mobile, ceasurile inteligente, calculatoarele și riglele sunt strict interzise în sală.',
    ],
    ctaBtn: 'Verifică Înregistrarea / Pagina de Rezultate',
    trilingualNote:
      'Notă: Păstrați acest email! După publicarea rezultatelor, veți folosi ID-ul și Parola PIN pe www.luminamath.md pentru a descărca fișa dvs. oficială PDF.',
  },
  RU: {
    subject: (id: string) => `LuminaMath Moldova — Талон участника (Ваш ID: ${id})`,
    headerSubtitle: 'Национальная математическая олимпиада • 3 – 8 классы',
    badge: 'ПОДТВЕРЖДЕНИЕ РЕГИСТРАЦИИ',
    greeting: (name: string) => `Здравствуйте, ${name}!`,
    intro:
      'Ваша регистрация на Национальную математическую олимпиаду <strong>LuminaMath Moldova</strong> (организатор — IPLT «Orizont») успешно завершена. Участие <strong>100% бесплатное</strong>.',
    idBoxLabel: 'ID УЧАСТНИКА (6 ЦИФР)',
    idBoxHint: 'Указывается на бланке ответов в день письменного экзамена',
    pinBoxLabel: 'ПАРОЛЬ / PIN-КОД (6 ЦИФР)',
    pinBoxHint: 'Для личной проверки и скачивания PDF-результата на сайте',
    detailsTitle: 'Данные участника и место проведения экзамена',
    lblStudent: 'Ученик / Участник',
    lblGrade: 'Класс',
    lblLang: 'Язык экзамена',
    lblSchool: 'Школа / Лицей',
    lblTeacher: 'Учитель математики',
    lblBranch: 'Центр сдачи экзамена (Филиал)',
    lblAddress: 'Адрес центра экзамена',
    lblExamDate: 'Дата и время письменного этапа',
    rulesTitle: 'Важная памятка в день экзамена:',
    rulesItems: [
      'Приходите в выбранный филиал за 20–30 минут до начала экзамена.',
      'При себе необходимо иметь ученический билет (или свидетельство о рождении / удостоверение личности), ваш 6-значный ID-номер и ручку или карандаш.',
      'Мобильные телефоны, смарт-часы, калькуляторы и линейки в аудитории строго запрещены.',
    ],
    ctaBtn: 'Перейти на страницу результатов',
    trilingualNote:
      'Примечание: Сохраните это письмо! После публикации результатов вы сможете войти по вашему ID и PIN-коду на сайте www.luminamath.md и скачать свой PDF-табель.',
  },
  EN: {
    subject: (id: string) => `LuminaMath Moldova — Official Exam Pass (ID: ${id})`,
    headerSubtitle: 'National Mathematics Competition • Grades III – VIII',
    badge: 'REGISTRATION CONFIRMED',
    greeting: (name: string) => `Hello, ${name}!`,
    intro:
      'Your registration for the <strong>LuminaMath Moldova</strong> National Mathematics Competition (organized by IPLT "Orizont") has been successfully completed. Participation is <strong>100% free of charge</strong>.',
    idBoxLabel: 'PARTICIPANT ID (6 DIGITS)',
    idBoxHint: 'Used on your optical answer sheet on exam day',
    pinBoxLabel: 'ACCESS PIN / PASSWORD (6 DIGITS)',
    pinBoxHint: 'Used to privately view and download your PDF result online',
    detailsTitle: 'Participant & Written Exam Details',
    lblStudent: 'Student Name',
    lblGrade: 'Grade / Class',
    lblLang: 'Exam Language',
    lblSchool: 'School / Lyceum',
    lblTeacher: 'Mathematics Teacher',
    lblBranch: 'Examination Center (Branch)',
    lblAddress: 'Exam Center Address',
    lblExamDate: 'Written Exam Date & Time',
    rulesTitle: 'Important Exam Day Reminders:',
    rulesItems: [
      'Please arrive at your selected examination branch 20–30 minutes before the exam starts.',
      'Bring your student ID card (or birth certificate / ID), this 6-digit Participant ID, and a pen or pencil.',
      'Mobile phones, smartwatches, calculators, and rulers are strictly prohibited in the exam room.',
    ],
    ctaBtn: 'Open Official Results Page',
    trilingualNote:
      'Note: Please keep this email! Once results are published, you will use your 6-digit ID and Access PIN on www.luminamath.md to download your official PDF report card.',
  },
};

const LANG_DISPLAY: Record<'RO' | 'RU' | 'EN', string> = {
  RO: 'Română (RO)',
  RU: 'Русский (RU)',
  EN: 'English (EN)',
};

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
  } = payload;

  const lang: 'RO' | 'RU' | 'EN' = ['RO', 'RU', 'EN'].includes(examLanguage)
    ? examLanguage
    : 'RO';
  const copy = REG_COPY[lang];
  const subject = copy.subject(studentCode);
  const fullName = `${firstName} ${lastName}`;
  const resultsLink = `https://luminamath.md/results?id=${encodeURIComponent(
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
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 620px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);">
      <!-- Header Banner -->
      <tr>
        <td style="background: linear-gradient(135deg, #2C3987 0%, #1e2866 100%); padding: 28px 24px; text-align: center; color: #ffffff;">
          <div style="display: inline-block; background-color: rgba(248, 167, 26, 0.2); border: 1px solid rgba(248, 167, 26, 0.5); color: #fde68a; font-size: 11px; font-weight: 800; letter-spacing: 1.2px; padding: 4px 12px; border-radius: 999px; text-transform: uppercase; margin-bottom: 10px;">
            ${copy.badge}
          </div>
          <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.3px; color: #ffffff;">
            Lumina<span style="color: #F8A71A;">Math</span> Moldova
          </h1>
          <p style="margin: 6px 0 0; font-size: 13px; color: #cbd5e1;">
            ${copy.headerSubtitle}
          </p>
        </td>
      </tr>

      <!-- Greeting & Intro -->
      <tr>
        <td style="padding: 28px 28px 12px 28px;">
          <h2 style="margin: 0 0 10px 0; font-size: 19px; font-weight: 800; color: #0f172a;">
            ${copy.greeting(fullName)}
          </h2>
          <p style="margin: 0; font-size: 14px; line-height: 1.65; color: #334155;">
            ${copy.intro}
          </p>
        </td>
      </tr>

      <!-- ID & PIN Credentials Highlight Cards -->
      <tr>
        <td style="padding: 12px 28px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 2px dashed #6366f1; border-radius: 14px; padding: 18px;">
            <tr>
              <td style="text-align: center; padding-bottom: 14px; border-bottom: 1px solid #e2e8f0;">
                <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #2C3987;">
                  ${copy.idBoxLabel}
                </div>
                <div style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 6px; color: #1e1b4b; margin: 6px 0 4px 0;">
                  ${studentCode}
                </div>
                <div style="font-size: 12px; color: #64748b;">
                  ${copy.idBoxHint}
                </div>
              </td>
            </tr>
            <tr>
              <td style="text-align: center; padding-top: 14px;">
                <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #047857;">
                  ${copy.pinBoxLabel}
                </div>
                <div style="font-family: 'Courier New', Courier, monospace; font-size: 30px; font-weight: 900; letter-spacing: 5px; color: #065f46; margin: 6px 0 4px 0;">
                  ${accessPin}
                </div>
                <div style="font-size: 12px; color: #64748b;">
                  ${copy.pinBoxHint}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Student & Exam Information Table -->
      <tr>
        <td style="padding: 12px 28px;">
          <div style="font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.6px; color: #2C3987; margin-bottom: 10px;">
            ${copy.detailsTitle}
          </div>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; font-size: 14px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <tr style="background-color: #f8fafc;">
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #64748b; width: 42%;">${copy.lblStudent}:</td>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #0f172a;">${fullName}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #64748b;">${copy.lblGrade}:</td>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #0f172a;">${grade}</td>
            </tr>
            <tr style="background-color: #f8fafc;">
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #64748b;">${copy.lblLang}:</td>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #0f172a;">${LANG_DISPLAY[lang]}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #64748b;">${copy.lblSchool}:</td>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #0f172a;">${school}</td>
            </tr>
            <tr style="background-color: #f8fafc;">
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #64748b;">${copy.lblTeacher}:</td>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #0f172a;">${teacherName}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #64748b;">${copy.lblBranch}:</td>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 800; color: #2C3987;">${branchName}</td>
            </tr>
            <tr style="background-color: #f8fafc;">
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #64748b;">${copy.lblAddress}:</td>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #334155;">${branchAddress}</td>
            </tr>
            <tr style="background-color: #fffbeb;">
              <td style="padding: 12px 14px; color: #92400e; font-weight: 700;">${copy.lblExamDate}:</td>
              <td style="padding: 12px 14px; font-weight: 900; color: #b45309; font-size: 15px;">${examDateText}</td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Exam Day Guidelines Box -->
      <tr>
        <td style="padding: 12px 28px;">
          <div style="background-color: #f8fafc; border-left: 4px solid #F59122; border-radius: 8px; padding: 14px 16px;">
            <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 6px;">
              ${copy.rulesTitle}
            </div>
            <ul style="margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.55; color: #475569;">
              ${copy.rulesItems.map((item) => `<li style="margin-bottom: 4px;">${item}</li>`).join('')}
            </ul>
          </div>
        </td>
      </tr>

      <!-- CTA Button -->
      <tr>
        <td style="padding: 16px 28px 24px 28px; text-align: center;">
          <a href="${resultsLink}" style="display: inline-block; background: linear-gradient(90deg, #F59122, #ED5526); color: #ffffff; text-decoration: none; font-weight: 800; font-size: 14px; padding: 14px 28px; border-radius: 12px;">
            ${copy.ctaBtn}
          </a>
          <p style="margin: 12px 0 0; font-size: 12px; color: #64748b; line-height: 1.5;">
            ${copy.trilingualNote}
          </p>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background-color: #0f172a; color: #94a3b8; padding: 18px 24px; text-align: center; font-size: 12px; line-height: 1.6;">
          <strong style="color: #ffffff;">LuminaMath Moldova • IPLT „Orizont”</strong><br/>
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

const RESULT_COPY = {
  RO: {
    subject: (id: string) => `LuminaMath Moldova — Rezultatul Oficial PDF (ID: ${id})`,
    headerSubtitle: 'Rezultate Oficiale • Fișa Individuală de Evaluare (PDF)',
    greeting: (name: string) => `Felicitări, ${name}!`,
    intro:
      'Rezultatul dvs. oficial la Concursul Național de Matematică <strong>LuminaMath Moldova</strong> a fost publicat. <strong>Fișierul PDF cu rezultatul detaliat este atașat direct la acest email!</strong>',
    ctaBtn: 'Deschide Rezultatul pe Site',
    lblStudent: 'Elev / Participant',
    lblGrade: 'Clasa',
    lblSchool: 'Școala / Liceul',
    lblBranch: 'Centrul de examen',
  },
  RU: {
    subject: (id: string) => `LuminaMath Moldova — Официальный результат PDF (ID: ${id})`,
    headerSubtitle: 'Официальные результаты • Индивидуальный табель (PDF)',
    greeting: (name: string) => `Поздравляем, ${name}!`,
    intro:
      'Официальный результат Национальной математической олимпиады <strong>LuminaMath Moldova</strong> опубликован. <strong>PDF-файл с вашим подробным результатом прикреплен к этому письму!</strong>',
    ctaBtn: 'Открыть результат на сайте',
    lblStudent: 'Ученик / Участник',
    lblGrade: 'Класс',
    lblSchool: 'Школа / Лицей',
    lblBranch: 'Центр экзамена',
  },
  EN: {
    subject: (id: string) => `LuminaMath Moldova — Official PDF Result (ID: ${id})`,
    headerSubtitle: 'Official Results • Individual Evaluation Report (PDF)',
    greeting: (name: string) => `Congratulations, ${name}!`,
    intro:
      'Your official result for the <strong>LuminaMath Moldova</strong> National Mathematics Competition has been published. <strong>Your detailed PDF evaluation report is attached directly to this email!</strong>',
    ctaBtn: 'Open Result on Website',
    lblStudent: 'Student Name',
    lblGrade: 'Grade / Class',
    lblSchool: 'School / Lyceum',
    lblBranch: 'Exam Branch',
  },
};

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

  const lang: 'RO' | 'RU' | 'EN' = ['RO', 'RU', 'EN'].includes(examLanguage)
    ? examLanguage
    : 'RO';
  const copy = RESULT_COPY[lang];
  const subject = copy.subject(studentCode);
  const fullName = `${firstName} ${lastName}`;

  const html = `
  <!DOCTYPE html>
  <html lang="${lang.toLowerCase()}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${subject}</title>
  </head>
  <body style="margin: 0; padding: 20px 10px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color: #1e293b;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
      <tr>
        <td style="background: linear-gradient(135deg, #065f46, #047857); color: #ffffff; padding: 26px 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 900;">LuminaMath Moldova</h1>
          <p style="margin: 6px 0 0; opacity: 0.92; font-size: 13px;">${copy.headerSubtitle}</p>
        </td>
      </tr>
      <tr>
        <td style="padding: 26px;">
          <h2 style="margin: 0 0 10px 0; font-size: 18px; color: #0f172a;">${copy.greeting(fullName)}</h2>
          <p style="margin: 0 0 18px 0; font-size: 14px; line-height: 1.6; color: #334155;">
            ${copy.intro}
          </p>

          <div style="background: #ecfdf5; border: 2px solid #10b981; border-radius: 12px; padding: 18px; text-align: center; margin: 18px 0;">
            <div style="font-size: 12px; text-transform: uppercase; color: #065f46; font-weight: 800;">
              ID: ${studentCode} &nbsp;•&nbsp; PIN: ${accessPin}
            </div>
            <div style="font-size: 28px; font-weight: 900; letter-spacing: 4px; color: #064e3b; margin-top: 6px; font-family: monospace;">
              ID: ${studentCode} | PIN: ${accessPin}
            </div>
            <div style="margin-top: 14px;">
              <a href="${resultsUrl}" style="display: inline-block; background: #059669; color: #ffffff; text-decoration: none; font-weight: 800; font-size: 14px; padding: 12px 24px; border-radius: 10px;">
                ${copy.ctaBtn}
              </a>
            </div>
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 16px;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">${copy.lblStudent}:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 700; text-align: right;">${fullName} (${copy.lblGrade} ${grade})</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">${copy.lblSchool}:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 700; text-align: right;">${school}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">${copy.lblBranch}:</td>
              <td style="padding: 8px 0; font-weight: 700; text-align: right;">${branchName}</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="background: #0f172a; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8;">
          © LuminaMath Moldova • www.luminamath.md • luminamath@orizont.md
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
      error:
        'Completați adresa de email SMTP și Google App Password (16 caractere) înainte de testare.',
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
