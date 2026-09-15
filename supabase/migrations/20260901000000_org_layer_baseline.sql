-- Organization (multi-tenant) layer baseline capture.
--
-- The org layer was originally applied to the database by manual paste and was
-- never committed to this migrations tree. This file reconstructs it from the
-- live definitions so the security surface is version-controlled and reviewable.
-- It is idempotent (IF NOT EXISTS / CREATE OR REPLACE / DROP POLICY IF EXISTS)
-- and is timestamped to run before the two later fix migrations
-- (20260901000001, 20260901000002), which re-assert the corrected forms.
--
-- Assumes earlier versioned migrations already provide: profiles, user_roles,
-- has_role(uuid, app_role), is_initiative_team_member(uuid, uuid), the
-- initiatives table, and the app_role enum values 'superadmin' and
-- 'district_leader'. Indexes present in production are not reproduced here;
-- this file captures the security surface, not performance tuning.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  logo_url text,
  brand jsonb,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  parent_id uuid references public.organizations(id) on delete set null,
  email_domain text,
  is_district boolean not null default false,
  constraint organizations_slug_key unique (slug),
  constraint organizations_slug_check check (slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$')
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid,
  invited_email text,
  role text not null default 'member' check (role in ('admin', 'member')),
  status text not null default 'pending' check (status in ('pending', 'approved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint org_member_identity check (user_id is not null or invited_email is not null),
  constraint organization_members_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade,
  constraint organization_members_user_id_profiles_fkey foreign key (user_id) references public.profiles(id) on delete cascade
);

-- ---------------------------------------------------------------------------
-- Helper functions (security definer). Tables above must exist first because
-- these SQL function bodies are validated at creation time.
-- ---------------------------------------------------------------------------
create or replace function public.is_org_member(_org uuid, _user uuid)
returns boolean language sql stable security definer set search_path to 'public' as $fn$
  select exists (select 1 from public.organization_members where organization_id=_org and user_id=_user and status='approved');
$fn$;

create or replace function public.is_org_admin(_org uuid, _user uuid)
returns boolean language sql stable security definer set search_path to 'public' as $fn$
  select exists (select 1 from public.organization_members where organization_id=_org and user_id=_user and status='approved' and role='admin');
$fn$;

create or replace function public.is_org_admin_cascade(_org uuid, _user uuid)
returns boolean language sql stable security definer set search_path to 'public' as $fn$
  select exists (
    select 1 from public.organizations o
    where o.id=_org and (public.is_org_admin(o.id,_user) or (o.parent_id is not null and public.is_org_admin(o.parent_id,_user)))
  );
$fn$;

create or replace function public.is_network_leader()
returns boolean language sql stable security definer set search_path to 'public' as $fn$
  select public.has_role(auth.uid(),'superadmin') or public.has_role(auth.uid(),'district_leader');
$fn$;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

-- organizations --------------------------------------------------------------
drop policy if exists "Members and requesters can view their organization" on public.organizations;
create policy "Members and requesters can view their organization" on public.organizations for select using (
  (created_by = auth.uid())
  or exists (select 1 from public.organization_members m where m.organization_id = organizations.id and m.user_id = auth.uid())
  or is_org_admin_cascade(id, auth.uid())
  or is_network_leader()
);

drop policy if exists "Network leaders can view organizations" on public.organizations;
create policy "Network leaders can view organizations" on public.organizations for select using (has_role(auth.uid(), 'district_leader'::app_role));

drop policy if exists "Signed-in users can create an organization" on public.organizations;
create policy "Signed-in users can create an organization" on public.organizations for insert with check (
  (created_by = auth.uid()) and ((parent_id is null) or is_org_admin(parent_id, auth.uid()) or is_network_leader())
);

drop policy if exists "Admins can update their organization" on public.organizations;
create policy "Admins can update their organization" on public.organizations for update using (is_org_admin_cascade(id, auth.uid()) or is_network_leader());

drop policy if exists "Network leaders manage organizations" on public.organizations;
create policy "Network leaders manage organizations" on public.organizations for update using (has_role(auth.uid(), 'district_leader'::app_role)) with check (has_role(auth.uid(), 'district_leader'::app_role));

drop policy if exists "Admins can delete their organization" on public.organizations;
create policy "Admins can delete their organization" on public.organizations for delete using (is_org_admin_cascade(id, auth.uid()) or is_network_leader());

drop policy if exists "Network leaders delete organizations" on public.organizations;
create policy "Network leaders delete organizations" on public.organizations for delete using (has_role(auth.uid(), 'district_leader'::app_role));

-- organization_members -------------------------------------------------------
drop policy if exists "Members see their org roster, requesters see their own row" on public.organization_members;
create policy "Members see their org roster, requesters see their own row" on public.organization_members for select using (
  (user_id = auth.uid()) or is_org_member(organization_id, auth.uid()) or is_org_admin_cascade(organization_id, auth.uid()) or is_network_leader()
);

drop policy if exists "Network leaders can view org rosters" on public.organization_members;
create policy "Network leaders can view org rosters" on public.organization_members for select using (has_role(auth.uid(), 'district_leader'::app_role));

drop policy if exists "Admins can invite members" on public.organization_members;
create policy "Admins can invite members" on public.organization_members for insert with check (is_org_admin_cascade(organization_id, auth.uid()) or is_network_leader());

drop policy if exists "Network leaders add org members" on public.organization_members;
create policy "Network leaders add org members" on public.organization_members for insert with check (has_role(auth.uid(), 'district_leader'::app_role));

drop policy if exists "Admins can manage members" on public.organization_members;
create policy "Admins can manage members" on public.organization_members for update using (is_org_admin_cascade(organization_id, auth.uid()) or is_network_leader()) with check (is_org_admin_cascade(organization_id, auth.uid()) or is_network_leader());

drop policy if exists "Network leaders manage org members" on public.organization_members;
create policy "Network leaders manage org members" on public.organization_members for update using (has_role(auth.uid(), 'district_leader'::app_role)) with check (has_role(auth.uid(), 'district_leader'::app_role));

drop policy if exists "Admins remove members, members remove themselves" on public.organization_members;
create policy "Admins remove members, members remove themselves" on public.organization_members for delete using (is_org_admin_cascade(organization_id, auth.uid()) or is_network_leader() or (user_id = auth.uid()));

drop policy if exists "Network leaders remove org members" on public.organization_members;
create policy "Network leaders remove org members" on public.organization_members for delete using (has_role(auth.uid(), 'district_leader'::app_role));

-- ---------------------------------------------------------------------------
-- initiatives: org-aware policies (replace the owner-only base policies). The
-- owner UPDATE carries the WITH CHECK that constrains organization_id; the
-- 20260901000002 migration re-asserts the same corrected form.
-- ---------------------------------------------------------------------------
drop policy if exists "Users can view initiatives they're involved in" on public.initiatives;
create policy "Users can view initiatives they're involved in" on public.initiatives for select using (
  (auth.uid() = owner_id) or is_initiative_team_member(id, auth.uid())
  or ((organization_id is not null) and is_org_admin_cascade(organization_id, auth.uid()))
  or is_network_leader()
);

drop policy if exists "Network leaders can view initiatives" on public.initiatives;
create policy "Network leaders can view initiatives" on public.initiatives for select using (has_role(auth.uid(), 'district_leader'::app_role));

drop policy if exists "Users can create initiatives" on public.initiatives;
create policy "Users can create initiatives" on public.initiatives for insert with check (
  (auth.uid() = owner_id) and ((organization_id is null) or is_org_member(organization_id, auth.uid()) or is_org_admin_cascade(organization_id, auth.uid()) or is_network_leader())
);

drop policy if exists "Initiative owners can update their initiatives" on public.initiatives;
create policy "Initiative owners can update their initiatives" on public.initiatives for update using (auth.uid() = owner_id) with check (
  (auth.uid() = owner_id) and ((organization_id is null) or is_org_member(organization_id, auth.uid()) or is_org_admin_cascade(organization_id, auth.uid()) or is_network_leader())
);

drop policy if exists "Network and school admins can update initiatives" on public.initiatives;
create policy "Network and school admins can update initiatives" on public.initiatives for update using (is_network_leader() or ((organization_id is not null) and is_org_admin_cascade(organization_id, auth.uid())));

drop policy if exists "Initiative owners can delete their initiatives" on public.initiatives;
create policy "Initiative owners can delete their initiatives" on public.initiatives for delete using (auth.uid() = owner_id);

drop policy if exists "Network and school admins can delete initiatives" on public.initiatives;
create policy "Network and school admins can delete initiatives" on public.initiatives for delete using (is_network_leader() or ((organization_id is not null) and is_org_admin_cascade(organization_id, auth.uid())));
