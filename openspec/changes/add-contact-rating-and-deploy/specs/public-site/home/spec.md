## MODIFIED Requirements

### Requirement: Tombol aksi utama pada hero

Hero SHALL menampilkan tombol ke halaman proyek, tombol ke halaman kontak, tombol pratinjau CV, dan tombol mengunduh CV. Tombol unduh CV SHALL merujuk URL berkas CV dari profil dan dibuka di tab baru. Tombol pratinjau CV SHALL membuka berkas itu di modal tanpa meninggalkan halaman, dengan perilaku yang ditetapkan di kapabilitas `public-site/cv-preview`. Kedua tombol CV SHALL disembunyikan jika URL CV belum ada.

#### Scenario: Tombol mengantar ke halamannya

- **WHEN** pengunjung menekan tombol lihat proyek atau tombol kontak
- **THEN** pengunjung dibawa ke halaman proyek atau halaman kontak

#### Scenario: CV belum diunggah

- **WHEN** profil tidak memiliki URL berkas CV
- **THEN** tombol pratinjau CV dan tombol unduh CV sama-sama tidak dirender, dan tombol lainnya tetap tampil rapi

#### Scenario: Unduh CV

- **WHEN** profil memiliki URL berkas CV dan pengunjung menekan tombol unduh CV
- **THEN** berkas CV terbuka atau terunduh di tab baru

#### Scenario: Pratinjau CV

- **WHEN** profil memiliki URL berkas CV dan pengunjung menekan tombol pratinjau CV
- **THEN** berkas CV tampil di modal di atas halaman, tanpa berpindah halaman
