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

create table if not exists meal_slots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  is_default boolean default false,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists food_catalog (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  aliases text[] default '{}',
  unit_weight_g numeric(8,2),
  calories_100g numeric(8,2),
  protein_100g numeric(8,2),
  carbs_100g numeric(8,2),
  fat_100g numeric(8,2),
  created_at timestamptz default now()
);

create table if not exists meal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  meal_slot_id uuid references meal_slots(id) on delete set null,
  meal_slot_name text not null,
  food_name text not null,
  quantity_g numeric(8,2),
  calories numeric(8,2),
  protein_g numeric(8,2),
  carbs_g numeric(8,2),
  fat_g numeric(8,2),
  source text default 'manual',
  created_at timestamptz default now()
);

alter table profiles enable row level security;
alter table daily_logs enable row level security;
alter table meal_slots enable row level security;
alter table meal_entries enable row level security;

drop policy if exists "profiles own" on profiles;
drop policy if exists "daily own" on daily_logs;
drop policy if exists "meal slots own" on meal_slots;
drop policy if exists "meals own" on meal_entries;

create policy "profiles own" on profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "daily own" on daily_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "meal slots own" on meal_slots for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "meals own" on meal_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into food_catalog (name, aliases, unit_weight_g, calories_100g, protein_100g, carbs_100g, fat_100g)
values
('Ovo cozido', array['ovo','ovos','ovo cozido'], 50, 155, 13, 1.1, 11),
('Banana', array['banana','banana media','banana média'], 100, 89, 1.1, 22.8, 0.3),
('Arroz branco cozido', array['arroz','arroz branco'], null, 130, 2.5, 28, 0.3),
('Feijão carioca cozido', array['feijao','feijão'], null, 76, 4.8, 13.6, 0.5),
('Frango grelhado', array['frango','peito de frango'], null, 165, 31, 0, 3.6),
('Patinho moído', array['patinho','carne moida','carne moída'], null, 219, 26, 0, 12),
('Aveia em flocos', array['aveia'], null, 394, 13.9, 66.6, 8.5),
('Whey concentrado', array['whey'], null, 400, 80, 10, 7),
('Batata-doce cozida', array['batata doce','batata-doce'], null, 77, 0.6, 18.4, 0.1),
('Brócolis cozido', array['brocolis','brócolis'], null, 35, 2.4, 7.2, 0.4)
on conflict do nothing;
