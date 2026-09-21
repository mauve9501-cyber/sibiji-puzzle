-- Sibiji puzzle play counting schema (Supabase)
-- Run in Supabase Dashboard -> SQL Editor. Counting is done only via the
-- SECURITY DEFINER RPCs below, so the anon/publishable key stays safe.

create table if not exists public.puzzle_plays (
  id          bigint generated always as identity primary key,
  animal      text,
  difficulty  text,
  played_at   timestamptz not null default now()
);

alter table public.puzzle_plays enable row level security;

create or replace function public.record_play(p_animal text, p_difficulty text)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare total bigint;
begin
  insert into public.puzzle_plays(animal, difficulty)
  values (left(coalesce(p_animal,''), 20), left(coalesce(p_difficulty,''), 20));
  select count(*) into total from public.puzzle_plays;
  return total;
end;
$$;

create or replace function public.get_play_count()
returns bigint
language sql
security definer
set search_path = public
as $$ select count(*) from public.puzzle_plays; $$;

grant execute on function public.record_play(text, text) to anon;
grant execute on function public.get_play_count() to anon;

create or replace view public.play_stats as
  select animal, count(*) as plays
  from public.puzzle_plays group by animal order by plays desc;
