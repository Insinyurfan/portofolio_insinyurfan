alter table public.achievements
  add column certificate_category text,
  add column pdf_url text,
  add constraint achievements_certificate_category_valid
    check (
      certificate_category is null
      or char_length(btrim(certificate_category)) between 1 and 80
    );

update public.page_intros
set headline = 'Sertifikat'
where page = 'pencapaian' and lower(btrim(headline)) = 'pencapaian';
