## ADDED Requirements

### Requirement: Kolom tabel pesan dirinci secara eksplisit

Tabel `messages` SHALL menyimpan nama pengirim, email pengirim, subjek opsional, isi pesan, dan penanda sudah dibaca selain kolom audit yang sudah ditetapkan. Nama pengirim, email pengirim, dan isi pesan SHALL wajib ada.

#### Scenario: Pesan tanpa isi ditolak

- **WHEN** sebuah baris `messages` disisipkan tanpa isi pesan
- **THEN** database menolak operasi tersebut

#### Scenario: Subjek bersifat opsional

- **WHEN** sebuah pesan disimpan tanpa subjek
- **THEN** baris tersebut tersimpan dan dapat dibaca kembali tanpa error

### Requirement: Pesan masuk ditandai belum dibaca secara default

Tabel `messages` SHALL memiliki penanda sudah dibaca bertipe boolean yang bernilai false secara default, sehingga pesan yang baru masuk terhitung sebagai belum dibaca tanpa perlu diatur oleh pemanggil. Penanda ini SHALL hanya dapat diubah oleh pengguna terautentikasi.

#### Scenario: Pesan baru terhitung belum dibaca

- **WHEN** sebuah baris `messages` disisipkan tanpa menyertakan penanda sudah dibaca
- **THEN** baris tersebut tersimpan dengan penanda bernilai false

#### Scenario: Menghitung pesan belum dibaca

- **WHEN** jumlah pesan yang penandanya bernilai false diminta
- **THEN** hasilnya hanya menghitung pesan yang belum ditandai dibaca

#### Scenario: Publik tidak dapat mengubah penanda dibaca

- **WHEN** klien tanpa autentikasi mencoba mengubah penanda sudah dibaca pada sebuah pesan
- **THEN** operasi ditolak oleh kebijakan RLS
