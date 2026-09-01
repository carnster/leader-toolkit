-- Organization (multi-tenant) layer, v1.
-- Additive and inert until an organization exists: organization_id is nullable,
-- no rows are created, and every existing policy path is preserved verbatim.

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'),
  logo_url text,
  brand jsonb,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.organizations enable row level security;

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  invited_email text,
  role text not null default 'member' check (role in ('admin','member')),
  status text not null default 'pending' check (status in ('pending','approved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint org_member_identity check (user_id is not null or invited_email is not null)
);
create unique index if not exists org_member_user_uniq
  on public.organization_members (organization_id, user_id) where user_id is not null;
create unique index if not exists org_member_email_uniq
  on public.organization_members (organization_id, lower(invited_email))
  where invited_email is not null and user_id is null;
alter table public.organization_members enable row level security;

alter table public.initiatives
  add column if not exists organization_id uuid references public.organizations(id) on delete set null;
create index if not exists initiatives_org_idx on public.initiatives (organization_id) where organization_id is not null;

-- Membership helpers. SECURITY DEFINER like is_initiative_team_member, because
-- RLS policies evaluate them as the querying role. authenticated keeps EXECUTE
-- for that reason; anon does not need it and does not get it.
create or replace function public.is_org_member(_org uuid, _user uuid)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = _org and user_id = _user and status = 'approved'
  );
$$;
create or replace function public.is_org_admin(_org uuid, _user uuid)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = _org and user_id = _user and status = 'approved' and role = 'admin'
  );
$$;
revoke execute on function public.is_org_member(uuid, uuid) from anon;
revoke execute on function public.is_org_admin(uuid, uuid) from anon;

-- The creator of an organization is its first admin. Trigger runs as definer,
-- so it inserts past RLS; not callable through the API by anyone.
create or replace function public.org_creator_is_admin()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  insert into public.organization_members (organization_id, user_id, role, status)
  values (new.id, new.created_by, 'admin', 'approved');
  return new;
end $$;
drop trigger if exists org_creator_admin on public.organizations;
create trigger org_creator_admin after insert on public.organizations
  for each row execute function public.org_creator_is_admin();
revoke execute on function public.org_creator_is_admin() from anon, authenticated;

-- Mirrors link_team_invites: an admin invite by email becomes a live approved
-- membership the first time that email signs in. Invited rows always came from
-- an admin, so linking straight to approved is correct.
create or replace function public.link_org_invites()
returns integer language plpgsql security definer set search_path to 'public' as $$
declare n integer;
begin
  if auth.uid() is null then return 0; end if;
  update public.organization_members
  set user_id = auth.uid(), status = 'approved', updated_at = now()
  where user_id is null
    and invited_email is not null
    and lower(invited_email) = lower(coalesce(auth.email(), ''));
  get diagnostics n = row_count;
  return n;
end $$;
revoke execute on function public.link_org_invites() from anon;

-- Request-to-join by slug, as an RPC rather than a public SELECT on
-- organizations, so non-members can never browse the tenant list.
create or replace function public.request_to_join_org(_slug text)
returns text language plpgsql security definer set search_path to 'public' as $$
declare _org uuid;
begin
  if auth.uid() is null then return 'not signed in'; end if;
  select id into _org from public.organizations where slug = lower(trim(_slug));
  if _org is null then return 'not found'; end if;
  if exists (select 1 from public.organization_members where organization_id = _org and user_id = auth.uid()) then
    return 'already requested or member';
  end if;
  insert into public.organization_members (organization_id, user_id, role, status)
  values (_org, auth.uid(), 'member', 'pending');
  return 'requested';
end $$;
revoke execute on function public.request_to_join_org(text) from anon;

-- updated_at maintenance, same trigger function the rest of the schema uses.
drop trigger if exists set_updated_at on public.organizations;
create trigger set_updated_at before update on public.organizations
  for each row execute function public.handle_updated_at();
drop trigger if exists set_updated_at on public.organization_members;
create trigger set_updated_at before update on public.organization_members
  for each row execute function public.handle_updated_at();

-- Policies: organizations
drop policy if exists "Members and requesters can view their organization" on public.organizations;
create policy "Members and requesters can view their organization"
  on public.organizations for select
  using (
    created_by = auth.uid()
    or exists (
      select 1 from public.organization_members m
      where m.organization_id = id and m.user_id = auth.uid()
    )
  );
drop policy if exists "Signed-in users can create an organization" on public.organizations;
create policy "Signed-in users can create an organization"
  on public.organizations for insert
  with check (created_by = auth.uid());
drop policy if exists "Admins can update their organization" on public.organizations;
create policy "Admins can update their organization"
  on public.organizations for update
  using (is_org_admin(id, auth.uid()));
drop policy if exists "Admins can delete their organization" on public.organizations;
create policy "Admins can delete their organization"
  on public.organizations for delete
  using (is_org_admin(id, auth.uid()));

-- Policies: organization_members
drop policy if exists "Members see their org roster, requesters see their own row" on public.organization_members;
create policy "Members see their org roster, requesters see their own row"
  on public.organization_members for select
  using (user_id = auth.uid() or is_org_member(organization_id, auth.uid()));
drop policy if exists "Admins can invite members" on public.organization_members;
create policy "Admins can invite members"
  on public.organization_members for insert
  with check (is_org_admin(organization_id, auth.uid()));
drop policy if exists "Admins can manage members" on public.organization_members;
create policy "Admins can manage members"
  on public.organization_members for update
  using (is_org_admin(organization_id, auth.uid()))
  with check (is_org_admin(organization_id, auth.uid()));
drop policy if exists "Admins remove members, members remove themselves" on public.organization_members;
create policy "Admins remove members, members remove themselves"
  on public.organization_members for delete
  using (is_org_admin(organization_id, auth.uid()) or user_id = auth.uid());

-- Policies: initiatives. The SELECT arm gains org-admin visibility; the INSERT
-- arm refuses attaching an initiative to an org the creator is not an approved
-- member of. Owner-only UPDATE and DELETE are unchanged on purpose: org admins
-- get read visibility in v1, not write control.
drop policy if exists "Users can view initiatives they're involved in" on public.initiatives;
create policy "Users can view initiatives they're involved in"
  on public.initiatives for select
  using (
    auth.uid() = owner_id
    or is_initiative_team_member(id, auth.uid())
    or (organization_id is not null and is_org_admin(organization_id, auth.uid()))
  );
drop policy if exists "Users can create initiatives" on public.initiatives;
create policy "Users can create initiatives"
  on public.initiatives for insert
  with check (
    auth.uid() = owner_id
    and (organization_id is null or is_org_member(organization_id, auth.uid()))
  );
