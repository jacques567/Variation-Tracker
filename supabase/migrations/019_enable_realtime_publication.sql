-- Enable Supabase Realtime for the tables the app subscribes to.
--
-- Postgres only streams row changes for tables that are members of a publication.
-- The `supabase_realtime` publication existed on this project but contained ZERO
-- tables, so every postgres_changes subscription in the app connected successfully
-- and then silently received nothing — see the variations/jobs/signatures channels
-- in src/components/admin/AdminDashboard.tsx, which have never fired an event.
--
-- Security note: adding a table here does NOT bypass RLS. Realtime evaluates each
-- table's SELECT policies against the subscriber's own JWT before delivering a row.
-- None of these three tables grant SELECT to anon (the public sign page reads via
-- the SECURITY DEFINER get_variation_by_token() function instead), so anonymous
-- clients receive nothing and contractors only receive rows for their own jobs.
--
-- Replica identity is left at the default (primary key). INSERT/UPDATE payloads
-- carry the full new row; DELETE payloads carry only the primary key, which is all
-- the existing subscribers use.

do $$
declare
  t text;
begin
  foreach t in array array['variations', 'jobs', 'signatures']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
