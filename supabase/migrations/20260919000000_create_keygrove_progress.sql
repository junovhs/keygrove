-- One row of typing progress per Keygrove account (ACCT-02).
-- Shape and policy mirror cropasap_sizes / noceremony_workbooks: the client
-- owns the JSON (a SaveV6), the database owns the revision, and a stale write
-- is refused (PT409) rather than merged — the client pulls, merges and retries.
-- Table and function are prefixed keygrove_ because the project is shared
-- across Strange Systems apps.

create table public.keygrove_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null,
  revision bigint not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint keygrove_progress_state_is_object check (jsonb_typeof(state) = 'object'),
  constraint keygrove_progress_state_has_schema_version check (state ? 'schemaVersion')
);

comment on table public.keygrove_progress is 'Typing progress (trails, key model, stats, settings) for one Keygrove account, revisioned.';

alter table public.keygrove_progress enable row level security;
alter table public.keygrove_progress force row level security;

create policy "Keygrove users can read their own progress"
on public.keygrove_progress for select to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.keygrove_save_progress(expected_revision bigint, next_state jsonb)
returns public.keygrove_progress
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  saved public.keygrove_progress%rowtype;
begin
  if caller_id is null then
    raise exception using errcode = '42501', message = 'Authentication required.';
  end if;
  if expected_revision < 0 then
    raise exception using errcode = '22023', message = 'Expected revision cannot be negative.';
  end if;
  if next_state is null or jsonb_typeof(next_state) <> 'object' or not (next_state ? 'schemaVersion') then
    raise exception using errcode = '22023', message = 'Progress state must be an object with schemaVersion.';
  end if;

  if expected_revision = 0 then
    insert into public.keygrove_progress (user_id, state, revision)
    values (caller_id, next_state, 1)
    on conflict (user_id) do nothing
    returning * into saved;
  else
    update public.keygrove_progress
    set state = next_state, revision = revision + 1, updated_at = now()
    where user_id = caller_id and revision = expected_revision
    returning * into saved;
  end if;

  if saved.user_id is null then
    raise exception using errcode = 'PT409', message = 'Progress revision conflict.';
  end if;
  return saved;
end;
$$;

revoke all on table public.keygrove_progress from anon, authenticated;
grant select on table public.keygrove_progress to authenticated;
revoke all on function public.keygrove_save_progress(bigint, jsonb) from public, anon;
grant execute on function public.keygrove_save_progress(bigint, jsonb) to authenticated;
