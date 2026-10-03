# admin-shell Specification

## Purpose
Menetapkan kerangka yang dipakai bersama seluruh halaman dashboard: navigasi sidebar, perilaku responsif, umpan balik setelah aksi, dan konfirmasi sebelum tindakan merusak.

## Requirements

### Requirement: Layout sidebar untuk seluruh halaman admin

Setiap halaman admin selain halaman login SHALL dirender di dalam layout bersama berisi sidebar navigasi yang menautkan ke halaman ringkasan dan ke setiap bagian konten yang dapat dikelola, serta tombol logout. Sidebar SHALL menandai bagian yang sedang aktif.

#### Scenario: Navigasi tersedia di setiap halaman

- **WHEN** halaman admin mana pun selain login dibuka
- **THEN** sidebar tampil berisi tautan ke ringkasan, profil, tautan sosial, pendidikan, keahlian, pengalaman, proyek, pencapaian, pesan, rating, dan tombol logout

#### Scenario: Bagian aktif ditandai

- **WHEN** admin berada di salah satu bagian
- **THEN** item sidebar untuk bagian itu ditandai secara visual dan diumumkan sebagai halaman kini kepada teknologi bantu

### Requirement: Dashboard dapat dipakai di layar sempit

Layout admin SHALL dapat dipakai dari lebar peranti 360 piksel hingga layar lebar. Pada layar sempit, sidebar SHALL diringkas menjadi panel yang dapat dibuka-tutup lewat tombol, dan tabel atau daftar yang lebar SHALL tetap dapat dibaca tanpa membuat halaman ikut tergeser mendatar.

#### Scenario: Sidebar diringkas di layar sempit

- **WHEN** halaman admin dibuka pada lebar 360 piksel
- **THEN** sidebar tersembunyi di balik tombol, dapat dibuka dan ditutup, dan menutup sendiri setelah sebuah tautan dipilih

#### Scenario: Daftar lebar tetap terbaca

- **WHEN** daftar item dengan banyak kolom dibuka pada layar sempit
- **THEN** daftar tetap dapat dibaca tanpa scroll mendatar pada halaman secara keseluruhan

#### Scenario: Sidebar dapat dioperasikan dengan keyboard

- **WHEN** admin membuka panel sidebar di layar sempit hanya dengan keyboard
- **THEN** fokus berpindah ke dalam panel, setiap tautan dapat dicapai, dan Escape menutup panel serta mengembalikan fokus ke tombol pembuka

### Requirement: Notifikasi toast setelah setiap aksi

Setiap aksi admin yang mengubah data SHALL menghasilkan notifikasi toast berbahasa Indonesia yang menyatakan hasilnya. Toast keberhasilan SHALL menyebut apa yang berubah. Toast kegagalan SHALL menyebut alasan yang dapat ditindaklanjuti dan SHALL TIDAK menghilang sendiri secepat toast keberhasilan. Toast SHALL diumumkan ke teknologi bantu.

#### Scenario: Toast setelah berhasil

- **WHEN** sebuah item berhasil disimpan, dihapus, diubah urutannya, atau diubah status terbitnya
- **THEN** toast keberhasilan berbahasa Indonesia muncul yang menyebut item dan aksi yang terjadi

#### Scenario: Toast setelah gagal

- **WHEN** sebuah aksi admin gagal
- **THEN** toast kegagalan menjelaskan alasannya dalam bahasa Indonesia dan bertahan cukup lama untuk dibaca

#### Scenario: Toast dapat diakses

- **WHEN** sebuah toast muncul
- **THEN** isinya diumumkan ke teknologi bantu tanpa memindahkan fokus dari pekerjaan admin

### Requirement: Konfirmasi sebelum tindakan merusak

Menghapus item apa pun SHALL memunculkan dialog konfirmasi yang menyebut item yang akan dihapus beserta akibatnya bila ada data turunan yang ikut terhapus. Penghapusan SHALL hanya terjadi setelah dikonfirmasi. Dialog SHALL dapat dibatalkan lewat tombol batal, Escape, maupun klik di luar dialog.

#### Scenario: Penghapusan dikonfirmasi

- **WHEN** admin menekan hapus pada sebuah item lalu mengonfirmasi
- **THEN** item terhapus dan toast keberhasilan muncul

#### Scenario: Penghapusan dibatalkan

- **WHEN** admin menekan hapus lalu membatalkan lewat tombol batal, Escape, atau klik di luar dialog
- **THEN** tidak ada yang terhapus dan daftar tetap seperti semula

#### Scenario: Akibat turunan disebutkan

- **WHEN** item yang akan dihapus memiliki data turunan, misalnya kategori keahlian yang memuat keahlian
- **THEN** dialog konfirmasi menyebut bahwa data turunan itu juga akan terhapus

#### Scenario: Dialog dapat dioperasikan dengan keyboard

- **WHEN** dialog konfirmasi terbuka
- **THEN** fokus berpindah ke dalam dialog dan terkurung di sana, dan setelah ditutup fokus kembali ke kontrol yang membukanya

### Requirement: Umpan balik selama aksi berjalan

Kontrol yang memicu aksi tulis SHALL menunjukkan keadaan sedang berjalan dan SHALL dinonaktifkan selama aksi berlangsung, sehingga satu aksi tidak dapat terkirim dua kali karena klik ganda.

#### Scenario: Tombol dinonaktifkan selama menyimpan

- **WHEN** admin mengirim sebuah form dan aksinya masih berjalan
- **THEN** tombol kirim menampilkan keadaan sedang berjalan dan tidak dapat ditekan lagi sampai aksi selesai

#### Scenario: Klik ganda tidak menggandakan data

- **WHEN** admin menekan tombol simpan dua kali secepat mungkin pada form pembuatan item baru
- **THEN** hanya satu item yang terbuat
