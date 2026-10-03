# admin-content-management Specification

## Purpose
Memberi pemilik portofolio kendali penuh atas setiap konten yang tampil di halaman publik — membuat, mengubah, menghapus, mengurutkan, dan menyembunyikan — tanpa perlu menyentuh SQL maupun mendeploy ulang.

## Requirements

### Requirement: Setiap jenis konten dapat dikelola dari dashboard

Dashboard SHALL menyediakan halaman pengelolaan untuk tautan sosial, riwayat pendidikan, kategori keahlian beserta keahliannya, pengalaman, proyek, dan pencapaian. Setiap halaman SHALL mendaftar seluruh item termasuk yang belum terbit, dan menyediakan cara membuat item baru, mengubah item yang ada, dan menghapus item.

#### Scenario: Item belum terbit terlihat di admin

- **WHEN** admin membuka halaman pengelolaan sebuah jenis konten yang memuat item belum terbit
- **THEN** item belum terbit itu muncul di daftar dengan penanda status yang jelas

#### Scenario: Membuat item baru

- **WHEN** admin mengisi form pembuatan dengan data yang sah lalu menyimpan
- **THEN** item baru tersimpan, muncul di daftar, dan toast keberhasilan ditampilkan

#### Scenario: Mengubah item yang ada

- **WHEN** admin membuka item yang ada, mengubah sebuah field, lalu menyimpan
- **THEN** perubahan tersimpan dan daftar menampilkan nilai yang baru

#### Scenario: Menghapus item

- **WHEN** admin menghapus sebuah item dan mengonfirmasinya
- **THEN** item hilang dari daftar dan dari database

#### Scenario: Daftar kosong

- **WHEN** admin membuka halaman pengelolaan yang belum memiliki item
- **THEN** halaman menampilkan empty state berbahasa Indonesia beserta ajakan membuat item pertama

### Requirement: Editor profil mengelola satu baris profil

Dashboard SHALL menyediakan editor profil yang mengubah baris profil tunggal alih-alih mendaftar banyak item. Editor SHALL dapat mengubah nama lengkap, username, tagline, bio, lokasi, email, status terbuka untuk pekerjaan, foto, berkas CV, dan daftar role yang dipakai animasi ketik di beranda. Jika baris profil belum ada, editor SHALL membuatnya saat pertama kali disimpan.

#### Scenario: Profil pertama kali dibuat

- **WHEN** admin membuka editor profil sementara belum ada baris profil, lalu mengisi dan menyimpan
- **THEN** satu baris profil terbuat dan halaman publik menampilkan datanya

#### Scenario: Daftar role dapat diubah urutannya

- **WHEN** admin menambah, menghapus, dan mengubah urutan role lalu menyimpan
- **THEN** beranda menampilkan role pada animasi ketik mengikuti urutan baru tersebut

#### Scenario: Role kosong tidak tersimpan

- **WHEN** admin menyimpan profil dengan baris role yang kosong atau hanya berisi spasi
- **THEN** baris kosong itu tidak tersimpan dan hanya role yang berisi teks yang disimpan

#### Scenario: Editor tidak membuat profil kedua

- **WHEN** admin menyimpan editor profil berulang kali
- **THEN** tetap hanya ada satu baris profil di database

### Requirement: Validasi form dengan pesan error per field

Setiap form admin SHALL divalidasi dengan skema yang sama di sisi klien dan di sisi server, dan validasi sisi server SHALL menjadi penentu. Field yang tidak sah SHALL menampilkan pesan berbahasa Indonesia yang menyebut masalahnya, terpasang pada field yang bersangkutan. Pengiriman yang gagal validasi SHALL mempertahankan isi yang sudah diketik admin.

#### Scenario: Field wajib dikosongkan

- **WHEN** admin mengirim form tanpa mengisi field wajib
- **THEN** pesan error berbahasa Indonesia muncul pada field itu, tidak ada data yang tersimpan, dan isi field lain tetap utuh

#### Scenario: Validasi server menjadi penentu

- **WHEN** sebuah aksi tulis dipanggil dengan data tidak sah tanpa melewati validasi klien
- **THEN** server menolak aksi tersebut dan tidak ada data yang tersimpan

#### Scenario: Format URL tidak sah

- **WHEN** admin memasukkan nilai yang bukan URL pada field tautan sosial, demo, repositori, atau verifikasi
- **THEN** field itu menampilkan pesan error berbahasa Indonesia dan form tidak tersimpan

#### Scenario: Rentang tanggal tidak logis

- **WHEN** admin menyimpan pengalaman atau pendidikan dengan tanggal selesai lebih awal daripada tanggal mulai
- **THEN** pesan error berbahasa Indonesia muncul dan data tidak tersimpan

#### Scenario: Pengalaman masih berjalan mengabaikan tanggal selesai

- **WHEN** admin menandai sebuah pengalaman masih berjalan
- **THEN** field tanggal selesai dinonaktifkan atau dikosongkan, dan data tersimpan tanpa tanggal selesai

### Requirement: Slug proyek dibantu dan dijaga keunikannya

Form proyek SHALL mengusulkan slug dari judul dan SHALL mengizinkan admin menyuntingnya. Slug SHALL divalidasi sebagai aman untuk URL, dan slug yang sudah dipakai proyek lain SHALL ditolak dengan pesan berbahasa Indonesia yang jelas, bukan error database mentah.

#### Scenario: Slug diusulkan dari judul

- **WHEN** admin mengisi judul proyek pada form proyek baru
- **THEN** field slug terisi usulan yang aman untuk URL dan masih dapat disunting

#### Scenario: Slug bentrok

- **WHEN** admin menyimpan proyek dengan slug yang sudah dipakai proyek lain
- **THEN** pesan error berbahasa Indonesia menjelaskan slug sudah terpakai dan data tidak tersimpan

#### Scenario: Slug tidak aman untuk URL

- **WHEN** admin memasukkan slug berisi spasi atau karakter yang tidak diizinkan
- **THEN** field slug menampilkan pesan error dan form tidak tersimpan

#### Scenario: Mengubah slug proyek yang ada

- **WHEN** admin mengubah slug sebuah proyek lalu menyimpan
- **THEN** halaman detail publik tersedia di slug baru dan slug lama tidak lagi menampilkan proyek itu

### Requirement: Toggle terbit per item

Setiap item konten SHALL dapat diubah status terbitnya dari daftar pengelolaan tanpa membuka form penyuntingan. Item yang disembunyikan SHALL hilang dari halaman publik setelah perubahan tersimpan, dan tetap terlihat di admin dengan penanda status.

#### Scenario: Menyembunyikan item

- **WHEN** admin menyembunyikan sebuah item dari daftar pengelolaan
- **THEN** item itu tidak lagi muncul di halaman publik, tetap tampil di admin dengan status tersembunyi, dan toast keberhasilan muncul

#### Scenario: Menerbitkan kembali item

- **WHEN** admin menerbitkan kembali item yang sebelumnya tersembunyi
- **THEN** item itu kembali muncul di halaman publik pada posisi urutannya

#### Scenario: Status terbit terlihat di daftar

- **WHEN** daftar pengelolaan berisi campuran item terbit dan tersembunyi
- **THEN** status setiap item terbaca jelas tanpa perlu membuka formnya

### Requirement: Urutan tampil diatur lewat tombol naik dan turun

Daftar pengelolaan untuk jenis konten yang berurutan SHALL menyediakan tombol naik dan turun pada setiap item. Menekan tombol SHALL menukar posisi item dengan tetangganya, menyimpan urutan baru, dan tercermin di halaman publik. Tombol naik pada item pertama dan tombol turun pada item terakhir SHALL dinonaktifkan.

#### Scenario: Memindahkan item ke atas

- **WHEN** admin menekan tombol naik pada sebuah item yang bukan item pertama
- **THEN** item itu bertukar posisi dengan item di atasnya, urutan baru tersimpan, dan halaman publik menampilkan urutan yang sama

#### Scenario: Batas daftar

- **WHEN** daftar pengelolaan dirender
- **THEN** tombol naik pada item pertama dan tombol turun pada item terakhir dinonaktifkan

#### Scenario: Urutan dapat diubah dengan keyboard

- **WHEN** admin menelusuri daftar hanya dengan keyboard dan mengaktifkan tombol naik atau turun
- **THEN** urutan berubah, dan fokus tetap pada tombol yang sama untuk item yang baru dipindahkan sehingga pemindahan berulang dapat dilakukan tanpa mencari ulang

#### Scenario: Urutan tetap konsisten

- **WHEN** beberapa pemindahan dilakukan berurutan lalu halaman dimuat ulang
- **THEN** urutan yang tampil sama dengan hasil pemindahan terakhir, tanpa nilai urutan yang kembar atau bolong yang mengacaukan urutan

### Requirement: Keahlian dikelola bersama kategorinya

Dashboard SHALL mengelola kategori keahlian dan keahlian di dalamnya dalam satu alur, sehingga setiap keahlian selalu dibuat di bawah sebuah kategori. Menghapus kategori SHALL dikonfirmasi dengan menyebut bahwa keahlian di dalamnya juga akan terhapus.

#### Scenario: Keahlian dibuat di bawah kategori

- **WHEN** admin membuat keahlian baru
- **THEN** ia harus memilih kategori induk, dan keahlian itu muncul dalam kelompok kategori tersebut di halaman publik

#### Scenario: Menghapus kategori berisi keahlian

- **WHEN** admin menghapus kategori yang memuat keahlian dan mengonfirmasinya
- **THEN** kategori beserta keahlian di dalamnya terhapus, dan halaman publik tidak lagi menampilkan kelompok itu

#### Scenario: Keahlian dapat dipindah kategori

- **WHEN** admin mengubah kategori induk sebuah keahlian lalu menyimpan
- **THEN** keahlian itu muncul di kelompok kategori yang baru di halaman publik

### Requirement: Field berdaftar pada proyek dapat disunting sebagai daftar

Form proyek SHALL mengizinkan admin menyunting tech stack dan galeri gambar sebagai daftar yang dapat ditambah, dihapus, dan diurutkan, bukan sebagai satu field teks yang dipisah tanda baca. Nilai kosong dan duplikat pada tech stack SHALL dibuang sebelum disimpan.

#### Scenario: Menyunting tech stack

- **WHEN** admin menambah dan menghapus nilai tech stack lalu menyimpan
- **THEN** halaman publik menampilkan daftar tech stack yang baru dan nilai itu ikut muncul sebagai pilihan filter proyek

#### Scenario: Duplikat tech stack dibuang

- **WHEN** admin menyimpan proyek dengan dua nilai tech stack yang sama
- **THEN** hanya satu nilai yang tersimpan

#### Scenario: Mengatur urutan galeri

- **WHEN** admin mengubah urutan gambar galeri lalu menyimpan
- **THEN** halaman detail publik menampilkan gambar dalam urutan yang baru
