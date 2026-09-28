-- ============================================================================
-- Statistika '25 — Bulk Import Mahasiswa
-- ============================================================================
-- Run di Supabase SQL Editor untuk menambahkan daftar mahasiswa sekaligus.
-- Setelah import, mahasiswa bisa claim profil mereka via NIM di halaman
-- /#/claim-profile
--
-- Cara pakai:
--   1. Edit NIM + nama di bawah sesuai data asli mahasiswa Anda
--   2. Copy seluruh SQL ini
--   3. Paste di Supabase Dashboard → SQL Editor → New query
--   4. Run
--   5. Setelah import, share link website ke grup WhatsApp angkatan
--   6. Mahasiswa signup Google → masuk ke /#/claim-profile → enter NIM
-- ============================================================================

-- === HAPUS DATA LAMA DULU (opsional, hati-hati!) ===
-- Hanya run kalau ingin reset daftar mahasiswa dari awal.
-- JANGAN run kalau sudah ada mahasiswa yang sudah claim profil (data hilang).
-- TRUNCATE TABLE students CASCADE;

-- === IMPORT MAHASISWA BARU ===
-- Format: (nim, name, kelas, angkatan, semester, tagline, asal_daerah, instagram)
-- NIM format: 333625XXXX (10 digit, angka 4-5 = tahun masuk "25" = 2025)

INSERT INTO students (id, nim, name, kelas, angkatan, semester, tagline, asal_daerah, instagram, "owner_id", email, "claimed_at", "created_at", "updated_at")
VALUES

-- === KELAS A ===
(gen_random_uuid()::text, '3336250001', 'Ahmad Fauzi', 'A', '2025', 1, 'Data is the new oil', 'Cilegon', '@ahmadfauzi', NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250002', 'Budi Santoso', 'A', '2025', 1, 'Kerja keras beat bakat', 'Pandeglang', NULL, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250003', 'Citra Lestari', 'A', '2025', 1, 'Statistika untuk sosial', 'Serang', '@citralestari', NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250004', 'Diana Putri', 'A', '2025', 1, 'Business analyst in training', 'Tangerang', NULL, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250005', 'Eko Prasetyo', 'A', '2025', 1, 'R is my weapon', 'Cilegon', NULL, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250006', 'Fitri Handayani', 'A', '2025', 1, 'Biostatistika enthusiast', 'Serang', NULL, NULL, NULL, NULL, NOW(), NOW()),

-- === KELAS B ===
(gen_random_uuid()::text, '3336250007', 'Galih Nugroho', 'B', '2025', 1, 'Python > R (fight me)', 'Pandeglang', NULL, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250008', 'Hana Maharani', 'B', '2025', 1, 'Data visualization lover', 'Cilegon', '@hanamhr', NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250009', 'Irfan Hakim', 'B', '2025', 1, 'Machine learning journey', 'Tangerang', NULL, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250010', 'Joko Susilo', 'B', '2025', 1, 'Bayesian by heart', 'Serang', NULL, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250011', 'Kartika Dewi', 'B', '2025', 1, 'Women in STEM', 'Cilegon', NULL, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250012', 'Lukman Hakim', 'B', '2025', 1, 'Statistika nonparametrik', 'Pandeglang', NULL, NULL, NULL, NULL, NOW(), NOW())

-- === TAMBAHKAN MAHASISWA LAIN DI SINI ===
-- Copy baris di atas, ganti NIM + nama + kelas + tagline + asal_daerah
-- Contoh:
-- (gen_random_uuid()::text, '3336250013', 'Nama Mahasiswa', 'A', '2025', 1, 'Tagline', 'Daerah', NULL, NULL, NULL, NULL, NOW(), NOW()),

ON CONFLICT (nim) DO NOTHING;

-- === VERIFIKASI ===
-- Cek berapa mahasiswa yang sudah di-import:
SELECT kelas, COUNT(*) as jumlah FROM students GROUP BY kelas ORDER BY kelas;

-- Cek siapa yang sudah claim profil (owner_id tidak NULL):
-- SELECT nim, name, kelas, email, "claimed_at" FROM students WHERE "owner_id" IS NOT NULL ORDER BY "claimed_at" DESC;

-- Cek siapa yang BELUM claim (untuk admin monitoring):
-- SELECT nim, name, kelas FROM students WHERE "owner_id" IS NULL ORDER BY nim;
