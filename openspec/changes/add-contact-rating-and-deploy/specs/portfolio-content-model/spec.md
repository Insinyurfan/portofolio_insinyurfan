## MODIFIED Requirements

### Requirement: Tabel pesan dan rating disiapkan untuk fitur berikutnya

Sistem SHALL membuat tabel `messages` (pesan dari form kontak) dan `ratings` (nama, bintang 1–5, komentar, status disetujui) beserta kebijakan aksesnya. Nilai bintang SHALL dibatasi pada bilangan bulat 1 sampai 5. Kedua tabel kini SHALL dipakai oleh halaman publik: pengunjung mengisi keduanya lewat form, dan rating yang sudah disetujui dibaca untuk ditampilkan.

#### Scenario: Bintang di luar rentang ditolak

- **WHEN** sebuah baris `ratings` disisipkan dengan nilai bintang 0 atau 6
- **THEN** database menolak operasi tersebut

#### Scenario: Pesan masuk dari halaman publik

- **WHEN** pengunjung mengirim form kontak dengan data yang sah
- **THEN** satu baris `messages` tersimpan dengan penanda belum dibaca

#### Scenario: Rating masuk dari halaman publik

- **WHEN** pengunjung mengirim rating dengan data yang sah
- **THEN** satu baris `ratings` tersimpan dalam keadaan belum disetujui

### Requirement: Row Level Security membatasi akses publik

Row Level Security SHALL aktif pada semua tabel. Pengunjung tanpa autentikasi SHALL hanya dapat melakukan `SELECT` pada baris tabel konten dengan `is_published = true`, dan SHALL tidak dapat melakukan `INSERT`, `UPDATE`, atau `DELETE` pada tabel konten. Pengguna terautentikasi SHALL dapat membaca dan mengubah semua baris.

Untuk `messages` dan `ratings`, pengunjung tanpa autentikasi SHALL dapat melakukan `INSERT`, dan SHALL dapat melakukan `SELECT` hanya pada baris `ratings` yang sudah disetujui. Pengunjung tanpa autentikasi SHALL tidak dapat membaca `messages` sama sekali, tidak dapat membaca `ratings` yang belum disetujui, dan tidak dapat melakukan `UPDATE` maupun `DELETE` pada kedua tabel itu. Nilai yang menentukan status — penanda sudah dibaca pada pesan dan status persetujuan pada rating — SHALL tidak dapat ditentukan oleh pengunjung saat menyisipkan baris.

#### Scenario: Baris belum terbit tidak terlihat publik

- **WHEN** klien tanpa autentikasi membaca sebuah tabel konten yang berisi baris dengan `is_published = false`
- **THEN** baris tersebut tidak muncul di hasil

#### Scenario: Penulisan ke tabel konten oleh publik ditolak

- **WHEN** klien tanpa autentikasi mencoba `INSERT`, `UPDATE`, atau `DELETE` pada tabel konten
- **THEN** operasi ditolak oleh kebijakan RLS

#### Scenario: Pesan tetap tertutup dari publik

- **WHEN** klien tanpa autentikasi mencoba membaca `messages`
- **THEN** tidak ada baris yang dikembalikan, termasuk baris yang baru saja dikirim oleh klien itu sendiri

#### Scenario: Rating belum disetujui tertutup dari publik

- **WHEN** klien tanpa autentikasi membaca `ratings` yang memuat baris belum disetujui
- **THEN** hanya baris yang sudah disetujui yang dikembalikan

#### Scenario: Publik tidak dapat menyetujui ratingnya sendiri

- **WHEN** klien tanpa autentikasi menyisipkan rating sambil menyertakan status disetujui bernilai benar
- **THEN** baris tersimpan dalam keadaan belum disetujui, atau operasi ditolak, dan rating itu tidak muncul di halaman publik

#### Scenario: Publik tidak dapat menandai pesannya sudah dibaca

- **WHEN** klien tanpa autentikasi menyisipkan pesan sambil menyertakan penanda sudah dibaca bernilai benar
- **THEN** baris tersimpan dengan penanda belum dibaca, atau operasi ditolak

#### Scenario: Publik tidak dapat mengubah atau menghapus kiriman

- **WHEN** klien tanpa autentikasi mencoba `UPDATE` atau `DELETE` pada `messages` maupun `ratings`
- **THEN** operasi ditolak oleh kebijakan RLS

#### Scenario: Pengguna terautentikasi melihat semua baris

- **WHEN** pengguna terautentikasi membaca sebuah tabel konten
- **THEN** baris dengan `is_published = false` juga ikut terlihat

## ADDED Requirements

### Requirement: Pembatasan laju pengiriman dihitung di database

Sistem SHALL menyediakan penyimpanan dan satu fungsi database untuk membatasi laju pengiriman form publik. Fungsi tersebut SHALL mencatat satu percobaan beserta pengenal pengirim dan jenis form, lalu mengembalikan keputusan apakah percobaan itu diizinkan, dalam satu operasi atomik sehingga dua permintaan yang tiba bersamaan tidak dapat sama-sama lolos melebihi batas. Pengunjung tanpa autentikasi SHALL tidak dapat membaca maupun mengubah data penghitung itu secara langsung.

#### Scenario: Pengiriman di bawah batas diizinkan

- **WHEN** fungsi pembatasan laju dipanggil untuk pengirim yang percobaannya masih di bawah batas dalam jendela waktu berjalan
- **THEN** fungsi mengembalikan keputusan diizinkan dan mencatat percobaan itu

#### Scenario: Pengiriman melebihi batas ditolak

- **WHEN** fungsi dipanggil untuk pengirim yang sudah mencapai batas dalam jendela waktu berjalan
- **THEN** fungsi mengembalikan keputusan ditolak

#### Scenario: Batas kembali terbuka setelah jendela waktu lewat

- **WHEN** jendela waktu untuk seorang pengirim sudah terlampaui
- **THEN** percobaan berikutnya dari pengirim itu diizinkan kembali

#### Scenario: Dua permintaan bersamaan tidak sama-sama lolos

- **WHEN** dua permintaan dari pengirim yang sama tiba bersamaan saat hanya tersisa satu kuota
- **THEN** tepat satu di antaranya diizinkan

#### Scenario: Penghitung tertutup dari publik

- **WHEN** klien tanpa autentikasi mencoba membaca atau mengubah data penghitung pembatasan laju
- **THEN** operasi ditolak

#### Scenario: Catatan lama tidak menumpuk selamanya

- **WHEN** catatan percobaan sudah jauh melampaui jendela waktu yang dipakai
- **THEN** catatan itu dapat dihapus tanpa memengaruhi keputusan pembatasan laju yang berjalan
