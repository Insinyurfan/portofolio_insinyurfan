## REMOVED Requirements

### Requirement: Halaman Kontak menampilkan informasi tanpa form

Dihapus, bukan diubah. Namanya sendiri ("tanpa form") dan skenario "Tidak ada
form di change ini" adalah pernyataan ruang lingkup milik change sebelumnya.
Change inilah yang menambahkan form itu, sehingga keduanya kini menyatakan
kebalikan dari yang benar.

Penggantinya ada di bawah, dengan nama yang menggambarkan keadaan sesudahnya.

## ADDED Requirements

### Requirement: Halaman Kontak memuat form dan informasi kontak langsung

Halaman `/kontak` SHALL menampilkan email pemilik sebagai tautan `mailto`, lokasi, status terbuka untuk pekerjaan, dan tautan sosial media terbit. Halaman tersebut SHALL juga memuat form kontak, yang perilakunya ditetapkan di kapabilitas `public-site/contact-form`. Informasi kontak langsung SHALL tetap tersedia berdampingan dengan form, sehingga pengunjung yang lebih suka mengirim email sendiri tidak dipaksa memakai form.

#### Scenario: Email dapat diklik

- **WHEN** pengunjung membuka `/kontak` sementara profil memiliki email
- **THEN** email tampil sebagai tautan `mailto` yang membuka aplikasi email pengunjung

#### Scenario: Form dan informasi kontak berdampingan

- **WHEN** `/kontak` dirender
- **THEN** halaman memuat form kontak sekaligus informasi kontak langsung berupa email, lokasi, status, dan tautan sosial

#### Scenario: Email belum diisi

- **WHEN** profil tidak memiliki email
- **THEN** halaman dirender tanpa tautan email rusak dan tetap menampilkan informasi kontak lain yang tersedia, dan form kontak tetap berfungsi
