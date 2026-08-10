-- GoodStart / Supabase initial schema
-- Run in the Supabase SQL Editor as a project administrator.
-- All health and diet data remain private by default. Application access is
-- performed through the authenticated server API until LINE authentication and
-- cohort-aware RLS policies are enabled.

create table if not exists public.cohorts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  starts_at date,
  ends_at date,
  status text not null default 'draft' check (status in ('draft', 'active', 'completed')),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  line_subject text not null unique,
  display_name text not null,
  department text,
  role text not null default 'member' check (role in ('member', 'manager')),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references public.cohorts(id) on delete restrict,
  user_id uuid not null references public.app_users(id) on delete restrict,
  leaderboard_opt_in boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  unique (cohort_id, user_id)
);

create table if not exists public.activation_codes (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references public.cohorts(id) on delete restrict,
  code_hash text not null unique,
  used_by_user_id uuid references public.app_users(id) on delete set null,
  used_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.consents (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.memberships(id) on delete restrict,
  ai_food_image_consent boolean not null,
  research_consent boolean not null,
  version text not null,
  withdrawn_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.meal_records (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.memberships(id) on delete restrict,
  meal_date date not null,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  source text not null check (source in ('photo', 'ai_photo', 'food_selector', 'manual')),
  status text not null check (status in ('draft', 'ai_draft', 'confirmed')),
  visibility text not null default 'private' check (visibility in ('private', 'cohort')),
  protein_min_g numeric(6,1),
  protein_max_g numeric(6,1),
  image_object_key text,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.memberships(id) on delete restrict,
  measured_at date not null,
  instrument text not null default 'ACCUNIQ BC380',
  weight_kg numeric(5,2) not null,
  bmi numeric(4,1) not null,
  waist_cm numeric(5,1) not null,
  waist_hip_ratio numeric(4,2) not null,
  skeletal_muscle_kg numeric(5,2) not null,
  body_fat_kg numeric(5,2) not null,
  body_fat_percent numeric(4,1) not null,
  override_reason text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.lifestyle_reviews (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.memberships(id) on delete restrict,
  week_number integer not null check (week_number between 1 and 8),
  sleep_quality integer not null check (sleep_quality between 1 and 5),
  exercise_days integer not null check (exercise_days between 0 and 7),
  exercise_minutes integer not null check (exercise_minutes >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  unique (membership_id, week_number)
);

create table if not exists public.weekly_summaries (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.memberships(id) on delete restrict,
  week_number integer not null check (week_number between 1 and 8),
  affirmation text not null,
  priority text not null,
  next_action text not null,
  author_user_id uuid not null references public.app_users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  unique (membership_id, week_number)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references public.cohorts(id) on delete restrict,
  actor_user_id uuid not null references public.app_users(id) on delete restrict,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  before_json jsonb not null,
  after_json jsonb not null,
  reason text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_memberships_cohort on public.memberships(cohort_id);
create index if not exists idx_meals_member_date on public.meal_records(membership_id, meal_date);
create index if not exists idx_meals_cohort_visibility on public.meal_records(visibility) where deleted_at is null;
create index if not exists idx_measurements_member_time on public.body_measurements(membership_id, measured_at);
create index if not exists idx_audit_cohort_time on public.audit_logs(cohort_id, created_at desc);

-- Private image storage; images must be accessed by signed URLs only.
insert into storage.buckets (id, name, public)
values ('meal-images', 'meal-images', false)
on conflict (id) do update set public = false;

alter table public.cohorts enable row level security;
alter table public.app_users enable row level security;
alter table public.memberships enable row level security;
alter table public.activation_codes enable row level security;
alter table public.consents enable row level security;
alter table public.meal_records enable row level security;
alter table public.body_measurements enable row level security;
alter table public.lifestyle_reviews enable row level security;
alter table public.weekly_summaries enable row level security;
alter table public.audit_logs enable row level security;

-- No browser policies are created yet. This intentionally denies direct access
-- to all health data until LINE authentication and cohort-scoped policies are
-- deployed. The service-role key may be used only by server-side API routes.
