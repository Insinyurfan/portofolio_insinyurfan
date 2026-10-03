## Purpose

Memastikan perubahan yang disimpan admin langsung terlihat di halaman publik, bukan setelah menunggu periode revalidasi ISR habis, sehingga admin dapat memeriksa hasil kerjanya saat itu juga.

## ADDED Requirements

### Requirement: Aksi admin yang berhasil memperbarui halaman publik terdampak

Setiap aksi admin yang mengubah konten SHALL membatalkan cache halaman publik yang menampilkan konten itu, sehingga permintaan berikutnya ke halaman tersebut sudah menampilkan nilai baru tanpa menunggu periode revalidasi berkala.

#### Scenario: Perubahan langsung terlihat

- **WHEN** admin menyimpan perubahan pada sebuah item konten lalu halaman publik yang menampilkannya langsung diminta
- **THEN** halaman itu sudah menampilkan nilai yang baru tanpa menunggu periode revalidasi habis

#### Scenario: Hanya aksi yang berhasil yang memicu pembaruan

- **WHEN** sebuah aksi admin gagal karena validasi atau error database
- **THEN** tidak ada cache halaman publik yang dibatalkan

#### Scenario: Revalidasi berkala tetap berlaku

- **WHEN** konten diubah langsung di database tanpa melalui dashboard
- **THEN** perubahan tetap muncul setelah periode revalidasi berkala terlampaui, sebagaimana perilaku sebelumnya

### Requirement: Halaman yang dibatalkan cache-nya sesuai jenis kontennya

Pembatalan cache SHALL mencakup setiap halaman publik yang menampilkan konten yang berubah, termasuk beranda bila konten itu ikut tampil di sana. Perubahan pada sebuah proyek SHALL membatalkan cache halaman detail proyek itu, halaman daftar proyek, dan beranda bila proyek tersebut ditandai featured. Perubahan pada profil atau tautan sosial SHALL membatalkan cache seluruh halaman publik, karena keduanya ikut tampil di navigasi dan footer.

#### Scenario: Menyimpan proyek featured

- **WHEN** admin mengubah sebuah proyek yang ditandai featured
- **THEN** halaman detail proyek itu, halaman daftar proyek, dan beranda sama-sama menampilkan nilai baru pada permintaan berikutnya

#### Scenario: Mengubah profil

- **WHEN** admin mengubah nama atau tautan sosial di editor profil
- **THEN** setiap halaman publik menampilkan nilai baru pada permintaan berikutnya, termasuk footer di halaman mana pun

#### Scenario: Mengubah pendidikan

- **WHEN** admin mengubah sebuah riwayat pendidikan
- **THEN** halaman pendidikan menampilkan nilai baru pada permintaan berikutnya

#### Scenario: Mengubah urutan item

- **WHEN** admin memindahkan urutan sebuah item lewat tombol naik atau turun
- **THEN** halaman publik yang menampilkan daftar itu sudah memakai urutan baru pada permintaan berikutnya

#### Scenario: Menyembunyikan item

- **WHEN** admin menyembunyikan sebuah item
- **THEN** item itu sudah tidak muncul di halaman publik pada permintaan berikutnya

### Requirement: Slug dan sitemap mengikuti perubahan proyek

Membuat, menghapus, atau mengubah slug sebuah proyek SHALL membatalkan cache sitemap dan halaman daftar proyek, sehingga sitemap tidak lagi memuat slug yang sudah tidak ada dan segera memuat slug yang baru.

#### Scenario: Proyek baru masuk sitemap

- **WHEN** admin membuat proyek baru yang terbit
- **THEN** sitemap pada permintaan berikutnya sudah memuat URL proyek itu

#### Scenario: Slug lama keluar dari sitemap

- **WHEN** admin mengubah slug sebuah proyek
- **THEN** sitemap pada permintaan berikutnya memuat slug baru dan tidak lagi memuat slug lama

#### Scenario: Proyek dihapus atau disembunyikan

- **WHEN** admin menghapus atau menyembunyikan sebuah proyek
- **THEN** URL proyek itu tidak lagi ada di sitemap pada permintaan berikutnya

### Requirement: Kegagalan revalidasi tidak membatalkan perubahan

Jika pembatalan cache gagal setelah data berhasil tersimpan, perubahan data SHALL tetap tersimpan dan admin SHALL diberi tahu bahwa perubahan sudah tersimpan tetapi halaman publik mungkin belum langsung diperbarui.

#### Scenario: Revalidasi gagal setelah penyimpanan berhasil

- **WHEN** data berhasil tersimpan tetapi pembatalan cache gagal
- **THEN** perubahan tetap tersimpan di database dan admin melihat pemberitahuan berbahasa Indonesia bahwa halaman publik mungkin perlu beberapa saat untuk ikut berubah
