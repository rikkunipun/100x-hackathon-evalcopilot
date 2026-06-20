-- Eval Co-pilot schema
-- Matches Move 4 domain model: features -> golden_cases / rubric / runs -> grades

-- 1. FEATURES
create table features (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id) not null,
  builder_name text not null,
  feature_name text not null,
  created_at timestamptz default now()
);

-- 2. GOLDEN_CASES
create table golden_cases (
  id uuid primary key default gen_random_uuid(),
  feature_id uuid references features(id) on delete cascade not null,
  query_text text not null,
  expected_output text not null,
  created_at timestamptz default now()
);

-- 3. RUBRIC
create table rubric (
  id uuid primary key default gen_random_uuid(),
  feature_id uuid references features(id) on delete cascade not null,
  rubric_text text not null,
  created_at timestamptz default now()
);

-- 4. RUNS
create table runs (
  id uuid primary key default gen_random_uuid(),
  feature_id uuid references features(id) on delete cascade not null,
  run_timestamp timestamptz default now(),
  config_notes text
);

-- 5. GRADES  (the load-bearing table: case_id + run_id together)
create table grades (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references golden_cases(id) on delete cascade not null,
  run_id uuid references runs(id) on delete cascade not null,
  actual_output text not null,
  pass_fail boolean not null,
  judge_notes text,
  created_at timestamptz default now()
);

-- ===== ROW LEVEL SECURITY =====

alter table features enable row level security;
alter table golden_cases enable row level security;
alter table rubric enable row level security;
alter table runs enable row level security;
alter table grades enable row level security;

-- features: owner only
create policy "features_owner_select" on features
  for select using (auth.uid() = owner_user_id);
create policy "features_owner_insert" on features
  for insert with check (auth.uid() = owner_user_id);
create policy "features_owner_update" on features
  for update using (auth.uid() = owner_user_id);
create policy "features_owner_delete" on features
  for delete using (auth.uid() = owner_user_id);

-- golden_cases: scoped via parent feature's owner
create policy "golden_cases_owner_select" on golden_cases
  for select using (
    exists (select 1 from features f where f.id = golden_cases.feature_id and f.owner_user_id = auth.uid())
  );
create policy "golden_cases_owner_insert" on golden_cases
  for insert with check (
    exists (select 1 from features f where f.id = golden_cases.feature_id and f.owner_user_id = auth.uid())
  );

-- rubric: scoped via parent feature's owner
create policy "rubric_owner_select" on rubric
  for select using (
    exists (select 1 from features f where f.id = rubric.feature_id and f.owner_user_id = auth.uid())
  );
create policy "rubric_owner_insert" on rubric
  for insert with check (
    exists (select 1 from features f where f.id = rubric.feature_id and f.owner_user_id = auth.uid())
  );

-- runs: scoped via parent feature's owner
create policy "runs_owner_select" on runs
  for select using (
    exists (select 1 from features f where f.id = runs.feature_id and f.owner_user_id = auth.uid())
  );
create policy "runs_owner_insert" on runs
  for insert with check (
    exists (select 1 from features f where f.id = runs.feature_id and f.owner_user_id = auth.uid())
  );

-- grades: scoped via the run's parent feature's owner
create policy "grades_owner_select" on grades
  for select using (
    exists (
      select 1 from runs r
      join features f on f.id = r.feature_id
      where r.id = grades.run_id and f.owner_user_id = auth.uid()
    )
  );
create policy "grades_owner_insert" on grades
  for insert with check (
    exists (
      select 1 from runs r
      join features f on f.id = r.feature_id
      where r.id = grades.run_id and f.owner_user_id = auth.uid()
    )
  );
