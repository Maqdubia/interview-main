-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Resumes
create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  filename text not null,
  raw_text text not null,
  target_role text,
  ats_score int,
  matched_keywords jsonb default '[]'::jsonb,
  missing_keywords jsonb default '[]'::jsonb,
  suggestions jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);
alter table public.resumes enable row level security;
create policy "resumes_all_own" on public.resumes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Interviews
create table public.interviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  difficulty text not null default 'medium',
  overall_score int,
  content_score int,
  clarity_score int,
  confidence_score int,
  summary text,
  created_at timestamptz default now()
);
alter table public.interviews enable row level security;
create policy "interviews_all_own" on public.interviews for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Answers
create table public.answers (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null references public.interviews(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  question text not null,
  question_index int not null,
  transcript text,
  content_score int,
  clarity_score int,
  confidence_score int,
  feedback text,
  created_at timestamptz default now()
);
alter table public.answers enable row level security;
create policy "answers_all_own" on public.answers for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index on public.resumes(user_id, created_at desc);
create index on public.interviews(user_id, created_at desc);
create index on public.answers(interview_id, question_index);
