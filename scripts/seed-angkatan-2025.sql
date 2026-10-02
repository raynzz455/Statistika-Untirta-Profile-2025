-- ============================================================================
-- Statistika '25 — Seed Lengkap Angkatan 2025 + Class History
-- ============================================================================
-- Script ini:
-- 1. Import daftar mahasiswa (nim + name + kelas + semester)
-- 2. Inisialisasi class history (semester 1, kelas A/B)
--
-- Class history disimpan di tabel terpisah (student_class_history)
-- supaya rotasi kelas (semester 3 & 5) TIDAK menghapus history sebelumnya.
--
-- CARA PAKAI:
-- 1. Edit nama mahasiswa di bawah dengan data asli
-- 2. Copy seluruh SQL → paste di Supabase SQL Editor → Run
-- 3. Idempotent: ON CONFLICT DO NOTHING — aman dijalankan ulang
-- ============================================================================

-- === OPSIONAL: Reset data mahasiswa lama ===
-- Hanya uncomment kalau ingin bersih dari awal:
-- DELETE FROM student_class_history WHERE student_id IN (SELECT id FROM students WHERE nim LIKE '333625%');
-- DELETE FROM students WHERE nim LIKE '333625%';

-- ============================================================================
-- PART 1: IMPORT MAHASISWA (nim + name + kelas)
-- ============================================================================
-- Setiap mahasiswa hanya ADA SATU record di tabel students.
-- Field kelas + semester menunjukkan kelas SAAT INI (current).
-- History disimpan di tabel student_class_history (Part 2).

INSERT INTO students (id, nim, name, kelas, angkatan, semester, "owner_id", email, "claimed_at", "created_at", "updated_at")
VALUES

-- === KELAS A (semester 1) ===
(gen_random_uuid()::text, '3336250001', 'Ahmad Fauzi', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250002', 'Budi Santoso', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250003', 'Citra Lestari', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250004', 'Diana Putri', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250005', 'Eko Prasetyo', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250006', 'Fitri Handayani', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250007', 'Galih Nugroho', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250008', 'Hana Maharani', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250009', 'Irfan Hakim', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250010', 'Joko Susilo', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250011', 'Kartika Dewi', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250012', 'Lukman Hakim', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250013', 'Maya Sari', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250014', 'Nanda Pratama', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250015', 'Oktavian Rizki', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250016', 'Putri Anggraini', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250017', 'Qori Amalia', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250018', 'Rizky Ramadhan', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250019', 'Siti Aminah', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250020', 'Taufik Hidayat', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),

-- === KELAS B (semester 1) ===
(gen_random_uuid()::text, '3336250021', 'Umar Bakri', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250022', 'Vina Melati', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250023', 'Wawan Setiawan', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250024', 'Xena Paramita', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250025', 'Yusuf Maulana', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250026', 'Zahra Aulia', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250027', 'Ade Kurniawan', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250028', 'Bayu Saputra', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250029', 'Candra Wijaya', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250030', 'Dewi Lestari', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250031', 'Eka Putri', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250032', 'Fajar Nugroho', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250033', 'Gita Anggraini', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250034', 'Hadi Kusuma', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250035', 'Intan Permata', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250036', 'Jihan Aulia', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250037', 'Krisna Adi', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250038', 'Laras Wulandari', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250039', 'Mahesa Pratama', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250040', 'Nadia Safitri', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW())

-- === TAMBAH MAHASISWA LAIN DI SINI ===
-- Copy baris, ganti NIM + nama:
-- (gen_random_uuid()::text, '3336250041', 'Nama Mahasiswa', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),

ON CONFLICT (nim) DO NOTHING;

-- ============================================================================
-- PART 2: INISIALISASI CLASS HISTORY (semester 1)
-- ============================================================================
-- Buat record history untuk semester 1 (kelas saat ini).
-- Saat rotasi kelas terjadi (semester 3 & 5), tambahkan record BARU
-- (jangan update yang lama!) supaya history terjaga.

INSERT INTO student_class_history (id, student_id, semester, kelas, angkatan, academic_year, is_current, created_at)
SELECT
  gen_random_uuid()::text,
  s.id,
  s.semester,           -- semester 1
  s.kelas,              -- kelas A atau B
  s.angkatan,           -- 2025
  '2025/2026',          -- academic year
  true,                 -- is_current = true (semester saat ini)
  NOW()
FROM students s
WHERE s.nim LIKE '333625%'
  AND NOT EXISTS (
    SELECT 1 FROM student_class_history sch
    WHERE sch.student_id = s.id AND sch.semester = s.semester
  );

-- ============================================================================
-- VERIFY
-- ============================================================================

-- Total mahasiswa:
SELECT COUNT(*) as total_mahasiswa FROM students;

-- Mahasiswa per kelas:
SELECT kelas, COUNT(*) as jumlah FROM students GROUP BY kelas ORDER BY kelas;

-- Class history records:
SELECT semester, kelas, COUNT(*) as jumlah
FROM student_class_history
GROUP BY semester, kelas
ORDER BY semester, kelas;

-- Yang sudah claim profil:
-- SELECT COUNT(*) as sudah_claim FROM students WHERE owner_id IS NOT NULL;

-- Yang belum claim:
-- SELECT COUNT(*) as belum_claim FROM students WHERE owner_id IS NULL;

-- Lihat history lengkap satu mahasiswa:
-- SELECT sch.semester, sch.kelas, sch.academic_year, sch.is_current
-- FROM student_class_history sch
-- JOIN students s ON s.id = sch.student_id
-- WHERE s.nim = '3336250001'
-- ORDER BY sch.semester;
