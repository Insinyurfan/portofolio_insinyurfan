# admin-media Specification

## Purpose
Memberi admin cara mengunggah dan mengganti gambar serta berkas CV dari dashboard, tanpa meninggalkan berkas lama yang menumpuk di Storage dan tanpa mengunggah berkas yang tidak layak tampil di halaman publik.

## Requirements

### Requirement: Unggah gambar dari form admin

Form admin yang memiliki field gambar — foto profil, thumbnail proyek, galeri proyek, dan gambar pencapaian — SHALL mengizinkan admin memilih berkas dari perangkatnya dan mengunggahnya ke Storage. Setelah unggahan berhasil, field tersebut SHALL merujuk berkas yang baru dan halaman publik SHALL menampilkan gambar itu setelah perubahan disimpan.

#### Scenario: Unggah gambar berhasil

- **WHEN** admin memilih sebuah berkas gambar yang sah pada field gambar lalu menyimpan form
- **THEN** berkas tersimpan di Storage, field merujuk berkas itu, dan halaman publik menampilkannya

#### Scenario: Unggahan ke galeri menambah gambar

- **WHEN** admin mengunggah beberapa gambar ke galeri sebuah proyek
- **THEN** semua gambar tersimpan dan muncul di galeri halaman detail publik sesuai urutan yang diatur admin

### Requirement: Pratinjau sebelum dan sesudah unggah

Field gambar SHALL menampilkan pratinjau gambar yang berlaku saat ini, dan SHALL menampilkan pratinjau berkas yang baru dipilih sebelum form disimpan. Selama unggahan berjalan, field SHALL menunjukkan keadaan sedang berjalan.

#### Scenario: Pratinjau gambar yang sudah ada

- **WHEN** admin membuka form item yang sudah memiliki gambar
- **THEN** pratinjau gambar tersebut tampil di field gambar

#### Scenario: Pratinjau pilihan baru

- **WHEN** admin memilih berkas gambar baru tetapi belum menyimpan form
- **THEN** pratinjau berganti menampilkan berkas yang baru dipilih sehingga admin dapat memastikan pilihannya sebelum menyimpan

#### Scenario: Keadaan sedang mengunggah

- **WHEN** unggahan sedang berjalan
- **THEN** field menunjukkan bahwa proses sedang berlangsung dan tombol simpan form tidak dapat ditekan sampai unggahan selesai

### Requirement: Jenis dan ukuran berkas dibatasi

Unggahan gambar SHALL hanya menerima format gambar untuk web yang lazim, dan unggahan CV SHALL hanya menerima PDF. Setiap unggahan SHALL dibatasi ukuran maksimum. Berkas yang ditolak SHALL menghasilkan pesan berbahasa Indonesia yang menyebut jenis dan ukuran yang diizinkan, dan SHALL TIDAK tersimpan di Storage. Pembatasan ini SHALL ditegakkan di sisi server, bukan hanya oleh atribut form.

#### Scenario: Jenis berkas tidak diizinkan

- **WHEN** admin memilih berkas yang bukan gambar pada field gambar
- **THEN** pesan berbahasa Indonesia menyebut format yang diizinkan, berkas tidak terunggah, dan field tetap merujuk gambar sebelumnya

#### Scenario: Berkas terlalu besar

- **WHEN** admin memilih berkas yang melebihi ukuran maksimum
- **THEN** pesan berbahasa Indonesia menyebut batas ukurannya dan berkas tidak terunggah

#### Scenario: Pembatasan ditegakkan di server

- **WHEN** unggahan dengan jenis berkas yang tidak diizinkan dikirim tanpa melewati pemeriksaan di peramban
- **THEN** server menolak unggahan itu dan tidak ada berkas yang tersimpan di Storage

#### Scenario: CV hanya menerima PDF

- **WHEN** admin memilih berkas yang bukan PDF pada field CV
- **THEN** pesan berbahasa Indonesia menyebut bahwa hanya PDF yang diterima dan berkas tidak terunggah

### Requirement: Berkas lama dihapus saat diganti

Ketika sebuah gambar atau berkas CV digantikan oleh unggahan baru, atau ketika gambar dihapus dari sebuah field, berkas lama SHALL dihapus dari Storage. Penghapusan berkas lama SHALL hanya terjadi setelah referensi yang baru berhasil tersimpan di database, sehingga kegagalan di tengah proses tidak pernah meninggalkan item yang menunjuk berkas yang sudah hilang.

#### Scenario: Mengganti foto profil

- **WHEN** admin mengunggah foto profil baru menggantikan yang lama lalu menyimpan
- **THEN** profil merujuk berkas baru dan berkas lama tidak lagi ada di Storage

#### Scenario: Mengganti berkas CV

- **WHEN** admin mengunggah PDF CV baru menggantikan yang lama
- **THEN** tombol unduh CV di beranda mengarah ke berkas baru dan berkas lama terhapus dari Storage

#### Scenario: Menghapus gambar dari galeri

- **WHEN** admin menghapus sebuah gambar dari galeri proyek lalu menyimpan
- **THEN** gambar itu hilang dari galeri publik dan berkasnya terhapus dari Storage

#### Scenario: Penyimpanan gagal setelah unggah

- **WHEN** unggahan berhasil tetapi penyimpanan ke database gagal
- **THEN** item tetap merujuk berkas lamanya dan berkas lama tidak terhapus

#### Scenario: Berkas lama sudah tidak ada

- **WHEN** berkas lama sudah tidak ada di Storage saat penggantian dilakukan
- **THEN** aksi tetap selesai dengan sukses tanpa menampilkan error kepada admin

### Requirement: Menghapus item membersihkan berkasnya

Menghapus sebuah item konten SHALL menghapus juga berkas di Storage yang hanya dirujuk oleh item itu, termasuk seluruh gambar galeri sebuah proyek.

#### Scenario: Menghapus proyek beserta gambarnya

- **WHEN** admin menghapus sebuah proyek yang memiliki thumbnail dan gambar galeri
- **THEN** proyek terhapus dari database dan seluruh berkas gambarnya terhapus dari Storage

#### Scenario: Menghapus pencapaian beserta gambarnya

- **WHEN** admin menghapus sebuah pencapaian yang memiliki gambar
- **THEN** pencapaian dan berkas gambarnya sama-sama terhapus

### Requirement: Nama berkas tidak bertabrakan dan tidak membocorkan nama asli

Berkas yang diunggah SHALL disimpan dengan nama yang dihasilkan sistem di bawah prefiks folder yang sesuai dengan jenis kontennya, bukan dengan nama asli berkas dari perangkat admin. Dua unggahan berbeda SHALL TIDAK pernah saling menimpa.

#### Scenario: Dua berkas dengan nama asli yang sama

- **WHEN** admin mengunggah dua berkas berbeda yang kebetulan bernama sama dari perangkatnya
- **THEN** keduanya tersimpan sebagai berkas terpisah dan tidak ada yang tertimpa

#### Scenario: Berkas tersimpan di prefiks yang benar

- **WHEN** gambar pencapaian diunggah
- **THEN** berkas tersimpan di bawah prefiks folder untuk pencapaian, bukan di akar bucket
