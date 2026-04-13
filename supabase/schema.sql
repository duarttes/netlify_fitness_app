create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz default now()
);

create table if not exists daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  kcal_goal int default 2200,
  protein_goal int default 200,
  carb_goal int default 220,
  fat_goal int default 65,
  unique(user_id, log_date)
);

create table if not exists meal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  meal_slot text not null,
  food_name text not null,
  quantity_g numeric(8,2),
  calories numeric(8,2),
  protein_g numeric(8,2),
  carbs_g numeric(8,2),
  fat_g numeric(8,2),
  created_at timestamptz default now()
);

create table if not exists supplement_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  supplement_name text not null,
  linked_meal_slot text,
  checked_at timestamptz default now()
);

create table if not exists workout_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  workout_name text not null,
  notes text,
  created_at timestamptz default now()
);

create table if not exists cardio_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  activity_name text not null,
  duration_min int,
  calories_burned int,
  created_at timestamptz default now()
);

alter table profiles enable row level security;
alter table daily_logs enable row level security;
alter table meal_entries enable row level security;
alter table supplement_entries enable row level security;
alter table workout_entries enable row level security;
alter table cardio_entries enable row level security;

create policy "profiles own" on profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "daily own" on daily_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "meals own" on meal_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "supplements own" on supplement_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "workouts own" on workout_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "cardio own" on cardio_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
