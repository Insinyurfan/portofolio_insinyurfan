alter table public.education
  alter column gpa type numeric(5, 2),
  drop constraint education_gpa_range,
  add constraint education_gpa_range check (gpa is null or gpa between 0 and 100);
