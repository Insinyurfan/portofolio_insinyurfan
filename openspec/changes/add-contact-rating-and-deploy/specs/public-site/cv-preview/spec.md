## Purpose

Memberi perekrut cara melihat CV langsung di halaman tanpa harus mengunduh berkas lebih dulu, sambil tetap menyediakan unduhan bagi yang menginginkannya.

## ADDED Requirements

### Requirement: Pratinjau CV dibuka di modal

Tombol pratinjau CV SHALL membuka berkas PDF dari profil di dalam modal di atas halaman, tanpa berpindah halaman. Modal SHALL menampilkan judul yang menyebut bahwa isinya adalah CV pemilik, tombol unduh, tautan membuka berkas di tab baru, dan tombol tutup.

#### Scenario: Modal terbuka

- **WHEN** pengunjung menekan tombol pratinjau CV
- **THEN** modal terbuka menampilkan berkas PDF, beserta tombol unduh, tautan buka di tab baru, dan tombol tutup

#### Scenario: Halaman tidak berpindah

- **WHEN** modal pratinjau terbuka
- **THEN** alamat halaman tidak berubah dan posisi scroll halaman tetap seperti sebelumnya setelah modal ditutup

#### Scenario: Latar halaman tidak ikut tergeser

- **WHEN** modal terbuka
- **THEN** halaman di belakangnya tidak dapat di-scroll, dan setelah modal ditutup kemampuan scroll halaman kembali normal

### Requirement: Modal pratinjau dapat diakses

Modal SHALL dapat ditutup lewat tombol tutup, tombol Escape, dan klik di area luar modal. Saat terbuka, fokus SHALL berpindah ke dalam modal dan terkurung di sana, dan setelah ditutup fokus SHALL kembali ke tombol yang membukanya. Modal SHALL diumumkan sebagai dialog kepada teknologi bantu beserta namanya.

#### Scenario: Menutup modal

- **WHEN** pengunjung menekan tombol tutup, menekan Escape, atau mengklik area di luar modal
- **THEN** modal tertutup dan fokus kembali ke tombol pratinjau CV

#### Scenario: Fokus terkurung di modal

- **WHEN** pengunjung menelusuri modal yang terbuka dengan Tab
- **THEN** fokus berputar di dalam modal saja dan tidak mencapai kontrol di belakangnya

#### Scenario: Modal diumumkan sebagai dialog

- **WHEN** modal terbuka sementara pembaca layar aktif
- **THEN** modal diumumkan sebagai dialog beserta nama yang menyebut CV pemilik

### Requirement: Jalur cadangan bila PDF tidak dapat ditampilkan

Jika peramban atau peranti tidak dapat menampilkan PDF di dalam halaman, modal SHALL menampilkan pesan berbahasa Indonesia beserta tombol unduh dan tautan membuka berkas di tab baru, sehingga pengunjung tetap dapat mencapai CV. Pada layar sempit, modal SHALL tetap dapat dipakai dan SHALL menawarkan jalur membuka berkas di tab baru secara menonjol.

#### Scenario: PDF tidak dapat dirender inline

- **WHEN** peramban tidak dapat menampilkan PDF di dalam halaman
- **THEN** modal menampilkan pesan berbahasa Indonesia beserta tombol unduh dan tautan buka di tab baru, bukan area kosong

#### Scenario: Pratinjau di layar sempit

- **WHEN** modal dibuka pada viewport selebar 320 piksel
- **THEN** modal tetap terbaca, tombol-tombolnya dapat dijangkau, dan tautan buka di tab baru ditampilkan menonjol

#### Scenario: Berkas CV tidak dapat dimuat

- **WHEN** URL CV ada tetapi berkasnya tidak dapat diambil
- **THEN** modal menampilkan pesan berbahasa Indonesia bahwa berkas tidak dapat dimuat, tanpa error yang tidak terjelaskan

### Requirement: Pratinjau hanya ada bila CV tersedia

Tombol pratinjau CV SHALL dirender hanya jika profil memiliki URL berkas CV. Pratinjau SHALL TIDAK memuat berkas PDF sebelum pengunjung menekan tombolnya, sehingga beranda tidak menanggung beban unduhan PDF pada pemuatan pertama.

#### Scenario: CV belum diunggah

- **WHEN** profil tidak memiliki URL berkas CV
- **THEN** tombol pratinjau tidak dirender

#### Scenario: PDF belum diambil sebelum diminta

- **WHEN** beranda dimuat tetapi tombol pratinjau belum ditekan
- **THEN** berkas PDF belum diunduh oleh peramban
