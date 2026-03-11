create table if not exists public.claims (
  claim_id text primary key,
  email text,
  domain text,
  eligibility_status text,
  risk_level text,
  claim_code text,
  match_level text,
  image_location text,
  geo_tagged boolean,
  policy_owner_name text,
  policy_bike_number text,
  policy_land_location text,
  fir_incident text,
  fir_bike_number text,
  fir_location text,
  admin_decision text,
  admin_notes text,
  policy_data jsonb,
  policy_text text,
  fir_data jsonb,
  image_analysis jsonb,
  evidence_risk jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.claims
  add column if not exists domain text,
  add column if not exists policy_data jsonb,
  add column if not exists policy_text text,
  add column if not exists fir_data jsonb,
  add column if not exists image_analysis jsonb,
  add column if not exists evidence_risk jsonb;

create index if not exists claims_email_created_at_idx
  on public.claims (email, created_at desc);

create index if not exists claims_created_at_idx
  on public.claims (created_at desc);
