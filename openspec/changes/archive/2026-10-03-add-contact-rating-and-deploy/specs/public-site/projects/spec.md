## MODIFIED Requirements

### Requirement: Daftar proyek dapat disaring menurut tech stack

Halaman `/proyek` SHALL menyediakan kontrol penyaringan yang dibangun dari gabungan seluruh nilai tech stack pada proyek terbit. Setiap pilihan SHALL berupa tautan ke alamatnya sendiri, `/proyek/tech/[tech]`, dan BUKAN parameter kueri pada `/proyek`. Memilih sebuah tech stack SHALL membawa pengunjung ke halaman yang hanya memuat proyek terbit dengan nilai tersebut. SHALL tersedia tautan untuk kembali menampilkan semua proyek. Halaman `/proyek` maupun setiap `/proyek/tech/[tech]` SHALL dapat dirender statis dan di-cache, dan kontrol filternya SHALL tidak memerlukan JavaScript.

Slug tech stack yang tidak dipakai proyek terbit mana pun SHALL menjawab 404, bukan daftar kosong.

#### Scenario: Menyaring menurut satu tech stack

- **WHEN** pengunjung memilih sebuah tech stack dari kontrol filter
- **THEN** pengunjung dibawa ke `/proyek/tech/[tech]` yang hanya menampilkan proyek terbit dengan tech stack tersebut, dan filter yang aktif ditandai secara visual beserta `aria-current="page"`

#### Scenario: Mengosongkan filter

- **WHEN** pengunjung memilih pilihan "Semua"
- **THEN** pengunjung dibawa kembali ke `/proyek` yang menampilkan seluruh proyek terbit

#### Scenario: Halaman terfilter dapat di-cache

- **WHEN** `/proyek` atau `/proyek/tech/[tech]` diminta di produksi
- **THEN** halaman dilayani dari cache CDN, bukan dirender ulang pada setiap kunjungan

#### Scenario: Slug tech stack tidak dikenal

- **WHEN** pengunjung membuka `/proyek/tech/` dengan slug yang tidak dipakai proyek terbit mana pun
- **THEN** situs menjawab 404

#### Scenario: Filter berfungsi tanpa JavaScript

- **WHEN** halaman `/proyek` dibuka dengan JavaScript dimatikan
- **THEN** seluruh pilihan filter tetap dapat ditelusuri dan diaktifkan sebagai tautan biasa

#### Scenario: Filter tidak menghasilkan apa pun

- **WHEN** sebuah filter aktif tidak mencocokkan proyek mana pun
- **THEN** halaman menampilkan empty state berbahasa Indonesia yang menyarankan mengosongkan filter, dan kontrol filter tetap dapat dipakai

#### Scenario: Pilihan filter dibangun dari data

- **WHEN** kontrol filter dirender
- **THEN** pilihan yang tersedia hanya tech stack yang benar-benar dipakai oleh proyek terbit, tanpa duplikat dan tanpa daftar yang ditulis di kode

#### Scenario: Filter dapat dioperasikan dengan keyboard

- **WHEN** pengunjung menelusuri kontrol filter hanya dengan keyboard
- **THEN** setiap pilihan dapat difokus, cincin fokusnya terlihat, dan menekan Enter mengaktifkan filternya
