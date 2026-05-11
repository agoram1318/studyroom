-- 피드백 자료 유형 (pdf | image | link). 기존 DB 호환을 위해 nullable.
alter table public.materials
  add column if not exists material_type text;

comment on column public.materials.material_type is '자료 유형: pdf, image, link';
