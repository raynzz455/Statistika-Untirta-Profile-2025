-- ============================================================================
-- Statistika '25 — Script Rotasi Kelas (Semester 3 → Semester 5)
-- ============================================================================
-- Jalankan script ini saat rotasi kelas terjadi (semester 3 ke semester 5).
-- 
-- APA YANG DILAKUKAN SCRIPT INI:
-- 1. Update students table: swap kelas (A→B, B→A) + semester=5
-- 2. Tambah record baru di student_class_history untuk semester 5
-- 3. Tandai record semester 3 sebagai is_current=false
-- 4. Tandai record semester 5 sebagai is_current=true
--
-- CARA PAKAI:
-- 1. Sebelum run, pastikan semua mahasiswa sudah ada di students table
-- 2. Run di Supabase SQL Editor
-- 3. Idempotent: aman dijalankan ulang
-- ============================================================================

-- === STEP 1: Update is_current=false untuk SEMUA record semester sebelumnya ===
UPDATE student_class_history
SET is_current = false
WHERE is_current = true AND semester < 5;

-- === STEP 2: Update students table (swap kelas + semester=5) ===
-- Mahasiswa yang saat ini di Kelas A → pindah ke Kelas B
UPDATE students
SET kelas = 'B', semester = 5, updated_at = NOW()
WHERE kelas = 'A' AND angkatan = '2025' AND semester = 3;

-- Mahasiswa yang saat ini di Kelas B → pindah ke Kelas A
UPDATE students
SET kelas = 'A', semester = 5, updated_at = NOW()
WHERE kelas = 'B' AND angkatan = '2025' AND semester = 3;

-- === STEP 3: Tambah record class history untuk semester 5 ===
INSERT INTO student_class_history (id, student_id, semester, kelas, angkatan, academic_year, is_current, created_at)
SELECT
  gen_random_uuid()::text,
  s.id,
  5,                  -- semester 5
  s.kelas,            -- kelas BARU setelah swap di step 2
  s.angkatan,         -- 2025
  '2027/2028',        -- tahun akademik semester 5
  true,               -- is_current = true (semester saat ini)
  NOW()
FROM students s
WHERE s.angkatan = '2025' AND s.semester = 5
  AND NOT EXISTS (
    SELECT 1 FROM student_class_history sch
    WHERE sch.student_id = s.id AND sch.semester = 5
  );

-- === STEP 4: Tambah record semester 4 (jika belum ada) ===
-- Semester 4: kelas SAMA dengan semester 3 (tidak rotasi di sem 4)
INSERT INTO student_class_history (id, student_id, semester, kelas, angkatan, academic_year, is_current, created_at)
SELECT
  gen_random_uuid()::text,
  s.id,
  4,
  sch3.kelas,           -- ambil kelas dari semester 3
  s.angkatan,
  '2026/2027',          -- same academic year as sem 3
  false,
  NOW()
FROM students s
JOIN student_class_history sch3 ON sch3.student_id = s.id AND sch3.semester = 3
WHERE s.angkatan = '2025' AND s.semester >= 4
  AND NOT EXISTS (
    SELECT 1 FROM student_class_history sch4
    WHERE sch4.student_id = s.id AND sch4.semester = 4
  );

-- === VERIFY ===

-- Cek kelas saat ini (semua harus semester 5, kelas swapped):
SELECT semester, kelas, COUNT(*) as jumlah
FROM students
WHERE angkatan = '2025'
GROUP BY semester, kelas
ORDER BY semester, kelas;

-- Cek class history (harus ada record semester 4 dan 5):
SELECT semester, kelas, academic_year, is_current, COUNT(*) as jumlah
FROM student_class_history
WHERE angkatan = '2025'
GROUP BY semester, kelas, academic_year, is_current
ORDER BY semester, kelas;

-- Cek satu mahasiswa (contoh: Sydney, NIM 3338250001):
-- SELECT sch.semester, sch.kelas, sch.academic_year, sch.is_current
-- FROM student_class_history sch
-- JOIN students s ON s.id = sch.student_id
-- WHERE s.nim = '3338250001'
-- ORDER BY sch.semester;
-- Expected: 1A → 2A → 3B → 4B → 5A (rotasi balik!)

-- ============================================================================
-- CATATAN:
-- Script ini mengasumsikan SEMUA mahasiswa angkatan 2025 sudah di semester 3.
-- Jika ada mahasiswa yang tidak aktif (masih di semester 1), mereka TIDAK
-- akan ter-swap karena WHERE clause memfilter semester = 3.
-- Mahasiswa tidak aktif tetap di kelas dan semester mereka saat ini.
-- ============================================================================
