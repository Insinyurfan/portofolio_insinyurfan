-- Fondasi: fungsi trigger updated_at dan tipe enum tertutup.
--
-- Nilai enum ditulis dalam bahasa Inggris dan netral bahasa; label bahasa
-- Indonesia dipetakan di lapisan tampilan (src/shared/format.ts). Itu yang membuat
-- syarat "tidak ada nilai enum mentah yang tampil" bisa diperiksa, dan
-- membuat pemetaan labelnya exhaustive terhadap enum di TypeScript.

-- Memperbarui updated_at di database, supaya pemanggil tidak perlu
-- mengirimkannya dan tidak bisa lupa mengirimkannya.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Trigger BEFORE UPDATE: menyetel updated_at ke waktu sekarang.';

create type public.experience_type as enum (
  'work',
  'internship',
  'organization',
  'freelance'
);

create type public.achievement_category as enum (
  'certificate',
  'award'
);
