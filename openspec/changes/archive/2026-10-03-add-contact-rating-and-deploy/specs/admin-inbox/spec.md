## REMOVED Requirements

### Requirement: Pesan dan rating belum memengaruhi halaman publik

Dihapus, bukan diubah. Isinya adalah pernyataan ruang lingkup milik change
sebelumnya — "change ini TIDAK menambahkan form kontak publik" — beserta
skenario yang menuntut halaman publik tidak memuat form apa pun. Change inilah
yang justru menambahkannya, sehingga requirement itu kini menyatakan kebalikan
dari yang benar dan tidak dapat diselamatkan lewat MODIFIED.

Penggantinya ada di bawah, dengan nama yang menggambarkan keadaan sesudahnya.

## ADDED Requirements

### Requirement: Pesan dan rating berasal dari kiriman pengunjung

Halaman publik SHALL memuat form kontak dan form rating, dan SHALL menampilkan rating yang sudah disetujui. Pesan dan rating yang dikelola di dashboard SHALL berasal dari kiriman pengunjung lewat form tersebut. Halaman publik SHALL TIDAK menampilkan isi pesan apa pun, maupun rating yang belum disetujui.

#### Scenario: Kiriman pengunjung muncul di dashboard

- **WHEN** pengunjung mengirim pesan lewat form kontak
- **THEN** pesan itu muncul di inbox admin sebagai belum dibaca dan ikut terhitung di halaman ringkasan

#### Scenario: Rating menunggu moderasi

- **WHEN** pengunjung mengirim rating
- **THEN** rating itu muncul di halaman moderasi sebagai menunggu persetujuan dan belum tampil di halaman publik

#### Scenario: Pesan tidak pernah tampil publik

- **WHEN** halaman publik mana pun dibuka
- **THEN** tidak ada isi pesan yang ditampilkan, dan rating yang belum disetujui juga tidak ditampilkan
