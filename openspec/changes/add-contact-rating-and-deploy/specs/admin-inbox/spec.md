## MODIFIED Requirements

### Requirement: Pesan dan rating belum memengaruhi halaman publik

Halaman publik kini SHALL memuat form kontak dan form rating, dan SHALL menampilkan rating yang sudah disetujui. Pesan dan rating yang dikelola di dashboard SHALL berasal dari kiriman pengunjung lewat form tersebut. Halaman publik SHALL tetap tidak menampilkan pesan apa pun maupun rating yang belum disetujui.

#### Scenario: Kiriman pengunjung muncul di dashboard

- **WHEN** pengunjung mengirim pesan lewat form kontak
- **THEN** pesan itu muncul di inbox admin sebagai belum dibaca dan ikut terhitung di halaman ringkasan

#### Scenario: Rating menunggu moderasi

- **WHEN** pengunjung mengirim rating
- **THEN** rating itu muncul di halaman moderasi sebagai menunggu persetujuan dan belum tampil di halaman publik

#### Scenario: Pesan tidak pernah tampil publik

- **WHEN** halaman publik mana pun dibuka
- **THEN** tidak ada isi pesan yang ditampilkan, dan rating yang belum disetujui juga tidak ditampilkan
