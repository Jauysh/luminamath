-- ============================================================================
-- LuminaMath Moldova (luminamath.md) PostgreSQL Schema
-- Optimized for 700+ concurrent users on Google Cloud Run
-- ============================================================================

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

CREATE TABLE IF NOT EXISTS id_counters (
  branch_code INT NOT NULL,
  grade INT NOT NULL,
  last_seq INT NOT NULL DEFAULT 0,
  PRIMARY KEY (branch_code, grade)
);

CREATE TABLE IF NOT EXISTS students (
  id VARCHAR(36) PRIMARY KEY,
  student_code VARCHAR(6) UNIQUE NOT NULL,
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_students_student_code ON students(student_code);
CREATE INDEX IF NOT EXISTS idx_students_branch_grade ON students(branch_code, grade);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);

CREATE TABLE IF NOT EXISTS student_results (
  student_code VARCHAR(6) PRIMARY KEY REFERENCES students(student_code) ON DELETE CASCADE,
  file_name VARCHAR(150) NOT NULL,
  pdf_data BYTEA NOT NULL,
  file_size INT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default branches: Chișinău - Lumina (code 1) and Chișinău - Durlești (code 2)
INSERT INTO branches (code, name_ro, name_ru, name_en, city, address, is_active)
VALUES
  (1, 'Chișinău — Filiala Lumina', 'Кишинёв — Филиал Lumina (Люмина)', 'Chișinău — Lumina Branch', 'Chișinău', 'mun. Chișinău, Filiala Lumina', true),
  (2, 'Chișinău — Filiala Durlești', 'Кишинёв — Филиал Durlești (Дурлешть)', 'Chișinău — Durlești Branch', 'Chișinău', 'mun. Chișinău, or. Durlești', true)
ON CONFLICT (code) DO NOTHING;
