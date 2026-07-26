-- get_variation_by_token() previously excluded expired, unsigned variations entirely,
-- which sent clients to a raw 404 instead of the "Link expired" page the sign page
-- already implements. Drop the expiry condition so the row is always returned (still
-- scoped to only the public-safe columns) and let the page's own isTokenExpired check
-- decide which state to render.

create or replace function public.get_variation_by_token(p_token uuid)
returns table(
  id uuid,
  description text,
  cost integer,
  date date,
  photo_url text,
  status text,
  signature_token_expires_at timestamptz,
  job_name text,
  client_name text,
  address text,
  signer_name text,
  signed_at timestamptz
)
language plpgsql
security definer
as $$
begin
  return query
  select
    v.id,
    v.description,
    v.cost,
    v.date,
    v.photo_url,
    v.status,
    v.signature_token_expires_at,
    j.job_name,
    j.client_name,
    j.address,
    s.client_name as signer_name,
    s.signed_at
  from public.variations v
  join public.jobs j on j.id = v.job_id
  left join public.signatures s on s.variation_id = v.id
  where v.signature_token = p_token;
end;
$$;
