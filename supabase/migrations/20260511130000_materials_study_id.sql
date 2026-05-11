-- study_id: 전회차 자료 식별 (lesson_id가 null이면 스터디 공통 자료)
alter table public.materials
  add column if not exists study_id uuid references public.studies(id) on delete cascade;

-- description: 자료 설명 (선택)
alter table public.materials
  add column if not exists description text;

comment on column public.materials.study_id is '스터디 ID. lesson_id가 null이면 전회차 공통 자료, lesson_id가 있으면 회차별 자료.';
comment on column public.materials.description is '자료 설명 (선택 입력)';
