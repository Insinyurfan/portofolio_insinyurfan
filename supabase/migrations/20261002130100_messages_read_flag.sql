-- Penanda sudah dibaca pada tabel messages.
--
-- Change sebelumnya membuat tabel ini tetapi hanya menyebutnya "pesan dari
-- form kontak" tanpa menetapkan penanda dibaca, sehingga hitungan "pesan
-- belum dibaca" di halaman ringkasan admin tidak punya dasar.
--
-- Kolom lain (sender_name, sender_email, subject, body) sudah ada dari
-- migrasi 20261002120500 beserta constraint NOT NULL dan not-blank-nya.

alter table public.messages
  add column if not exists is_read boolean not null default false;

comment on column public.messages.is_read is
  'False untuk pesan yang baru masuk. Hanya pengguna terautentikasi yang boleh mengubahnya.';

-- Hitungan "belum dibaca" adalah query yang paling sering dijalankan
-- dashboard, jadi indeksnya dipersempit ke baris yang relevan saja.
create index if not exists messages_unread_idx
  on public.messages (created_at desc, id)
  where not is_read;
