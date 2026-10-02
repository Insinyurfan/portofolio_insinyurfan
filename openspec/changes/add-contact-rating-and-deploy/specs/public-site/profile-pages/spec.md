## MODIFIED Requirements

### Requirement: Halaman Kontak menampilkan informasi tanpa form

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
