## Context

Change ini melanjutkan `setup-portfolio-public-site` dan `add-admin-dashboard`, yang keduanya belum diimplementasi saat dokumen ini ditulis. Motivasi ada di `proposal.md` → Why; perilaku yang harus dipenuhi ada di sembilan berkas di `specs/`.

Yang membedakan change ini dari dua sebelumnya: **ini pertama kalinya orang di luar pemilik dapat menulis ke database.** Sebelum ini halaman publik hanya membaca dan semua penulisan melewati `requireAdmin()`. Setiap keputusan di bawah berangkat dari sana.

Yang diwarisi dan menjadi batasan:

- Halaman publik membaca dengan kunci anon lewat `lib/queries/`; service role tidak pernah dipakai. Jalur tulis publik di sini juga memakai kunci anon, jadi RLS tetap satu-satunya penjaga.
- `add-admin-dashboard` sudah menyediakan skema zod bersama, pustaka form, komponen modal, pembungkus aksi `withAdminAction`, peta revalidasi terpusat, dan inbox serta moderasi. Change ini memakainya, bukan membangun ulang.
- Beranda memakai ISR dengan `revalidate` dari satu konstanta bersama.
- `ADMIN_EMAIL` sudah ada sebagai variabel server.

Keputusan pengguna yang sudah dipilih dan tidak dibuka lagi: pembatasan laju disimpan di tabel Postgres dengan fungsi atomik, notifikasi email lewat Resend dari server action, rating sebagai satu section di beranda, dan penanda di peramban untuk mencegah pengiriman ganda.

### Yang dibalik dari change sebelumnya

Empat requirement sebelumnya melarang hal yang kini justru dibangun: `/kontak` tanpa form, RLS yang menutup `messages` dan `ratings` dari publik, dan pernyataan `admin-inbox` bahwa halaman publik tidak menyentuh kedua tabel itu. Semuanya ditulis sebagai larangan untuk change-nya sendiri, dan dicabut lewat requirement MODIFIED di `specs/`. Yang **tidak** dibalik: pesan tetap tidak pernah terbaca publik, dan rating yang belum disetujui tetap tidak pernah tampil.

## Goals / Non-Goals

**Goals:**

- Satu pembungkus aksi publik yang sejajar dengan `withAdminAction`, sehingga setiap jalur tulis publik melewati honeypot, pembatasan laju, dan validasi tanpa bisa terlewat.
- Kebijakan RLS yang membuat pengunjung tidak dapat menentukan status kirimannya sendiri, ditegakkan di database dan bukan hanya dengan tidak mengirim kolom itu dari aplikasi.
- Pembatasan laju yang benar di lingkungan serverless, yaitu tidak bergantung pada memori proses.
- Kegagalan layanan email yang tidak pernah terlihat oleh pengunjung maupun membatalkan pesannya.
- Satu perintah pemeriksaan sebelum deploy yang gagal di tempat yang sama dengan tempat Vercel akan gagal.

**Non-Goals:**

- Framework pengujian otomatis. Lihat Risks — di change ini bobot risikonya paling berat dari ketiga change, dan dinyatakan apa adanya.
- CAPTCHA, verifikasi email pengirim, dan deteksi bot pihak ketiga.
- Balasan pesan dari dalam dashboard, pagination daftar rating, dan rating per proyek.
- Antrean pekerjaan untuk pengiriman email dan percobaan ulang terjadwal.
- Analitik dan pemantauan uptime.

## Decisions

### Pembungkus `withPublicAction` sejajar dengan `withAdminAction`

Setiap Server Action publik melewati satu pembungkus yang berurutan: memeriksa honeypot, menurunkan pengenal pengirim, memanggil fungsi pembatasan laju di database, mem-parse input dengan skema zod, menjalankan handler, lalu mengembalikan objek hasil bertipe seperti milik admin.

*Mengapa:* alasannya sama seperti di sisi admin, tetapi lebih tajam — di sini yang mudah terlupa adalah penyaringan spam, dan hanya ada dua form sekarang. Pembungkus membuat form ketiga nanti tidak bisa dibuat tanpa penyaringan itu.

*Catatan urutan:* honeypot diperiksa **sebelum** pembatasan laju, supaya lalu lintas bot tidak menghabiskan kuota pengunjung yang memakai jaringan bersama di belakang satu alamat IP.

*Alternatif:* menaruh pemeriksaan di masing-masing aksi — ditolak dengan alasan yang sama seperti di `add-admin-dashboard`.

### Honeypot menjawab seolah berhasil

Pengiriman dengan honeypot terisi mengembalikan objek hasil yang sama dengan pengiriman berhasil, tanpa menyimpan apa pun dan tanpa mengirim email.

*Mengapa:* spesifikasi memintanya, dan alasannya nyata — pesan penolakan yang jujur memberi tahu pembuat skrip mana field yang harus dikosongkan. Biaya kekeliruan kecil: pengunjung sungguhan tidak pernah mengisi field yang tidak dapat difokus dan tidak terbaca pembaca layar.

*Trade-off:* kalau sebuah peramban atau pengelola kata sandi mengisi field itu sendiri, pesan pengunjung hilang tanpa jejak. Mitigasinya: field diberi nama yang tidak menyerupai field yang biasa diisi otomatis, pengisian otomatis dimatikan padanya, dan ia disembunyikan dengan cara yang tidak membuatnya dilewati pengelola kata sandi lalu diisi — bukan sekadar `display: none` pada field bernama `email`.

### Pengenal pengirim: alamat IP dari header proxy, di-hash

Alamat IP diambil dari header yang diisi Vercel, lalu disimpan sebagai hash bersama garam (salt) dari variabel lingkungan, bukan sebagai alamat mentah.

*Mengapa:* pembatasan laju hanya butuh membedakan pengirim, tidak butuh mengetahui identitasnya. Menyimpan hash berarti tabel penghitung tidak menjadi catatan alamat IP pengunjung yang perlu dijaga kerahasiaannya.

*Trade-off:* beberapa pengunjung di belakang satu NAT berbagi kuota. Batas disetel cukup longgar untuk pemakaian wajar — beberapa pengiriman per jendela, bukan satu.

*Alternatif:* menyimpan IP mentah — lebih mudah di-debug, tetapi menambah data pribadi yang tidak dibutuhkan ke dalam database.

### Pembatasan laju adalah satu fungsi Postgres yang mencatat dan memutuskan sekaligus

Tabel penghitung menyimpan hash pengirim, jenis form, dan waktu percobaan. Satu fungsi plpgsql menerima ketiganya, menghitung percobaan dalam jendela waktu, mencatat percobaan baru, dan mengembalikan keputusan — semuanya dalam satu pemanggilan. Fungsi dibuat `SECURITY DEFINER` dengan `search_path` yang dikunci, dan hak eksekusinya diberikan ke role `anon`; tabelnya sendiri tidak punya policy untuk `anon`.

*Mengapa:* ini satu-satunya tempat di seluruh proyek yang memang membutuhkan `SECURITY DEFINER`, dan alasannya tepat: pengunjung harus dapat memperbarui penghitung tanpa pernah dapat membacanya atau mengubahnya sewenang-wenang. Satu fungsi juga membuatnya atomik — spesifikasi menuntut dua permintaan bersamaan tidak sama-sama lolos saat kuota tersisa satu, dan "baca lalu tulis" dari sisi aplikasi akan melanggarnya.

Catatan penting dan sengaja berbeda dari fungsi pengurutan di `add-admin-dashboard`, yang justru **wajib** `SECURITY INVOKER`: di sana melewati RLS berarti membuka jalur tulis bagi anon; di sini melewati RLS justru yang membuat penghitung tidak dapat dibaca atau dipalsukan. Perbedaan ini perlu dipahami sebelum menyentuh salah satunya.

*Alternatif:* Upstash atau Vercel KV — lebih cepat dan memang untuk ini, tetapi menambah layanan, dua variabel lingkungan, dan satu akun lagi. Ditolak sesuai pilihan pengguna. Pembatasan laju di memori proses — ditolak karena salah secara mendasar di serverless: setiap instance punya hitungan sendiri.

Catatan lama dibersihkan dengan penghapusan baris di luar jendela waktu, dijalankan sebagai bagian dari pemanggilan fungsi secara acak sesekali, bukan sebagai pekerjaan terjadwal.

### Kolom status tidak dapat ditentukan pengunjung, ditegakkan dua kali

Policy `INSERT` untuk `anon` memakai `WITH CHECK` yang mengharuskan penanda sudah dibaca bernilai false dan status persetujuan bernilai false. Selain itu hak kolom untuk role `anon` dibatasi hanya pada kolom yang memang diisi pengunjung.

*Mengapa:* spesifikasi menuntut pengunjung tidak dapat menyetujui ratingnya sendiri. Mengandalkan "aplikasi tidak mengirim kolom itu" bukan penegakan — klien mana pun dapat memanggil Supabase langsung dengan kunci anon, yang memang terbit di peramban. `WITH CHECK` membuat database yang menolak.

*Alternatif:* hanya mengandalkan aplikasi — ditolak; kunci anon ada di tangan siapa pun yang membuka halaman.

### Rata-rata rating dihitung di database lewat view

Satu view yang hanya membaca rating disetujui mengembalikan rata-rata dan jumlahnya, dan view itu dapat dibaca `anon`.

*Mengapa:* mengambil semua baris lalu merata-rata di aplikasi berarti jumlah rating menentukan ukuran payload beranda, dan rata-rata jadi mudah tidak sinkron dengan daftar yang ditampilkan bila keduanya difilter dengan cara yang sedikit berbeda. Satu sumber angka mencegah itu.

*Trade-off:* view perlu diperiksa agar tidak ikut membocorkan baris yang belum disetujui. Ia hanya mengembalikan agregat, tidak ada baris individu.

### Pembulatan rata-rata ditetapkan satu kali

Rata-rata ditampilkan dengan satu angka desimal, dibulatkan di lapisan presentasi, dan nilai yang sama dipakai untuk teks maupun untuk jumlah bintang yang terisi.

*Mengapa:* spesifikasi meminta ketelitian yang sama setiap saat. Dua tempat yang membulatkan sendiri akan menampilkan bintang dan angka yang tidak cocok, dan itu terlihat seperti bug.

### Penanda rating di peramban adalah kenyamanan, bukan penjagaan

Disimpan di penyimpanan peramban, dibaca di dalam `try`/`catch`, dan bila gagal form tetap dirender normal.

*Mengapa:* spesifikasi sudah menyatakan bahwa ini bukan pembatas akses. Yang penting di sini adalah keputusan teknisnya: karena beranda di-cache ISR, keadaan "sudah mengirim" tidak boleh ikut dirender di server — kalau tidak, halaman yang di-cache akan menampilkan ucapan terima kasih kepada semua orang. Jadi bagian itu diputuskan di klien setelah hidrasi, dan keadaan awal yang dirender server selalu berupa form.

Ini jenis kesalahan yang mudah lolos tanpa gejala sampai seseorang melaporkan bahwa form ratingnya hilang.

### Email dikirim setelah penyimpanan, kegagalannya ditelan

Pengiriman terjadi setelah baris pesan tersimpan, dibungkus `try`/`catch` dengan batas waktu, dan kegagalannya dicatat tanpa mengubah hasil yang dikembalikan ke pengunjung. Kredensial yang tidak ada membuat langkah ini dilewati dan dicatat sekali sebagai keterangan.

*Mengapa:* spesifikasi menuntut pengunjung tidak pernah menanggung masalah layanan email. Batas waktu dibutuhkan karena tanpanya layanan yang lambat menahan konfirmasi pengunjung.

*Alternatif:* antrean atau webhook database — lebih tahan gangguan, tetapi menambah komponen yang harus dideploy dan didebug sendiri untuk satu email per pesan. Ditolak sesuai pilihan pengguna.

Nama pengirim dan subjek dari pengunjung dipakai hanya di dalam badan email dan sebagai `Reply-To` yang sudah divalidasi sebagai alamat email, tidak pernah dirangkai ke baris header lain — itu yang mencegah penyuntikan header.

### Revalidasi beranda ditambahkan ke jalur moderasi rating

Peta revalidasi yang sudah ada di `add-admin-dashboard` diperluas: menyetujui, mencabut persetujuan, dan menghapus rating merevalidasi beranda. Jalur tulis publik sendiri **tidak** merevalidasi apa pun.

*Mengapa:* kiriman pengunjung tidak mengubah apa pun yang tampil — pesan tidak pernah tampil, rating baru belum disetujui. Merevalidasi di sana hanya membuang kerja dan memberi orang luar cara memaksa pembangunan ulang halaman berulang kali.

### Pratinjau PDF memakai kemampuan bawaan peramban, tanpa pustaka penampil

Modal menyematkan berkas lewat elemen bawaan dengan isi cadangan di dalamnya, dan URL PDF baru dipasang setelah modal dibuka.

*Mengapa:* pustaka penampil PDF berukuran besar dan akan masuk ke bundel beranda demi tombol yang mungkin tidak pernah ditekan. Isi cadangan bawaan elemen itu persis yang dibutuhkan skenario "tidak dapat dirender inline". Memasang URL setelah modal dibuka memenuhi syarat bahwa PDF belum diunduh pada pemuatan pertama.

*Trade-off:* tampilan penampil berbeda antar peramban dan sebagian peranti seluler menolak menampilkannya. Itulah sebabnya tautan buka di tab baru ditampilkan menonjol di layar sempit, bukan disembunyikan sebagai pilihan kedua.

### Satu perintah pemeriksaan sebelum deploy

Satu skrip menjalankan pemeriksaan tipe, lint, lalu build produksi secara berurutan dan berhenti pada kegagalan pertama.

*Mengapa:* spesifikasi `deployment` memintanya, dan nilainya ada pada urutannya: pemeriksaan tipe gagal dalam hitungan detik, build gagal dalam hitungan menit. Gagal di yang murah lebih dulu.

## Risks / Trade-offs

- **Jalur tulis publik pertama di proyek ini** → permukaan serangan yang sebelumnya nol. Mitigasi berlapis: `WITH CHECK` di RLS yang menolak status yang dipalsukan, hak kolom yang dibatasi untuk `anon`, honeypot, pembatasan laju atomik di database, batas panjang di setiap field, dan moderasi admin sebelum rating tampil. Tidak ada satu lapis pun yang berdiri sendiri.
- **`SECURITY DEFINER` pada fungsi pembatasan laju melewati RLS** → disengaja dan dibutuhkan, tetapi inilah satu-satunya fungsi berhak khusus di seluruh proyek. `search_path` dikunci untuk mencegah pembajakan lewat objek bernama sama, fungsi tidak menerima nama tabel atau SQL dari pemanggil, dan hak eksekusinya diberikan hanya untuk fungsi itu. Siapa pun yang mengubahnya harus memahami dulu perbedaannya dengan fungsi pengurutan yang wajib `SECURITY INVOKER`.
- **Tanpa pengujian otomatis, jalur yang paling berisiko diverifikasi manual** → ini titik terlemah dan bobotnya paling berat di change ini, karena yang diuji bukan lagi tampilan melainkan kebijakan akses. Mitigasi: berkas pemeriksaan SQL yang menegaskan setiap skenario RLS sebagai `anon`, termasuk upaya memalsukan status persetujuan, ditambah pemeriksaan atomisitas pembatasan laju. Rekomendasi tetap: tambahkan pengujian otomatis untuk ketiga jalur tulis publik, dan ini titik paling wajar untuk memulainya dari seluruh proyek.
- **Pengunjung di belakang satu alamat IP berbagi kuota pembatasan laju** → batas disetel longgar, dan pesan penolakan menyatakan bahwa pengunjung dapat mencoba lagi nanti alih-alih menyiratkan ia diblokir.
- **Honeypot yang diisi pengelola kata sandi akan membuang pesan pengunjung secara senyap** → field diberi nama yang tidak menyerupai field umum, pengisian otomatis dimatikan, dan cara menyembunyikannya dipilih agar tidak memancing pengisian otomatis. Risiko sisa diterima karena alternatifnya memberi petunjuk kepada pembuat skrip.
- **Keadaan "sudah mengirim rating" yang keliru dirender di server akan tampil ke semua pengunjung lewat halaman yang di-cache** → keputusan eksplisit bahwa keadaan awal dari server selalu berupa form, dan penanda hanya diperiksa setelah hidrasi. Masuk daftar periksa verifikasi secara tersendiri.
- **Email pemberitahuan dapat hilang tanpa ada yang menyadari** → dicatat di log server, dan hitungan pesan belum dibaca di dashboard tetap menjadi sumber kebenaran sehingga pesan tidak pernah benar-benar terlewat walau emailnya gagal.
- **Mengubah variabel URL situs saat memasang custom domain mudah terlupa** → akibatnya tidak langsung terlihat karena situs tetap berjalan, hanya URL kanonik, Open Graph, dan sitemap yang salah. Karena itu dijadikan skenario tersendiri di spesifikasi dan langkah verifikasi tersendiri di README.
- **Bergantung pada dua change yang belum ada** → setiap task menyebut apa yang diasumsikan tersedia, dan change ini harus diimplementasi serta diarsipkan terakhir agar keempat delta modifikasi punya spec induk untuk digabung.

## Migration Plan

1. Terapkan migrasi baru: policy `INSERT` untuk `anon` pada `messages` dan `ratings` beserta `WITH CHECK` status, policy `SELECT` untuk `anon` pada rating yang sudah disetujui, pembatasan hak kolom untuk `anon`, view agregat rating, serta tabel dan fungsi pembatasan laju.
2. Hasilkan ulang tipe database agar view dan kolom baru ikut bertipe.
3. Tambahkan variabel lingkungan baru — garam untuk hash pengirim dan kredensial layanan email beserta alamat pengirimnya — ke `.env.local`, `.env.example`, dan Vercel.
4. Jalankan berkas pemeriksaan SQL untuk RLS dan pembatasan laju; lanjut hanya jika semuanya lulus, termasuk upaya memalsukan status persetujuan yang harus ditolak.
5. Jalankan perintah pemeriksaan sebelum deploy di lokal.
6. Telusuri daftar periksa verifikasi: kirim pesan, periksa pesan muncul di inbox dan email masuk, kirim rating, periksa rating belum tampil lalu setujui dan periksa beranda langsung berubah, buka pratinjau CV, dan uji kedua form dengan honeypot terisi serta melebihi batas laju.
7. Deploy, lalu jalankan verifikasi produksi yang sama secara ringkas.
8. Hubungkan custom domain bila sudah ada, perbarui variabel URL situs, deploy ulang, lalu verifikasi sitemap dan Open Graph menunjuk domain baru.

**Rollback:** mengembalikan deployment Vercel menghilangkan form kontak, section rating, dan pratinjau CV, dan situs kembali sepenuhnya baca-saja. Policy `anon` untuk `INSERT` sebaiknya **ikut dicabut** saat rollback, karena tanpa aplikasi yang memakainya policy itu hanya menyisakan jalur tulis terbuka tanpa antarmuka yang mengawasinya. Tabel dan fungsi pembatasan laju serta view agregat boleh ditinggal; keduanya tidak memengaruhi halaman publik.

## Open Questions

- Batas angka untuk pembatasan laju — berapa pengiriman per jendela waktu, dan panjang jendelanya. Nilai awal yang longgar dipakai dan dapat disetel setelah melihat lalu lintas nyata; tidak mengubah skema maupun task.
- Apakah daftar rating di beranda perlu dibatasi jumlahnya setelah rating yang disetujui bertambah banyak. Penambahan batas nanti bersifat lokal pada satu komponen.
- Apakah catatan pembatasan laju yang lama perlu pembersihan terjadwal bila pembersihan sesekali di dalam fungsi ternyata tidak cukup.
