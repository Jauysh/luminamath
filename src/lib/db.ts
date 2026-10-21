import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Pool } from 'pg';
import { generateSampleOmrPdf } from './sample-pdf';

export interface BranchRecord {
  id: number;
  code: number; // 1..9 (1 = Lumina, 2 = Durlești, etc.)
  name_ro: string;
  name_ru: string;
  name_en: string;
  city: string;
  address: string;
  is_active: boolean;
}

export interface AdminEmailRecord {
  id: number;
  email: string;
  name: string;
  role: string;
  created_at: string;
}

export const INITIAL_ADMIN_EMAILS: { email: string; name: string; role: string }[] = [
  { email: 'azamatjauysh@orizont.md', name: 'Azamat Jauysh (Orizont)', role: 'Super Admin' },
  { email: 'jeyhunalakbarov@orizont.md', name: 'Jeyhun Alakbarov (Orizont)', role: 'Admin' },
  { email: 'a.jauysh@gmail.com', name: 'Azamat Jauysh (Gmail)', role: 'Super Admin' },
];

export interface SiteSettingsRecord {
  edition: string;
  exam_time: string;
  stage1_date_ro: string;
  stage1_date_ru: string;
  stage1_date_en: string;
  stage2_date_ro: string;
  stage2_date_ru: string;
  stage2_date_en: string;
  stage3_date_ro: string;
  stage3_date_ru: string;
  stage3_date_en: string;
  stage4_date_ro: string;
  stage4_date_ru: string;
  stage4_date_en: string;
  contact_email: string;
  contact_phone: string;
  google_client_id?: string;
}

export const DEFAULT_SITE_SETTINGS: SiteSettingsRecord = {
  edition: '2026–2027',
  exam_time: '10:00 – 12:00',
  stage1_date_ro: '08 Septembrie – 31 Octombrie 2026',
  stage1_date_ru: '08 Сентября – 31 Октября 2026',
  stage1_date_en: '08 September – 31 October 2026',
  stage2_date_ro: '05 Decembrie 2026',
  stage2_date_ru: '05 Декабря 2026',
  stage2_date_en: '05 December 2026',
  stage3_date_ro: '18 Decembrie 2026',
  stage3_date_ru: '18 Декабря 2026',
  stage3_date_en: '18 December 2026',
  stage4_date_ro: '15 Ianuarie 2027',
  stage4_date_ru: '15 Января 2027',
  stage4_date_en: '15 January 2027',
  contact_email: 'info@luminamath.md',
  contact_phone: '+373 22 000 000',
  google_client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
};

export interface EmailConfigRecord {
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_pass: string;
  smtp_from: string;
}

export const DEFAULT_EMAIL_CONFIG: EmailConfigRecord = {
  smtp_host: process.env.SMTP_HOST || 'smtp.gmail.com',
  smtp_port: Number(process.env.SMTP_PORT || 465),
  smtp_user: process.env.SMTP_USER || 'azamatjauysh@orizont.md',
  smtp_pass: process.env.SMTP_PASS || '',
  smtp_from: process.env.SMTP_FROM || 'LuminaMath Moldova <azamatjauysh@orizont.md>',
};

export interface StudentRecord {
  id: string;
  student_code: string; // 6-digit ID: [Branch: 1][Grade: 2][Seq: 3], e.g. 201001, 202001
  access_pin: string; // 6-digit secret PIN/password for viewing results
  first_name: string;
  last_name: string;
  grade: number;
  school: string;
  teacher_name: string;
  exam_language: 'RO' | 'RU' | 'EN';
  branch_id: number;
  branch_code: number;
  branch_name_ro?: string;
  branch_name_ru?: string;
  branch_name_en?: string;
  branch_address?: string;
  email: string;
  phone: string;
  email_sent: boolean;
  has_result_pdf: boolean;
  result_uploaded_at: string | null;
  result_email_sent?: boolean;
  result_email_sent_at?: string | null;
  created_at: string;
}

export interface CreateStudentInput {
  firstName: string;
  lastName: string;
  grade: number;
  school: string;
  teacherName: string;
  examLanguage: 'RO' | 'RU' | 'EN';
  branchId: number;
  email: string;
  phone: string;
}

export function formatStudentId(branchCode: number, grade: number, seq: number): string {
  const b = String(branchCode).slice(-1);
  const g = String(grade).padStart(2, '0').slice(-2);
  const s = String(seq).padStart(3, '0').slice(-3);
  return `${b}${g}${s}`;
}

// ============================================================================
// PostgreSQL Connection Pool (High Concurrency: 700+ simultaneous users)
// ============================================================================
declare global {
  // eslint-disable-next-line no-var
  var __luminaPgPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __luminaPgInitialized: boolean | undefined;
}

function getPgPool(): Pool | null {
  const dbUrl = process.env.DATABASE_URL?.trim();
  if (!dbUrl) return null;

  if (!global.__luminaPgPool) {
    const needsSsl = dbUrl.includes('sslmode=require') || dbUrl.includes('neon.tech');
    global.__luminaPgPool = new Pool({
      connectionString: dbUrl,
      ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
      max: 25,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return global.__luminaPgPool;
}

async function ensurePgInitialized(pool: Pool): Promise<boolean> {
  if (global.__luminaPgInitialized) return true;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS branches (
        id SERIAL PRIMARY KEY,
        code INT UNIQUE NOT NULL CHECK (code >= 1 AND code <= 9),
        name_ro VARCHAR(150) NOT NULL,
        name_ru VARCHAR(150) NOT NULL,
        name_en VARCHAR(150) NOT NULL,
        city VARCHAR(100) NOT NULL DEFAULT 'Chișinău',
        address TEXT NOT NULL DEFAULT '',
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS admin_emails (
        id SERIAL PRIMARY KEY,
        email VARCHAR(160) UNIQUE NOT NULL,
        name VARCHAR(150) NOT NULL DEFAULT '',
        role VARCHAR(50) NOT NULL DEFAULT 'Admin',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS site_settings (
        id INT PRIMARY KEY DEFAULT 1,
        settings_json JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS email_config (
        id INT PRIMARY KEY DEFAULT 1,
        smtp_host VARCHAR(150) NOT NULL DEFAULT 'smtp.gmail.com',
        smtp_port INT NOT NULL DEFAULT 465,
        smtp_user VARCHAR(160) NOT NULL DEFAULT '',
        smtp_pass TEXT NOT NULL DEFAULT '',
        smtp_from VARCHAR(200) NOT NULL DEFAULT 'LuminaMath Moldova <azamatjauysh@orizont.md>',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS id_counters (
        branch_code INT NOT NULL,
        grade INT NOT NULL,
        last_seq INT NOT NULL DEFAULT 0,
        PRIMARY KEY (branch_code, grade)
      );

      CREATE TABLE IF NOT EXISTS students (
        id VARCHAR(36) PRIMARY KEY,
        student_code VARCHAR(6) UNIQUE NOT NULL,
        access_pin VARCHAR(12) NOT NULL DEFAULT '',
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        grade INT NOT NULL CHECK (grade >= 1 AND grade <= 12),
        school VARCHAR(200) NOT NULL,
        teacher_name VARCHAR(150) NOT NULL,
        exam_language VARCHAR(5) NOT NULL CHECK (exam_language IN ('RO', 'RU', 'EN')),
        branch_id INT NOT NULL REFERENCES branches(id),
        branch_code INT NOT NULL,
        email VARCHAR(150) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        email_sent BOOLEAN NOT NULL DEFAULT false,
        has_result_pdf BOOLEAN NOT NULL DEFAULT false,
        result_uploaded_at TIMESTAMPTZ,
        result_email_sent BOOLEAN NOT NULL DEFAULT false,
        result_email_sent_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      ALTER TABLE students ADD COLUMN IF NOT EXISTS access_pin VARCHAR(12) NOT NULL DEFAULT '';
      ALTER TABLE students ADD COLUMN IF NOT EXISTS result_email_sent BOOLEAN NOT NULL DEFAULT false;
      ALTER TABLE students ADD COLUMN IF NOT EXISTS result_email_sent_at TIMESTAMPTZ;

      UPDATE students
      SET access_pin = LPAD(FLOOR(100000 + RANDOM() * 899999)::int::text, 6, '0')
      WHERE access_pin IS NULL OR access_pin = '';

      CREATE UNIQUE INDEX IF NOT EXISTS idx_students_student_code ON students(student_code);
      CREATE INDEX IF NOT EXISTS idx_students_branch_grade ON students(branch_code, grade);

      CREATE TABLE IF NOT EXISTS student_results (
        student_code VARCHAR(6) PRIMARY KEY REFERENCES students(student_code) ON DELETE CASCADE,
        file_name VARCHAR(150) NOT NULL,
        pdf_data BYTEA NOT NULL,
        file_size INT NOT NULL,
        uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      INSERT INTO branches (code, name_ro, name_ru, name_en, city, address, is_active)
      VALUES
        (1, 'Filiala Ceadîr-Lunga', 'Филиал Чадыр-Лунга (Ceadîr-Lunga)', 'CEADIR LUNGA BRANCH', 'Ceadîr-Lunga', 'Str. Lenin 87, MD-6104, Ceadir Lunga, Moldova', true),
        (2, 'Filiala Ciocana Primary (Chișinău)', 'Филиал Чеканы Primary (Кишинёв)', 'CIOCANA PRIMARY BRANCH', 'Chișinău', 'Str. Mircea Cel Batrin 10/2, MD-2044, Ciocana, Mun. Chisinau, Moldova', true),
        (3, 'Filiala Buiucani (Chișinău)', 'Филиал Буюканы (Кишинёв)', 'BUIUCANI BRANCH', 'Chișinău', 'Str. Ion Pelivan 13/A, MD-2064, Buiucani, Mun. Chisinau, Moldova', true),
        (4, 'Filiala Bălți', 'Филиал Бельцы (Bălți)', 'BALTI BRANCH', 'Bălți', 'Str. Chisinaului 28, MD-3310, Balti, Moldova', true)
      ON CONFLICT (code) DO UPDATE SET
        name_ro = EXCLUDED.name_ro,
        name_ru = EXCLUDED.name_ru,
        name_en = EXCLUDED.name_en,
        city = EXCLUDED.city,
        address = EXCLUDED.address,
        is_active = true;

      INSERT INTO admin_emails (email, name, role)
      VALUES
        ('azamatjauysh@orizont.md', 'Azamat Jauysh (Orizont)', 'Super Admin'),
        ('jeyhunalakbarov@orizont.md', 'Jeyhun Alakbarov (Orizont)', 'Admin'),
        ('a.jauysh@gmail.com', 'Azamat Jauysh (Gmail)', 'Super Admin')
      ON CONFLICT (email) DO NOTHING;
    `);

    await pool.query(
      `INSERT INTO site_settings (id, settings_json)
       VALUES (1, $1::jsonb)
       ON CONFLICT (id) DO NOTHING`,
      [JSON.stringify(DEFAULT_SITE_SETTINGS)]
    );

    // Seed demo student 201001 and 105001 if not exists
    const demoCheck = await pool.query(
      `SELECT student_code FROM students WHERE student_code IN ('201001', '105001')`
    );
    if (demoCheck.rowCount === 0) {
      const bRes2 = await pool.query(`SELECT id FROM branches WHERE code = 2 LIMIT 1`);
      if (bRes2.rows[0]) {
        const demoPdf = generateSampleOmrPdf({
          studentCode: '201001',
          fullName: 'Damir Rusu',
          grade: 2,
          school: 'Liceul Teoretic Orizont (Durlești)',
          branchName: 'Chisinau - Filiala Durlesti',
          examLanguage: 'RO',
          score: 95.0,
        });
        await pool.query(
          `INSERT INTO students (
            id, student_code, first_name, last_name, grade, school, teacher_name,
            exam_language, branch_id, branch_code, email, phone, email_sent, has_result_pdf, result_uploaded_at
          ) VALUES ($1, '201001', 'Damir', 'Rusu', 2, 'Liceul Teoretic Orizont', 'Elena Moraru', 'RO', $2, 2, 'damir.rusu@example.md', '+373 69 123 456', true, true, now())
          ON CONFLICT (student_code) DO NOTHING`,
          [crypto.randomUUID(), bRes2.rows[0].id]
        );
        await pool.query(
          `INSERT INTO student_results (student_code, file_name, pdf_data, file_size)
           VALUES ('201001', '201001.pdf', $1, $2)
           ON CONFLICT (student_code) DO NOTHING`,
          [demoPdf, demoPdf.length]
        );
      }

      const bRes1 = await pool.query(`SELECT id FROM branches WHERE code = 1 LIMIT 1`);
      if (bRes1.rows[0]) {
        const demoPdf2 = generateSampleOmrPdf({
          studentCode: '105001',
          fullName: 'Sofia Cebotari',
          grade: 5,
          school: 'Liceul Teoretic Mihai Eminescu',
          branchName: 'Chisinau - Filiala Lumina',
          examLanguage: 'RO',
          score: 88.5,
        });
        await pool.query(
          `INSERT INTO students (
            id, student_code, first_name, last_name, grade, school, teacher_name,
            exam_language, branch_id, branch_code, email, phone, email_sent, has_result_pdf, result_uploaded_at
          ) VALUES ($1, '105001', 'Sofia', 'Cebotari', 5, 'Liceul Teoretic Mihai Eminescu', 'Ion Munteanu', 'RO', $2, 1, 'sofia.cebotari@example.md', '+373 68 555 777', true, true, now())
          ON CONFLICT (student_code) DO NOTHING`,
          [crypto.randomUUID(), bRes1.rows[0].id]
        );
        await pool.query(
          `INSERT INTO student_results (student_code, file_name, pdf_data, file_size)
           VALUES ('105001', '105001.pdf', $1, $2)
           ON CONFLICT (student_code) DO NOTHING`,
          [demoPdf2, demoPdf2.length]
        );
      }
    }

    global.__luminaPgInitialized = true;
    return true;
  } catch (err) {
    console.warn('[DB] PostgreSQL connection failed, using local JSON fallback store:', (err as Error).message);
    return false;
  }
}

// ============================================================================
// Local File Store Fallback (for instant zero-config local preview)
// ============================================================================
interface LocalStoreSchema {
  branches: BranchRecord[];
  adminEmails?: AdminEmailRecord[];
  settings?: SiteSettingsRecord;
  emailConfig?: EmailConfigRecord;
  counters: Record<string, number>;
  students: StudentRecord[];
}

const DATA_DIR = path.join(process.cwd(), '.data');
const PDF_DIR = path.join(DATA_DIR, 'pdfs');
const DB_FILE = path.join(DATA_DIR, 'luminamath-db.json');

function ensureLocalStore(): LocalStoreSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(PDF_DIR)) {
    fs.mkdirSync(PDF_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const now = new Date().toISOString();
    const initialBranches: BranchRecord[] = [
      {
        id: 1,
        code: 1,
        name_ro: 'Filiala Ceadîr-Lunga',
        name_ru: 'Филиал Чадыр-Лунга (Ceadîr-Lunga)',
        name_en: 'CEADIR LUNGA BRANCH',
        city: 'Ceadîr-Lunga',
        address: 'Str. Lenin 87, MD-6104, Ceadir Lunga, Moldova',
        is_active: true,
      },
      {
        id: 2,
        code: 2,
        name_ro: 'Filiala Ciocana Primary (Chișinău)',
        name_ru: 'Филиал Чеканы Primary (Кишинёв)',
        name_en: 'CIOCANA PRIMARY BRANCH',
        city: 'Chișinău',
        address: 'Str. Mircea Cel Batrin 10/2, MD-2044, Ciocana, Mun. Chisinau, Moldova',
        is_active: true,
      },
      {
        id: 3,
        code: 3,
        name_ro: 'Filiala Buiucani (Chișinău)',
        name_ru: 'Филиал Буюканы (Кишинёв)',
        name_en: 'BUIUCANI BRANCH',
        city: 'Chișinău',
        address: 'Str. Ion Pelivan 13/A, MD-2064, Buiucani, Mun. Chisinau, Moldova',
        is_active: true,
      },
      {
        id: 4,
        code: 4,
        name_ro: 'Filiala Bălți',
        name_ru: 'Филиал Бельцы (Bălți)',
        name_en: 'BALTI BRANCH',
        city: 'Bălți',
        address: 'Str. Chisinaului 28, MD-3310, Balti, Moldova',
        is_active: true,
      },
    ];

    const demoPdf201001 = generateSampleOmrPdf({
      studentCode: '201001',
      fullName: 'Damir Rusu',
      grade: 2,
      school: 'Liceul Teoretic Orizont (Durlești)',
      branchName: 'Chisinau - Filiala Durlesti',
      examLanguage: 'RO',
      score: 95.0,
    });
    fs.writeFileSync(path.join(PDF_DIR, '201001.pdf'), demoPdf201001);

    const demoPdf105001 = generateSampleOmrPdf({
      studentCode: '105001',
      fullName: 'Sofia Cebotari',
      grade: 5,
      school: 'Liceul Teoretic Mihai Eminescu',
      branchName: 'Chisinau - Filiala Lumina',
      examLanguage: 'RO',
      score: 88.5,
    });
    fs.writeFileSync(path.join(PDF_DIR, '105001.pdf'), demoPdf105001);

    const initialData: LocalStoreSchema = {
      branches: initialBranches,
      adminEmails: INITIAL_ADMIN_EMAILS.map((item, idx) => ({
        id: idx + 1,
        email: item.email,
        name: item.name,
        role: item.role,
        created_at: now,
      })),
      settings: DEFAULT_SITE_SETTINGS,
      counters: {
        '2_1': 1,
        '1_5': 1,
      },
      students: [
        {
          id: crypto.randomUUID(),
          student_code: '201001',
          access_pin: '482915',
          first_name: 'Damir',
          last_name: 'Rusu',
          grade: 2,
          school: 'Liceul Teoretic Orizont (Durlești)',
          teacher_name: 'Elena Moraru',
          exam_language: 'RO',
          branch_id: 2,
          branch_code: 2,
          email: 'damir.rusu@example.md',
          phone: '+373 69 123 456',
          email_sent: true,
          has_result_pdf: true,
          result_uploaded_at: now,
          created_at: now,
        },
        {
          id: crypto.randomUUID(),
          student_code: '105001',
          access_pin: '739204',
          first_name: 'Sofia',
          last_name: 'Cebotari',
          grade: 5,
          school: 'Liceul Teoretic Mihai Eminescu',
          teacher_name: 'Ion Munteanu',
          exam_language: 'RO',
          branch_id: 1,
          branch_code: 1,
          email: 'sofia.cebotari@example.md',
          phone: '+373 68 555 777',
          email_sent: true,
          has_result_pdf: true,
          result_uploaded_at: now,
          created_at: now,
        },
      ],
    };

    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf8');
    return initialData;
  }

  const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) as LocalStoreSchema;
  if (!parsed.settings) {
    parsed.settings = DEFAULT_SITE_SETTINGS;
  }
  if (
    !parsed.branches ||
    parsed.branches.length < 4 ||
    parsed.branches[0]?.name_en !== 'CEADIR LUNGA BRANCH'
  ) {
    parsed.branches = [
      {
        id: 1,
        code: 1,
        name_ro: 'Filiala Ceadîr-Lunga',
        name_ru: 'Филиал Чадыр-Лунга (Ceadîr-Lunga)',
        name_en: 'CEADIR LUNGA BRANCH',
        city: 'Ceadîr-Lunga',
        address: 'Str. Lenin 87, MD-6104, Ceadir Lunga, Moldova',
        is_active: true,
      },
      {
        id: 2,
        code: 2,
        name_ro: 'Filiala Ciocana Primary (Chișinău)',
        name_ru: 'Филиал Чеканы Primary (Кишинёв)',
        name_en: 'CIOCANA PRIMARY BRANCH',
        city: 'Chișinău',
        address: 'Str. Mircea Cel Batrin 10/2, MD-2044, Ciocana, Mun. Chisinau, Moldova',
        is_active: true,
      },
      {
        id: 3,
        code: 3,
        name_ro: 'Filiala Buiucani (Chișinău)',
        name_ru: 'Филиал Буюканы (Кишинёв)',
        name_en: 'BUIUCANI BRANCH',
        city: 'Chișinău',
        address: 'Str. Ion Pelivan 13/A, MD-2064, Buiucani, Mun. Chisinau, Moldova',
        is_active: true,
      },
      {
        id: 4,
        code: 4,
        name_ro: 'Filiala Bălți',
        name_ru: 'Филиал Бельцы (Bălți)',
        name_en: 'BALTI BRANCH',
        city: 'Bălți',
        address: 'Str. Chisinaului 28, MD-3310, Balti, Moldova',
        is_active: true,
      },
    ];
    saveLocalStore(parsed);
  }
  if (!parsed.adminEmails || parsed.adminEmails.length === 0) {
    const now = new Date().toISOString();
    parsed.adminEmails = INITIAL_ADMIN_EMAILS.map((item, idx) => ({
      id: idx + 1,
      email: item.email,
      name: item.name,
      role: item.role,
      created_at: now,
    }));
    saveLocalStore(parsed);
  }
  return parsed;
}

function saveLocalStore(data: LocalStoreSchema) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// ============================================================================
// Admin Whitelisted Emails (Google Sign-In / Gmail Access Control)
// ============================================================================

export async function getAdminEmails(): Promise<AdminEmailRecord[]> {
  const pool = getPgPool();
  if (pool && (await ensurePgInitialized(pool))) {
    const res = await pool.query('SELECT * FROM admin_emails ORDER BY id ASC');
    return res.rows;
  }

  const store = ensureLocalStore();
  return store.adminEmails || [];
}

export async function isEmailAuthorizedAdmin(email: string): Promise<AdminEmailRecord | null> {
  const clean = email.toLowerCase().trim();
  if (!clean) return null;

  const pool = getPgPool();
  if (pool && (await ensurePgInitialized(pool))) {
    const res = await pool.query(
      'SELECT * FROM admin_emails WHERE LOWER(email) = $1 LIMIT 1',
      [clean]
    );
    return res.rows[0] || null;
  }

  const store = ensureLocalStore();
  return (store.adminEmails || []).find((a) => a.email.toLowerCase() === clean) || null;
}

export async function addAdminEmail(input: {
  email: string;
  name?: string;
  role?: string;
}): Promise<AdminEmailRecord[]> {
  const cleanEmail = input.email.toLowerCase().trim();
  const cleanName = (input.name || cleanEmail.split('@')[0]).trim();
  const cleanRole = (input.role || 'Admin').trim();

  const pool = getPgPool();
  if (pool && (await ensurePgInitialized(pool))) {
    await pool.query(
      `INSERT INTO admin_emails (email, name, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET
         name = EXCLUDED.name,
         role = EXCLUDED.role`,
      [cleanEmail, cleanName, cleanRole]
    );
    return getAdminEmails();
  }

  const store = ensureLocalStore();
  const list = store.adminEmails || [];
  const existingIdx = list.findIndex((a) => a.email.toLowerCase() === cleanEmail);
  if (existingIdx >= 0) {
    list[existingIdx].name = cleanName;
    list[existingIdx].role = cleanRole;
  } else {
    list.push({
      id: list.length > 0 ? Math.max(...list.map((a) => a.id)) + 1 : 1,
      email: cleanEmail,
      name: cleanName,
      role: cleanRole,
      created_at: new Date().toISOString(),
    });
  }
  store.adminEmails = list;
  saveLocalStore(store);
  return list;
}

export async function removeAdminEmail(emailToRemove: string): Promise<AdminEmailRecord[]> {
  const clean = emailToRemove.toLowerCase().trim();
  const pool = getPgPool();
  if (pool && (await ensurePgInitialized(pool))) {
    await pool.query('DELETE FROM admin_emails WHERE LOWER(email) = $1', [clean]);
    return getAdminEmails();
  }

  const store = ensureLocalStore();
  store.adminEmails = (store.adminEmails || []).filter(
    (a) => a.email.toLowerCase() !== clean
  );
  saveLocalStore(store);
  return store.adminEmails;
}

// ============================================================================
// Site Settings (Dynamic Calendar & Dates)
// ============================================================================

export async function getSiteSettings(): Promise<SiteSettingsRecord> {
  const pool = getPgPool();
  if (pool && (await ensurePgInitialized(pool))) {
    const res = await pool.query('SELECT settings_json FROM site_settings WHERE id = 1 LIMIT 1');
    if (res.rows[0]?.settings_json) {
      return {
        ...DEFAULT_SITE_SETTINGS,
        ...res.rows[0].settings_json,
        google_client_id:
          res.rows[0].settings_json.google_client_id ||
          process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
          '',
      };
    }
    return DEFAULT_SITE_SETTINGS;
  }

  const store = ensureLocalStore();
  return {
    ...DEFAULT_SITE_SETTINGS,
    ...(store.settings || {}),
    google_client_id:
      store.settings?.google_client_id || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
  };
}

export async function updateSiteSettings(
  partial: Partial<SiteSettingsRecord>
): Promise<SiteSettingsRecord> {
  const current = await getSiteSettings();
  const merged: SiteSettingsRecord = {
    ...current,
    ...partial,
  };

  const pool = getPgPool();
  if (pool && (await ensurePgInitialized(pool))) {
    await pool.query(
      `INSERT INTO site_settings (id, settings_json, updated_at)
       VALUES (1, $1::jsonb, now())
       ON CONFLICT (id) DO UPDATE SET
         settings_json = EXCLUDED.settings_json,
         updated_at = now()`,
      [JSON.stringify(merged)]
    );
    return merged;
  }

  const store = ensureLocalStore();
  store.settings = merged;
  saveLocalStore(store);
  return merged;
}

// ============================================================================
// Email / SMTP Configuration (Admin-Protected)
// ============================================================================

export async function getEmailConfig(): Promise<EmailConfigRecord> {
  const pool = getPgPool();
  if (pool && (await ensurePgInitialized(pool))) {
    const res = await pool.query('SELECT * FROM email_config WHERE id = 1 LIMIT 1');
    if (res.rows[0]) {
      const row = res.rows[0];
      return {
        smtp_host: row.smtp_host || DEFAULT_EMAIL_CONFIG.smtp_host,
        smtp_port: Number(row.smtp_port || DEFAULT_EMAIL_CONFIG.smtp_port),
        smtp_user: row.smtp_user || DEFAULT_EMAIL_CONFIG.smtp_user,
        smtp_pass: row.smtp_pass || DEFAULT_EMAIL_CONFIG.smtp_pass,
        smtp_from: row.smtp_from || DEFAULT_EMAIL_CONFIG.smtp_from,
      };
    }
    return DEFAULT_EMAIL_CONFIG;
  }

  const store = ensureLocalStore();
  return {
    ...DEFAULT_EMAIL_CONFIG,
    ...(store.emailConfig || {}),
  };
}

export async function updateEmailConfig(
  input: Partial<EmailConfigRecord>
): Promise<EmailConfigRecord> {
  const current = await getEmailConfig();
  const nextPass =
    input.smtp_pass && !input.smtp_pass.includes('•')
      ? input.smtp_pass.replace(/\s+/g, '') // Strip spaces from 16-char Google App Passwords
      : current.smtp_pass;

  const merged: EmailConfigRecord = {
    smtp_host: (input.smtp_host ?? current.smtp_host).trim() || 'smtp.gmail.com',
    smtp_port: Number(input.smtp_port ?? current.smtp_port) || 465,
    smtp_user: (input.smtp_user ?? current.smtp_user).trim(),
    smtp_pass: nextPass,
    smtp_from:
      (input.smtp_from ?? current.smtp_from).trim() ||
      `LuminaMath Moldova <${(input.smtp_user ?? current.smtp_user).trim()}>`,
  };

  const pool = getPgPool();
  if (pool && (await ensurePgInitialized(pool))) {
    await pool.query(
      `INSERT INTO email_config (id, smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from, updated_at)
       VALUES (1, $1, $2, $3, $4, $5, now())
       ON CONFLICT (id) DO UPDATE SET
         smtp_host = EXCLUDED.smtp_host,
         smtp_port = EXCLUDED.smtp_port,
         smtp_user = EXCLUDED.smtp_user,
         smtp_pass = EXCLUDED.smtp_pass,
         smtp_from = EXCLUDED.smtp_from,
         updated_at = now()`,
      [
        merged.smtp_host,
        merged.smtp_port,
        merged.smtp_user,
        merged.smtp_pass,
        merged.smtp_from,
      ]
    );
    return merged;
  }

  const store = ensureLocalStore();
  store.emailConfig = merged;
  saveLocalStore(store);
  return merged;
}

export async function markStudentEmailStatus(
  studentCode: string,
  type: 'registration' | 'result',
  sent: boolean
): Promise<void> {
  const cleanCode = studentCode.trim();
  const pool = getPgPool();
  if (pool && (await ensurePgInitialized(pool))) {
    if (type === 'registration') {
      await pool.query(`UPDATE students SET email_sent = $1 WHERE student_code = $2`, [
        sent,
        cleanCode,
      ]);
    } else {
      await pool.query(
        `UPDATE students SET result_email_sent = $1, result_email_sent_at = CASE WHEN $1 THEN now() ELSE result_email_sent_at END WHERE student_code = $2`,
        [sent, cleanCode]
      );
    }
    return;
  }

  const store = ensureLocalStore();
  const student = store.students.find((s) => s.student_code === cleanCode);
  if (student) {
    if (type === 'registration') {
      student.email_sent = sent;
    } else {
      student.result_email_sent = sent;
      if (sent) student.result_email_sent_at = new Date().toISOString();
    }
    saveLocalStore(store);
  }
}

// ============================================================================
// Unified Repository Functions
// ============================================================================

export async function getBranches(includeInactive = false): Promise<BranchRecord[]> {
  const pool = getPgPool();
  if (pool && (await ensurePgInitialized(pool))) {
    const query = includeInactive
      ? 'SELECT * FROM branches ORDER BY code ASC'
      : 'SELECT * FROM branches WHERE is_active = true ORDER BY code ASC';
    const res = await pool.query(query);
    return res.rows;
  }

  const store = ensureLocalStore();
  return store.branches
    .filter((b) => (includeInactive ? true : b.is_active))
    .sort((a, b) => a.code - b.code);
}

export async function createOrUpdateBranch(input: {
  code: number;
  name_ro: string;
  name_ru: string;
  name_en: string;
  city: string;
  address: string;
  is_active?: boolean;
}): Promise<BranchRecord> {
  const pool = getPgPool();
  if (pool && (await ensurePgInitialized(pool))) {
    const res = await pool.query(
      `INSERT INTO branches (code, name_ro, name_ru, name_en, city, address, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (code) DO UPDATE SET
         name_ro = EXCLUDED.name_ro,
         name_ru = EXCLUDED.name_ru,
         name_en = EXCLUDED.name_en,
         city = EXCLUDED.city,
         address = EXCLUDED.address,
         is_active = EXCLUDED.is_active
       RETURNING *`,
      [
        input.code,
        input.name_ro,
        input.name_ru,
        input.name_en,
        input.city || 'Chișinău',
        input.address || '',
        input.is_active ?? true,
      ]
    );
    return res.rows[0];
  }

  const store = ensureLocalStore();
  const existingIdx = store.branches.findIndex((b) => b.code === input.code);
  if (existingIdx >= 0) {
    store.branches[existingIdx] = {
      ...store.branches[existingIdx],
      name_ro: input.name_ro,
      name_ru: input.name_ru,
      name_en: input.name_en,
      city: input.city || 'Chișinău',
      address: input.address || '',
      is_active: input.is_active ?? true,
    };
    saveLocalStore(store);
    return store.branches[existingIdx];
  }

  const newBranch: BranchRecord = {
    id: store.branches.length > 0 ? Math.max(...store.branches.map((b) => b.id)) + 1 : 1,
    code: input.code,
    name_ro: input.name_ro,
    name_ru: input.name_ru,
    name_en: input.name_en,
    city: input.city || 'Chișinău',
    address: input.address || '',
    is_active: input.is_active ?? true,
  };
  store.branches.push(newBranch);
  saveLocalStore(store);
  return newBranch;
}

export async function registerStudent(input: CreateStudentInput): Promise<StudentRecord> {
  const pool = getPgPool();
  if (pool && (await ensurePgInitialized(pool))) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const branchRes = await client.query('SELECT * FROM branches WHERE id = $1 LIMIT 1', [
        input.branchId,
      ]);
      if (branchRes.rowCount === 0) {
        throw new Error('Selected branch does not exist');
      }
      const branch: BranchRecord = branchRes.rows[0];

      const counterRes = await client.query(
        `INSERT INTO id_counters (branch_code, grade, last_seq)
         VALUES ($1, $2, 1)
         ON CONFLICT (branch_code, grade)
         DO UPDATE SET last_seq = id_counters.last_seq + 1
         RETURNING last_seq`,
        [branch.code, input.grade]
      );
      let seq: number = counterRes.rows[0].last_seq;
      let studentCode = formatStudentId(branch.code, input.grade, seq);

      while (true) {
        const exists = await client.query(
          'SELECT 1 FROM students WHERE student_code = $1',
          [studentCode]
        );
        if (exists.rowCount === 0) break;
        const nextRes = await client.query(
          `UPDATE id_counters SET last_seq = last_seq + 1
           WHERE branch_code = $1 AND grade = $2 RETURNING last_seq`,
          [branch.code, input.grade]
        );
        seq = nextRes.rows[0].last_seq;
        studentCode = formatStudentId(branch.code, input.grade, seq);
      }

      const id = crypto.randomUUID();
      const accessPin = String(crypto.randomInt(100000, 999999));
      const insertRes = await client.query(
        `INSERT INTO students (
          id, student_code, access_pin, first_name, last_name, grade, school,
          teacher_name, exam_language, branch_id, branch_code, email, phone, email_sent
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, false)
        RETURNING *`,
        [
          id,
          studentCode,
          accessPin,
          input.firstName.trim(),
          input.lastName.trim(),
          input.grade,
          input.school.trim(),
          input.teacherName.trim(),
          input.examLanguage,
          branch.id,
          branch.code,
          input.email.trim(),
          input.phone.trim(),
        ]
      );

      await client.query('COMMIT');

      return {
        ...insertRes.rows[0],
        branch_name_ro: branch.name_ro,
        branch_name_ru: branch.name_ru,
        branch_name_en: branch.name_en,
        branch_address: branch.address,
      };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  const store = ensureLocalStore();
  const branch = store.branches.find((b) => b.id === Number(input.branchId));
  if (!branch) {
    throw new Error('Selected branch does not exist');
  }

  const counterKey = `${branch.code}_${input.grade}`;
  let seq = (store.counters[counterKey] || 0) + 1;
  let studentCode = formatStudentId(branch.code, input.grade, seq);

  while (store.students.some((s) => s.student_code === studentCode)) {
    seq += 1;
    studentCode = formatStudentId(branch.code, input.grade, seq);
  }
  store.counters[counterKey] = seq;

  const now = new Date().toISOString();
  const accessPin = String(crypto.randomInt(100000, 999999));
  const newStudent: StudentRecord = {
    id: crypto.randomUUID(),
    student_code: studentCode,
    access_pin: accessPin,
    first_name: input.firstName.trim(),
    last_name: input.lastName.trim(),
    grade: Number(input.grade),
    school: input.school.trim(),
    teacher_name: input.teacherName.trim(),
    exam_language: input.examLanguage,
    branch_id: branch.id,
    branch_code: branch.code,
    branch_name_ro: branch.name_ro,
    branch_name_ru: branch.name_ru,
    branch_name_en: branch.name_en,
    branch_address: branch.address,
    email: input.email.trim(),
    phone: input.phone.trim(),
    email_sent: false,
    has_result_pdf: false,
    result_uploaded_at: null,
    result_email_sent: false,
    result_email_sent_at: null,
    created_at: now,
  };

  store.students.unshift(newStudent);
  saveLocalStore(store);
  return newStudent;
}

export async function getStudentByCode(studentCode: string): Promise<StudentRecord | null> {
  const cleanCode = studentCode.trim();
  const pool = getPgPool();
  if (pool && (await ensurePgInitialized(pool))) {
    const res = await pool.query(
      `SELECT s.*, b.name_ro AS branch_name_ro, b.name_ru AS branch_name_ru,
              b.name_en AS branch_name_en, b.address AS branch_address
       FROM students s
       LEFT JOIN branches b ON s.branch_id = b.id
       WHERE s.student_code = $1
       LIMIT 1`,
      [cleanCode]
    );
    return res.rows[0] || null;
  }

  const store = ensureLocalStore();
  const student = store.students.find((s) => s.student_code === cleanCode);
  if (!student) return null;
  const branch = store.branches.find((b) => b.id === student.branch_id);
  return {
    ...student,
    branch_name_ro: branch?.name_ro,
    branch_name_ru: branch?.name_ru,
    branch_name_en: branch?.name_en,
    branch_address: branch?.address,
  };
}

export async function getAllStudents(filters?: {
  branchCode?: number;
  grade?: number;
  language?: string;
  search?: string;
}): Promise<StudentRecord[]> {
  const pool = getPgPool();
  if (pool && (await ensurePgInitialized(pool))) {
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (filters?.branchCode) {
      values.push(filters.branchCode);
      conditions.push(`s.branch_code = $${values.length}`);
    }
    if (filters?.grade) {
      values.push(filters.grade);
      conditions.push(`s.grade = $${values.length}`);
    }
    if (filters?.language) {
      values.push(filters.language);
      conditions.push(`s.exam_language = $${values.length}`);
    }
    if (filters?.search) {
      values.push(`%${filters.search.trim()}%`);
      conditions.push(
        `(s.student_code ILIKE $${values.length} OR s.first_name ILIKE $${values.length} OR s.last_name ILIKE $${values.length} OR s.school ILIKE $${values.length})`
      );
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const res = await pool.query(
      `SELECT s.*, b.name_ro AS branch_name_ro, b.name_ru AS branch_name_ru,
              b.name_en AS branch_name_en, b.address AS branch_address
       FROM students s
       LEFT JOIN branches b ON s.branch_id = b.id
       ${whereClause}
       ORDER BY s.created_at DESC`,
      values
    );
    return res.rows;
  }

  const store = ensureLocalStore();
  return store.students
    .map((s) => {
      const branch = store.branches.find((b) => b.id === s.branch_id);
      return {
        ...s,
        branch_name_ro: branch?.name_ro,
        branch_name_ru: branch?.name_ru,
        branch_name_en: branch?.name_en,
        branch_address: branch?.address,
      };
    })
    .filter((s) => {
      if (filters?.branchCode && s.branch_code !== Number(filters.branchCode)) return false;
      if (filters?.grade && s.grade !== Number(filters.grade)) return false;
      if (filters?.language && s.exam_language !== filters.language) return false;
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        const match =
          s.student_code.toLowerCase().includes(q) ||
          s.first_name.toLowerCase().includes(q) ||
          s.last_name.toLowerCase().includes(q) ||
          s.school.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
}

export async function saveStudentResultPdf(
  studentCode: string,
  fileName: string,
  pdfBuffer: Buffer
): Promise<{ matched: boolean; studentCode: string }> {
  const cleanCode = studentCode.trim();
  const pool = getPgPool();

  if (pool && (await ensurePgInitialized(pool))) {
    const check = await pool.query('SELECT student_code FROM students WHERE student_code = $1', [
      cleanCode,
    ]);
    if (check.rowCount === 0) {
      return { matched: false, studentCode: cleanCode };
    }

    await pool.query(
      `INSERT INTO student_results (student_code, file_name, pdf_data, file_size, uploaded_at)
       VALUES ($1, $2, $3, $4, now())
       ON CONFLICT (student_code) DO UPDATE SET
         file_name = EXCLUDED.file_name,
         pdf_data = EXCLUDED.pdf_data,
         file_size = EXCLUDED.file_size,
         uploaded_at = now()`,
      [cleanCode, fileName, pdfBuffer, pdfBuffer.length]
    );

    await pool.query(
      `UPDATE students SET has_result_pdf = true, result_uploaded_at = now() WHERE student_code = $1`,
      [cleanCode]
    );

    return { matched: true, studentCode: cleanCode };
  }

  const store = ensureLocalStore();
  const idx = store.students.findIndex((s) => s.student_code === cleanCode);
  if (idx === -1) {
    return { matched: false, studentCode: cleanCode };
  }

  fs.writeFileSync(path.join(PDF_DIR, `${cleanCode}.pdf`), pdfBuffer);
  store.students[idx].has_result_pdf = true;
  store.students[idx].result_uploaded_at = new Date().toISOString();
  saveLocalStore(store);

  return { matched: true, studentCode: cleanCode };
}

export async function getStudentResultPdf(
  studentCode: string
): Promise<{ fileName: string; pdfBuffer: Buffer } | null> {
  const cleanCode = studentCode.trim();
  const pool = getPgPool();

  if (pool && (await ensurePgInitialized(pool))) {
    const res = await pool.query(
      'SELECT file_name, pdf_data FROM student_results WHERE student_code = $1 LIMIT 1',
      [cleanCode]
    );
    if (res.rowCount === 0) return null;
    return {
      fileName: res.rows[0].file_name,
      pdfBuffer: res.rows[0].pdf_data,
    };
  }

  ensureLocalStore();
  const pdfPath = path.join(PDF_DIR, `${cleanCode}.pdf`);
  if (!fs.existsSync(pdfPath)) return null;
  return {
    fileName: `${cleanCode}.pdf`,
    pdfBuffer: fs.readFileSync(pdfPath),
  };
}
