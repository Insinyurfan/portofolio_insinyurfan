-- Cabut hak eksekusi fungsi pengurutan dari role anon.
--
-- MENGAPA MIGRASI INI ADA:
-- Supabase memasang ALTER DEFAULT PRIVILEGES yang otomatis memberi EXECUTE
-- kepada anon, authenticated, dan service_role untuk SETIAP fungsi baru yang
-- dibuat di schema public. Akibatnya `revoke all ... from public` di migrasi
-- sebelumnya tidak cukup: itu hanya mencabut hak milik PUBLIC, sementara anon
-- mendapat grant eksplisit atas namanya sendiri.
--
-- Ini terdeteksi oleh supabase/tests/admin_checks.sql, bukan oleh pembacaan
-- kode — assertion "role anon tidak dapat memanggil swap_sort_order" gagal.
--
-- Catatan untuk fungsi yang ditambahkan kemudian: setiap fungsi baru di schema
-- public akan mewarisi masalah yang sama. Cabut secara eksplisit dari anon,
-- kecuali fungsi itu memang ditujukan untuk dipanggil pengunjung.

revoke execute on function public.swap_sort_order(text, uuid, integer) from anon;

-- set_updated_at hanya dipanggil sebagai trigger, tidak pernah lewat API.
revoke execute on function public.set_updated_at() from anon;
