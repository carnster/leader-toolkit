-- RLS review, October 3 2026. Shared by the RSF Toolkit and the IMPACT Companion.

-- 1. Any signed-in user could create an organization that already claims an
--    email domain (protect_email_domain only fired on UPDATE). Everyone with
--    that domain was then auto-joined to it at next sign-in, and the creator,
--    as its admin, could read and edit their profiles and receive the
--    initiatives they started there. Check inserts as well as updates.
create or replace function public.protect_email_domain()
returns trigger language plpgsql security definer set search_path to 'public' as $fn$
begin
  if auth.uid() is not null
     and not public.has_role(auth.uid(), 'district_leader')
     and (case when tg_op = 'INSERT' then new.email_domain is not null
               else new.email_domain is distinct from old.email_domain end) then
    raise exception 'Only the network administrator can set a school''s email domain.';
  end if;
  return new;
end $fn$;

drop trigger if exists protect_email_domain on public.organizations;
create trigger protect_email_domain
  before insert or update on public.organizations
  for each row execute function public.protect_email_domain();

-- 2. The INSERT policy only lets an admin of the parent create a school under
--    it, but UPDATE had no such check: anyone could create an organization and
--    then re-parent it under a real school or district. Apply the same rule to
--    any change of parent. Leaving a parent (setting it null) stays allowed.
create or replace function public.protect_org_parent()
returns trigger language plpgsql security definer set search_path to 'public' as $fn$
begin
  if auth.uid() is not null
     and new.parent_id is not null
     and (tg_op = 'INSERT' or new.parent_id is distinct from old.parent_id)
     and not (public.is_network_leader() or public.is_org_admin(new.parent_id, auth.uid())) then
    raise exception 'Only an admin of the district can place a school inside it.';
  end if;
  return new;
end $fn$;

drop trigger if exists protect_org_parent on public.organizations;
create trigger protect_org_parent
  before insert or update on public.organizations
  for each row execute function public.protect_org_parent();

-- 3. Team invites, like org invites, should only be claimed by a confirmed
--    email address.
create or replace function public.link_team_invites()
returns integer language plpgsql security definer set search_path to 'public' as $fn$
declare n integer;
begin
  if auth.uid() is null then return 0; end if;
  if (select email_confirmed_at from auth.users where id = auth.uid()) is null then
    return 0;
  end if;
  update public.initiative_team_members
     set user_id = auth.uid()
   where user_id is null
     and invited_email is not null
     and lower(invited_email) = lower(coalesce(auth.email(), ''));
  get diagnostics n = row_count;
  return n;
end $fn$;

-- 4. Signed-in-only functions (and trigger functions) were still callable
--    without signing in. None leaked data, but none needs to be public.
do $$
declare f regprocedure;
begin
  for f in
    select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname in ('link_org_invites','link_team_invites','network_directory','request_to_join_org',
                         'protect_member_identity','protect_email_domain','protect_org_parent',
                         'reseat_missing_active_ingredients')
  loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated, service_role', f);
  end loop;
end $$;

-- 5. New-account metadata could stamp a "superadmin" or "district_leader"
--    label on the profile. Permissions come from user_roles, so this was a
--    label only, but it displayed as a title. Power labels are assigned by the
--    network administrator, never at sign-up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path to 'public' as $fn$
declare r public.app_role;
begin
  begin
    r := coalesce((new.raw_user_meta_data->>'role')::public.app_role, 'teacher');
  exception when others then
    r := 'teacher';
  end;
  if r::text in ('superadmin', 'district_leader') then
    r := 'teacher';
  end if;
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', 'New User'), r);
  return new;
end $fn$;

-- 6. IMPACT only: one organization per email domain, as RSF already enforces,
--    so a second organization cannot share a school's domain.
create unique index if not exists organizations_email_domain_uniq
  on public.organizations (lower(email_domain)) where email_domain is not null;
