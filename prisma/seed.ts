// Seed script for Statistika '25 website
// Run with: bun run db:seed
import { PrismaClient } from '@prisma/client'
import { createHash } from 'crypto'

const db = new PrismaClient()

// Simple SHA-256 password hashing (sufficient for demo). In production use bcrypt/argon2.
function hashPassword(pw: string): string {
  return createHash('sha256').update(pw).digest('hex')
}

async function main() {
  // --- Users (test credentials) ---
  const admin = await db.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: hashPassword('admin'),
      role: 'admin',
      displayName: 'Administrator Angkatan',
    },
  })

  const user = await db.user.upsert({
    where: { username: 'user' },
    update: {},
    create: {
      username: 'user',
      passwordHash: hashPassword('user'),
      role: 'user',
      displayName: 'Mahasiswa Biasa',
    },
  })

  // Additional member test accounts
  const member1 = await db.user.upsert({
    where: { username: 'fauzi' },
    update: {},
    create: {
      username: 'fauzi',
      passwordHash: hashPassword('fauzi'),
      role: 'user',
      displayName: 'Ahmad Fauzi',
    },
  })

  // --- Students (Directory entries) ---
  // imageUrl is intentionally left null — the frontend renders a prominent
  // "Foto Tidak Tersedia" placeholder card automatically.
  const studentsData = [
    { name: 'Ahmad Fauzi', nim: '3336250001', kelas: 'A', tagline: 'Data is the new oil, and I am the refinery.', bio: 'Lahir dan besar di Serang. Memiliki ketertarikan tinggi pada analisis data dan machine learning sejak masa SMA.', instagram: '@ahmadfauzi.stts', asalDaerah: 'Serang, Banten', ownerId: member1.id },
    { name: 'Budi Santoso', nim: '3336250002', kelas: 'B', tagline: 'Numbers never lie, but statisticians do.', bio: 'Asal Pandeglang. Tertarik pada pemodelan probabilitas dan komputasi statistika.', instagram: '@budi_santoso', asalDaerah: 'Pandeglang, Banten' },
    { name: 'Citra Lestari', nim: '3336250003', kelas: 'A', tagline: 'Visualizing the unseen.', bio: 'Penyuka visualisasi data dan desain informasi. Aktif di komunitas data visualization.', instagram: '@citra.lst', asalDaerah: 'Cilegon, Banten' },
    { name: 'Diana Putri', nim: '3336250004', kelas: 'B', tagline: 'Probability of success is 1.', bio: 'Berpikir probabilistik dalam segala hal. Menyukai Bayesian statistics.', instagram: '@dianaputri', asalDaerah: 'Rangkasbitung, Banten' },
    { name: 'Eko Prasetyo', nim: '3336250005', kelas: 'A', tagline: 'Variance is life.', bio: 'Mengukur ketidakpastian dan menemukan pola. Penggemar analisis variansi.', instagram: '@ekopras', asalDaerah: 'Serang, Banten' },
    { name: 'Fajar Nugroho', nim: '3336250006', kelas: 'B', tagline: 'Mean, median, mode - three musketeers.', bio: 'Mengolah data mentah menjadi cerita. Suka menulis dan mengajar statistika.', instagram: '@fajar_n', asalDaerah: 'Tangerang, Banten' },
    { name: 'Gita Maharani', nim: '3336250007', kelas: 'A', tagline: 'Sample the world, infer the truth.', bio: 'Inferensia statistika adalah senjata utama. Aktif dalam riset sampling.', instagram: '@gitamhrn', asalDaerah: 'Cilegon, Banten' },
    { name: 'Hadi Wijaya', nim: '3336250008', kelas: 'B', tagline: 'Regression to the mean, regression to the dream.', bio: 'Regression analysis enthusiast. Suka eksperimen dengan model linier dan non-linier.', instagram: '@hadiw', asalDaerah: 'Serang, Banten' },
    { name: 'Indah Permata', nim: '3336250009', kelas: 'A', tagline: 'Hypothesis: the world is testable.', bio: 'Pengujian hipotesis adalah rutinitas harian. Suka uji-t, ANOVA, dan chi-square.', instagram: '@indahpermata', asalDaerah: 'Pandeglang, Banten' },
    { name: 'Joko Susilo', nim: '3336250010', kelas: 'B', tagline: 'Correlation, not always causation.', bio: 'Menganalisis korelasi dengan hati-hati. Penyusun laporan analisis korelasi.', instagram: '@jokosusilo', asalDaerah: 'Rangkasbitung, Banten' },
    { name: 'Kartika Sari', nim: '3336250011', kelas: 'A', tagline: 'Time series, timeless insights.', bio: 'Pecinta analisis runtun waktu. Forecasting adalah keahlian utama.', instagram: '@kartikasari', asalDaerah: 'Cilegon, Banten' },
    { name: 'Lukman Hakim', nim: '3336250012', kelas: 'B', tagline: 'Bayesian by nature.', bio: 'Pendekatan Bayesian dalam setiap keputusan. Suka MCMC dan Stan.', instagram: '@lukmanh', asalDaerah: 'Serang, Banten' },
  ]

  for (const s of studentsData) {
    const existing = await db.student.findUnique({ where: { nim: s.nim } })
    if (!existing) {
      await db.student.create({
        data: {
          ...s,
          imageUrl: null,
        },
      })
    }
  }


  // --- Articles ---
  const articlesData = [
    {
      title: 'Malam Keakraban Makrab 2025',
      excerpt: 'Momen hangat kebersamaan seluruh angkatan dalam acara malam keakraban di Villa Cikoneng. Menyatukan visi dan misi sebagai keluarga baru di Statistika Untirta.',
      content: 'Malam Keakraban (Makrab) Angkatan 2025 digelar pada akhir September di Villa Cikoneng, Cilegon. Acara yang berlangsung dari sore hingga dini hari ini dihadiri oleh seluruh mahasiswa angkatan 2025 Program Studi Statistika Untirta.\n\nBeragam kegiatan diisi mulai dari games outbound, diskusi kelompok, hingga api unggun di malam hari. Makrab menjadi momen penting untuk memperkuat ikatan antar mahasiswa baru sebelum memasuki perkuliahan formal.\n\n"Kami berharap kebersamaan ini terus terjaga selama empat tahun ke depan," ujar ketua panitia dalam sambutan penutup.',
      category: 'Berita',
      date: '20 Okt 2025',
      author: 'Tim Editorial',
      imageUrl: null,
      authorId: admin.id,
    },
    {
      title: 'Persiapan Ujian Tengah Semester',
      excerpt: 'Tips dan trik menghadapi UTS perdana bagi mahasiswa baru Statistika. Pelajari pola soal dan strategi pengerjaan.',
      content: 'Ujian Tengah Semester (UTS) pertama bagi angkatan 2025 akan dilaksanakan mulai 28 Oktober. Berikut persiapan yang dapat dilakukan:\n\n1. Pelajari rangkuman materi minggu 1-7\n2. Latih soal-soal tahun sebelumnya\n3. Buat kelompok belajar untuk diskusi\n4. Jaga pola tidur dan konsumsi gizi seimbang\n\nSemoga sukses! Tetap semangat dan jangan lupa berdoa.',
      category: 'Pengumuman',
      date: '15 Okt 2025',
      author: 'Divisi Akademik',
      imageUrl: null,
      authorId: admin.id,
    },
    {
      title: 'Kuliah Tamu Data Science Perdana',
      excerpt: 'Mengundang praktisi dari industri untuk memberikan wawasan tentang penerapan statistika di dunia nyata.',
      content: 'Program Studi Statistika Untirta mengadakan Kuliah Tamu perdana dengan tema "Data Science in Industry" pada 12 Oktober 2025.\n\nPemateri adalah praktisi data senior dari perusahaan teknologi terkemuka yang membahas penerapan statistika dalam pengambilan keputusan bisnis, A/B testing, dan machine learning production.\n\nAcara terbuka untuk seluruh mahasiswa dan disarankan membawa laptop untuk sesi hands-on.',
      category: 'Event',
      date: '10 Okt 2025',
      author: 'Humas Angkatan',
      imageUrl: null,
      authorId: admin.id,
    },
    {
      title: 'Kemenangan di Olimpiade Statistika Nasional',
      excerpt: 'Mahasiswa Berprestasi: Kemenangan di Olimpiade Statistika Nasional. Perjalanan penuh dedikasi dan kerja keras.',
      content: 'Mengenal lebih dekat sosok inspiratif dari angkatan kita yang baru saja memenangkan olimpiade statistika tingkat nasional. Perjalanan yang penuh dengan dedikasi, kerja keras, dan jam terbang latihan analisis data yang tidak main-main.\n\n"Persiapan dimulai sejak enam bulan lalu. Setiap malam saya mengerjakan minimal 10 soal latihan," ungkap sang juara.\n\nPrestasi ini diharapkan memotivasi seluruh mahasiswa Statistika untuk terus berkarya di tingkat nasional.',
      category: 'Berita',
      date: '15 Sep 2025',
      author: 'Tim Editorial',
      imageUrl: null,
      authorId: admin.id,
    },
  ]

  for (const a of articlesData) {
    const existing = await db.article.findFirst({ where: { title: a.title } })
    if (!existing) {
      await db.article.create({ data: a })
    }
  }

  // --- Events ---
  const eventsData = [
    {
      title: 'Malam Keakraban (Makrab) 2025',
      description: 'Acara malam keakraban seluruh angkatan 2025 di Villa Cikoneng. Wajib hadir untuk semua mahasiswa.',
      location: 'Villa Cikoneng, Cilegon',
      startDate: '27 Sep 2025, 16:00',
      endDate: '28 Sep 2025, 08:00',
      category: 'Sosial',
      imageUrl: null,
      organizerId: admin.id,
    },
    {
      title: 'Kuliah Tamu: Data Science in Industry',
      description: 'Kuliah tamu perdana dengan praktisi data senior. Tema: penerapan statistika di dunia industri.',
      location: 'Auditorium Gedung C, Kampus Cilegon',
      startDate: '12 Okt 2025, 13:00',
      endDate: '12 Okt 2025, 16:00',
      category: 'Akademik',
      imageUrl: null,
      organizerId: admin.id,
    },
    {
      title: 'UTS Semester Ganjil 2025/2026',
      description: 'Ujian Tengah Semester untuk seluruh mata kuliah. Jadwal lengkap dapat diunduh.',
      location: 'Ruang Kelas A & B',
      startDate: '28 Okt 2025, 08:00',
      endDate: '08 Nov 2025, 16:00',
      category: 'Akademik',
      imageUrl: null,
      organizerId: admin.id,
    },
    {
      title: 'Workshop R untuk Analisis Data',
      description: 'Workshop dasar penggunaan R untuk analisis data statistik. Diperuntukkan mahasiswa baru.',
      location: 'Lab Komputasi Statistika',
      startDate: '05 Nov 2025, 14:00',
      endDate: '05 Nov 2025, 17:00',
      category: 'Akademik',
      imageUrl: null,
      organizerId: member1.id,
    },
  ]

  for (const e of eventsData) {
    const existing = await db.event.findFirst({ where: { title: e.title } })
    if (!existing) {
      await db.event.create({ data: e })
    }
  }

  // --- Gallery ---
  // imageUrl is intentionally left empty — the frontend renders our prominent
  // "Foto Tidak Tersedia" placeholder card automatically. To replace with real
  // images, run the image-search or image-generation skill, then update via
  // the gallery form or directly in the DB.
  const galleryData = [
    { caption: 'Ospek Jurusan 2025', category: 'Ospek', imageUrl: '' },
    { caption: 'Diskusi Kelompok', category: 'Kuliah', imageUrl: '' },
    { caption: 'Tugas Kalkulus', category: 'Kuliah', imageUrl: '' },
    { caption: 'Kebersamaan Makrab', category: 'Makrab 2025', imageUrl: '' },
    { caption: 'Praktikum Lab', category: 'Kampus', imageUrl: '' },
    { caption: 'Rapat Angkatan', category: 'Random', imageUrl: '' },
  ]

  for (const g of galleryData) {
    const existing = await db.gallery.findFirst({ where: { caption: g.caption } })
    if (!existing) {
      await db.gallery.create({ data: { ...g, uploaderId: admin.id } })
    }
  }

  // --- Dosen (3 sample dosen, including Kaprodi) ---
  const dosenData = [
    {
      name: 'Dr. Budi Santoso, M.Si.',
      title: 'Dr., M.Si.',
      role: 'Kaprodi',
      expertise: 'Statistika Matematika, Distribusi Probabilitas',
      bio: 'Ketua Program Studi Statistika Untirta sejak 2023. Dosen pengajar mata kuliah Statistika Matematika, Teori Peluang, dan Distribusi Probabilitas. Berkomitmen untuk mengembangkan riset statistika terapan di lingkungan kampus Cilegon.',
      email: 'budi.santoso@untirta.ac.id',
      imageUrl: '',
      courses: 'Statistika Matematika, Teori Peluang, Distribusi Probabilitas',
      order: 1,
    },
    {
      name: 'Dr. Siti Rahayu, M.Si.',
      title: 'Dr., M.Si.',
      role: 'Dosen',
      expertise: 'Biostatistika, Analisis Data Kesehatan',
      bio: 'Dosen senior bidang Biostatistika. Berpengalaman lebih dari 15 tahun dalam riset kesehatan masyarakat. Pembimbing tugas akhir mahasiswa yang tertarik di bidang epidemiologi dan analisis data kesehatan.',
      email: 'siti.rahayu@untirta.ac.id',
      imageUrl: '',
      courses: 'Biostatistik, Analisis Regresi, Riset Operasi',
      order: 2,
    },
    {
      name: 'Prof. Ahmad Hidayat, Ph.D.',
      title: 'Prof., Ph.D.',
      role: 'Dosen',
      expertise: 'Komputasi Statistik, Machine Learning, Data Science',
      bio: 'Professor Komputasi Statistik dengan publikasi di jurnal internasional. Fokus riset: machine learning terapan untuk prediksi time series, Bayesian inference, dan komputasi statistik dengan R/Python.',
      email: 'ahmad.hidayat@untirta.ac.id',
      imageUrl: '',
      courses: 'Komputasi Statistik, Machine Learning, Data Science, Komputasi Statistika Lanjut',
      order: 3,
    },
  ]

  for (const d of dosenData) {
    const existing = await db.dosen.findFirst({ where: { name: d.name } })
    if (!existing) {
      await db.dosen.create({ data: d })
    }
  }

  // --- Aspirasi Mahasiswa (sample seed) ---
  const aspirasiData = [
    { name: 'Oji', content: 'Lab komputasi perlu ditambah ruang studi yang lebih luas agar mahasiswa bisa berlatih R dan Python dengan nyaman.', category: 'Fasilitas' },
    { name: 'Dian', content: 'Jadwal kuliah kadang bentrok antara Statistika Matematika dan Kalkulus. Mohon perhatiannya dari kaprodi.', category: 'Akademik' },
    { name: 'Ekoy', content: 'Sangat butuh acara olahraga antar angkatan supaya kebersamaan makin erat dan bukan cuma belajar.', category: 'Sosial' },
    { name: 'Cici', content: 'HIMASTA harus lebih aktif sosialisasi kegiatan. Banyak mahasiswa angkatan baru belum tahu agenda bulanan.', category: 'Organisasi' },
    { name: 'Bud', content: 'WiFi di gedung Cilegon sering putus saat kuis online. Tolong diperbaiki segera.', category: 'Fasilitas' },
    { name: 'Gita', content: 'Dosen statistika sangat baik dalam menjelaskan konsep distribusi normal. Lanjutkan metode mengajar yang interaktif!', category: 'Akademik' },
    { name: 'Faj', content: 'Mohon dibuka kelas pengayaan tentang machine learning dan data science sebagai persiapan industri.', category: 'Akademik' },
    { name: 'Indah', content: 'Acara makrab tahun ini berkesan sekali. Semoga tradisi kebersamaan angkatan tetap terjaga sampai wisuda.', category: 'Sosial' },
    { name: 'Jok', content: 'Perpustakaan kurang buku statistika terbaru edisi 2024. Diperlukan update referensi untuk tugas akhir mahasiswa.', category: 'Fasilitas' },
    { name: 'Kartik', content: 'Prodi sebaiknya jalin kerja sama dengan BPS dan OJK untuk magang mahasiswa statistika.', category: 'Akademik' },
    { name: 'Luk', content: 'Suka banget dengan kuliah statistika nonparametrik, dosen menjelaskan jelas uji mann whitney dan kruskal wallis.', category: 'Akademik' },
    { name: 'Rad', content: 'Sebaiknya HIMASTA buat forum diskusi online untuk tanya jawab materi kuliah tiap minggu.', category: 'Organisasi' },
    { name: 'Maya', content: 'Mohon jadwal UTS disebar paling lambat dua minggu sebelum ujian supaya bisa persiapan lebih matang.', category: 'Akademik' },
    { name: 'Bagus', content: 'Saran: adakan lomba karya tulis ilmiah antar mahasiswa statistika untuk latih menulis akademik.', category: 'Organisasi' },
    { name: 'Putri', content: 'Tolong tambah jam bimbingan skripsi. Dosen pembimbing sering sulit ditemui di jam kosong.', category: 'Akademik' },
    { name: 'Rian', content: 'Kantin perlu bersihkan meja lebih sering. Tempat makan adalah ruang sosial mahasiswa juga.', category: 'Fasilitas' },
    { name: 'Sari', content: 'Pengen diajak riset bareng dosen sejak semester awal. Bisa mulai dari proyek analisis data sederhana.', category: 'Akademik' },
    { name: 'Taufik', content: 'Buat grup diskusi angkatan yang lebih hidup. Jangan cuma broadcast pengumuman, perlu interaksi dua arah.', category: 'Organisasi' },
    { name: 'Vina', content: 'Sarana olahraga mahasiswa minim. Mohon dibuka akses lapangan untuk mahasiswa statistika di sore hari.', category: 'Fasilitas' },
    { name: 'Yoga', content: 'Dukung program beasiswa internal angkatan untuk mahasiswa berprestasi IPK tinggi tapi kurang mampu.', category: 'Sosial' },
  ]

  for (const a of aspirasiData) {
    const existing = await db.aspirasi.findFirst({ where: { content: a.content } })
    if (!existing) {
      await db.aspirasi.create({
        data: {
          name: a.name,
          content: a.content,
          category: a.category,
          approved: true,
        },
      })
    }
  }

  console.log('Seed complete.')
  console.log('Test credentials:')
  console.log('  Admin: username=admin, password=admin')
  console.log('  User : username=user,  password=user')
  console.log('  Member: username=fauzi, password=fauzi')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
