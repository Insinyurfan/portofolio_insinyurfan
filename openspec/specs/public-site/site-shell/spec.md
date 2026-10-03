# public-site/site-shell Specification

## Purpose
Menetapkan kerangka yang dipakai bersama oleh seluruh halaman publik: bahasa dan arah visual, navigasi responsif, footer, pengaturan tema terang/gelap, perilaku animasi, dan dasar aksesibilitas.

## Requirements

### Requirement: Antarmuka publik berbahasa Indonesia

Seluruh teks antarmuka pada halaman publik — label navigasi, judul bagian, teks tombol, empty state, dan pesan error — SHALL ditulis dalam bahasa Indonesia. Dokumen HTML SHALL menyatakan bahasa `id`.

#### Scenario: Atribut bahasa dokumen

- **WHEN** halaman publik mana pun dimuat
- **THEN** elemen `html` membawa atribut lang bernilai `id`

#### Scenario: Label navigasi berbahasa Indonesia

- **WHEN** navbar dirender
- **THEN** setiap item menu memakai label bahasa Indonesia: Beranda, Tentang, Pendidikan, Keahlian, Pengalaman, Proyek, Pencapaian, Kontak

### Requirement: Arah visual bersih, terang, dengan satu warna aksen

Halaman publik SHALL memakai gaya bersih dan modern dengan latar terang sebagai default, kartu bersudut membulat, tipografi sans-serif tegas untuk judul, dan tata letak bento grid untuk bagian ikhtisar. Tepat satu warna aksen — hijau zamrud — SHALL dipakai untuk penekanan, tautan, dan tombol utama. Situs SHALL TIDAK memakai estetika gelap bertema terminal/hacker seperti teks hijau monospace di atas latar hitam sebagai tampilan default.

#### Scenario: Tampilan awal adalah tema terang

- **WHEN** pengunjung baru tanpa preferensi tersimpan membuka situs pada sistem yang tidak meminta tema gelap
- **THEN** situs dirender dengan tema terang

#### Scenario: Aksen konsisten satu warna

- **WHEN** tombol utama, tautan aktif, dan penanda penekanan di seluruh halaman dibandingkan
- **THEN** semuanya memakai warna aksen hijau zamrud yang sama dari token design system, bukan nilai warna yang ditulis lepas

### Requirement: Navbar responsif dengan menu mobile

Setiap halaman publik SHALL menampilkan navbar berisi tautan ke semua halaman publik. Pada layar lebar, tautan SHALL tampil berderet. Pada layar sempit, tautan SHALL diringkas menjadi menu yang dapat dibuka-tutup lewat tombol. Navbar SHALL menandai halaman yang sedang aktif.

#### Scenario: Menu mobile dibuka dan ditutup

- **WHEN** pengunjung pada layar sempit menekan tombol menu
- **THEN** panel navigasi terbuka berisi semua tautan, dan menekan tombol itu lagi atau memilih sebuah tautan akan menutupnya

#### Scenario: Halaman aktif ditandai

- **WHEN** pengunjung berada di salah satu halaman publik
- **THEN** item navbar untuk halaman tersebut ditandai secara visual dan diumumkan sebagai halaman kini kepada teknologi bantu

#### Scenario: Menu mobile dapat dioperasikan dengan keyboard

- **WHEN** pengunjung membuka menu mobile hanya dengan keyboard
- **THEN** fokus berpindah ke dalam panel, setiap tautan dapat dicapai dengan Tab, dan tombol Escape menutup panel serta mengembalikan fokus ke tombol pembuka

### Requirement: Toggle tema terang dan gelap

Halaman publik SHALL menyediakan kontrol untuk berganti antara tema terang dan gelap. Pilihan pengunjung SHALL tersimpan di peramban dan dipakai pada kunjungan berikutnya. Jika belum ada pilihan tersimpan, situs SHALL mengikuti preferensi tema sistem. Tema tersimpan SHALL diterapkan sebelum halaman tampil sehingga tidak ada kedipan tema.

#### Scenario: Pilihan tema bertahan

- **WHEN** pengunjung memilih tema gelap lalu memuat ulang halaman atau membuka halaman publik lain
- **THEN** tema gelap tetap aktif

#### Scenario: Tanpa kedipan saat memuat

- **WHEN** halaman dimuat sementara tema gelap sudah tersimpan
- **THEN** halaman langsung tampil gelap tanpa sekilas menampilkan tema terang

#### Scenario: Mengikuti preferensi sistem

- **WHEN** pengunjung belum pernah memilih tema dan sistemnya meminta tema gelap
- **THEN** situs dirender dengan tema gelap

### Requirement: Footer di setiap halaman

Setiap halaman publik SHALL menampilkan footer berisi nama pemilik portofolio, tautan sosial media dari database, dan keterangan hak cipta dengan tahun kini.

#### Scenario: Footer memakai data dari database

- **WHEN** footer dirender
- **THEN** nama dan tautan sosial yang ditampilkan berasal dari database, dan hanya tautan terbit yang tampil

### Requirement: Animasi halus saat scroll yang menghormati reduced motion

Bagian konten SHALL muncul dengan transisi halus saat masuk ke area pandang. Jika pengunjung meminta gerak dikurangi lewat pengaturan sistem, animasi masuk dan animasi ketik SHALL dinonaktifkan dan konten SHALL langsung tampil dalam keadaan akhirnya.

#### Scenario: Konten muncul saat di-scroll

- **WHEN** pengunjung men-scroll ke sebuah bagian yang belum terlihat
- **THEN** bagian tersebut muncul dengan transisi halus, sekali saja, tidak berulang setiap kali di-scroll

#### Scenario: Reduced motion dihormati

- **WHEN** pengunjung mengaktifkan preferensi mengurangi gerak lalu membuka halaman publik
- **THEN** seluruh konten terlihat tanpa animasi masuk maupun animasi ketik, dan tidak ada konten yang tersembunyi

### Requirement: Dasar aksesibilitas pada seluruh halaman publik

Halaman publik SHALL memenuhi dasar aksesibilitas berikut: teks dan komponen antarmuka memenuhi rasio kontras WCAG AA pada kedua tema; setiap gambar bermakna memiliki alt text dan gambar dekoratif ditandai kosong; setiap kontrol interaktif dapat dicapai dan dioperasikan dengan keyboard dengan indikator fokus yang terlihat; setiap halaman memiliki tepat satu heading level satu dengan hierarki heading yang berurutan; dan tersedia tautan lompat ke konten utama.

#### Scenario: Navigasi keyboard penuh

- **WHEN** pengunjung menelusuri seluruh halaman hanya dengan keyboard
- **THEN** setiap tautan, tombol, dan kontrol filter dapat dicapai dalam urutan yang logis dengan indikator fokus yang terlihat jelas

#### Scenario: Lompat ke konten utama

- **WHEN** pengunjung menekan Tab pada awal halaman
- **THEN** kontrol pertama yang menerima fokus adalah tautan lompat ke konten utama, dan mengaktifkannya memindahkan fokus ke area konten utama

#### Scenario: Kontras memadai di kedua tema

- **WHEN** warna teks dan latar diperiksa pada tema terang maupun gelap
- **THEN** rasio kontras memenuhi WCAG AA untuk teks normal dan teks besar

### Requirement: Tata letak mobile-first tanpa scroll horizontal

Halaman publik SHALL dirancang mobile-first dan SHALL tetap terbaca dari lebar peranti 320 piksel hingga layar lebar. Tidak boleh ada scroll horizontal pada lebar peranti mana pun.

#### Scenario: Terbaca pada layar sempit

- **WHEN** halaman publik mana pun dibuka pada viewport selebar 320 piksel
- **THEN** seluruh konten terbaca dalam satu kolom tanpa scroll horizontal dan tanpa teks yang terpotong
