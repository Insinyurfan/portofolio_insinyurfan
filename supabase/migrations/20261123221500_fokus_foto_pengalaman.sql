alter table public.experiences
  add column gallery_focus jsonb not null default '{}'::jsonb,
  add constraint experiences_gallery_focus_object
    check (jsonb_typeof(gallery_focus) = 'object');
