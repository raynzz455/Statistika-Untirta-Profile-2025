-- ============================================================================
-- Statistika '25 — Seed Lengkap Angkatan 2025 (Nama + NIM saja)
-- ============================================================================
-- Script ini untuk import daftar LENGKAP mahasiswa angkatan 2025.
-- Hanya mengisi: nim + name + kelas + angkatan + semester
-- Field lain (tagline, bio, foto, lagu, portfolio) biarkan NULL —
-- mahasiswa akan isi sendiri setelah claim profil via NIM.
--
-- CARA PAKAI:
-- 1. Edit nama mahasiswa di bawah dengan data asli angkatan Anda
-- 2. Copy seluruh SQL ini
-- 3. Paste di Supabase Dashboard → SQL Editor → New query
-- 4. Run
-- 5. Share link website ke grup WhatsApp angkatan
-- 6. Mahasiswa signup Google → claim profil via NIM → edit sendiri
--
-- FORMAT NIM: 333625XXXX (10 digit)
-- - Digit 1-3: 333 (kode prodi Statistika Untirta)
-- - Digit 4-5: 25 (tahun masuk 2025)
-- - Digit 6-10: nomor urut mahasiswa
-- ============================================================================

-- === OPSIONAL: Hapus data mahasiswa lama dulu (HATI-HATI!) ===
-- Kalau Anda ingin reset total daftar mahasiswa, uncomment baris ini:
-- DELETE FROM students WHERE nim LIKE '333625%';
-- PERINGATAN: ini akan menghapus SEMUA mahasiswa angkatan 2025, termasuk
-- yang sudah claim profil. Data foto, bio, portfolio yang sudah diisi
-- mahasiswa akan HILANG. Hanya run kalau Anda yakin!

-- === IMPORT MAHASISWA ANGKATAN 2025 ===
-- Edit nama di bawah dengan data asli mahasiswa Anda
-- Kelas A = 3336250001 - 3336250060 (atau sesuai pembagian)
-- Kelas B = 3336250061 - 3336250120 (atau sesuai pembagian)

INSERT INTO students (id, nim, name, kelas, angkatan, semester, "owner_id", email, "claimed_at", "created_at", "updated_at")
VALUES

-- === KELAS A ===
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
(gen_random_uuid()::text, '3336250021', 'Umar Bakri', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250022', 'Vina Melati', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250023', 'Wawan Setiawan', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250024', 'Xena Paramita', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250025', 'Yusuf Maulana', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250026', 'Zahra Aulia', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250027', 'Ade Kurniawan', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250028', 'Bayu Saputra', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250029', 'Candra Wijaya', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250030', 'Dewi Lestari', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250031', 'Eka Putri', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250032', 'Fajar Nugroho', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250033', 'Gita Anggraini', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250034', 'Hadi Kusuma', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250035', 'Intan Permata', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250036', 'Jihan Aulia', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250037', 'Krisna Adi', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250038', 'Laras Wulandari', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250039', 'Mahesa Pratama', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250040', 'Nadia Safitri', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250041', 'Oki Setiawan', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250042', 'Priya Maharani', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250043', 'Rendi Kurnia', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250044', 'Sari Wendari', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250045', 'Tegar Prasetya', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250046', 'Ulfa Rahmawati', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250047', 'Vito Anggara', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250048', 'Winda Permatasari', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250049', 'Yudi Hartono', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250050', 'Zaki Mubarok', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250051', 'Andi Firmansyah', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250052', 'Betari Cahya', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250053', 'Dimas Aditya', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250054', 'Elsa Putri', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250055', 'Fauzan Akbar', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250056', 'Guntur Pratama', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250057', 'Hilda Marcela', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250058', 'Iqbal Maulana', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250059', 'Jelita Sari', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250060', 'Khalif Mauludi', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),

-- === KELAS B ===
(gen_random_uuid()::text, '3336250061', 'Larasati Dewi', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250062', 'Muhammad Aldi', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250063', 'Nabila Az-Zahra', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250064', 'Oscar Mahendra', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250065', 'Pratiwi Ningrum', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250066', 'Qadri Hasballah', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250067', 'Rahmat Hidayat', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250068', 'Salsabila Putri', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250069', 'Tirta Amerta', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250070', 'Ulul Albab', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250071', 'Vera Anggita', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250072', 'Wahyu Pradana', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250073', 'Yasmin Zahratul', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250074', 'Zainal Abidin', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250075', 'Aria Wibowo', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250076', 'Bunga Citra', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250077', 'Cakra Negara', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250078', 'Dara Anjani', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250079', 'Elang Pratama', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250080', 'Fardila Najwa', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250081', 'Gani Irwansyah', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250082', 'Hesti Wulandari', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250083', 'Iqbal Pratama', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250084', 'Junita Br. Sembiring', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250085', 'Kurnia Ekawati', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250086', 'Lukman Akbar', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250087', 'Mega Lestari', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250088', 'Nizar Yazid', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250089', 'Olivia Sukma', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250090', 'Pandu Raga', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250091', 'Qori Amalina', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250092', 'Raka Pradipta', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250093', 'Sasti Widyastuti', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250094', 'Toni Saputra', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250095', 'Umar Faruq', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250096', 'Vivi Oktaviani', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250097', 'Wahidin Putra', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250098', 'Yulianingsih', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250099', 'Zulfikar Akbar', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250100', 'Ahmad Zaki', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250101', 'Bima Sakti', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250102', 'Cici Purnama', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250103', 'Dicky Asmara', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250104', 'Elvira Safa', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250105', 'Fadli Rahman', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250106', 'Gilang Pratama', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250107', 'Hafizh Anwar', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250108', 'Ika Pratiwi', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250109', 'Joko Prabowo', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250110', 'Kartika Sari', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250111', 'Lingga Bagus', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250112', 'Mira Anggraini', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250113', 'Naufal Hakim', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250114', 'Olivia Sari', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250115', 'Pandu Wijaya', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250116', 'Rangga Adi', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250117', 'Satria Buana', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250118', 'Tiara Maharani', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250119', 'Unggul Pratama', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),
(gen_random_uuid()::text, '3336250120', 'Vicky Apriana', 'B', '2025', 1, NULL, NULL, NULL, NOW(), NOW())

-- === TAMBAH/EDIT MAHASISWA LAIN DI SINI ===
-- Copy baris di atas, ganti NIM + nama:
-- (gen_random_uuid()::text, '3336250121', 'Nama Mahasiswa Baru', 'A', '2025', 1, NULL, NULL, NULL, NOW(), NOW()),

ON CONFLICT (nim) DO NOTHING;

-- === VERIFIKASI ===
-- Total mahasiswa per kelas:
SELECT kelas, COUNT(*) as jumlah FROM students GROUP BY kelas ORDER BY kelas;

-- Total semua:
SELECT COUNT(*) as total_mahasiswa FROM students;

-- Yang sudah claim profil:
-- SELECT COUNT(*) as sudah_claim FROM students WHERE "owner_id" IS NOT NULL;

-- Yang belum claim:
-- SELECT COUNT(*) as belum_claim FROM students WHERE "owner_id" IS NULL;
