-- Security hardening, October 2026 audit. Shared by the RSF Toolkit and the
-- IMPACT Companion, which share this schema.

-- 1. Membership could be forged. Anyone can create an organization and become
--    its admin, and the admin INSERT policy let that admin add ANY user_id as an
--    approved member, which then exposed the victim's profile to read and edit.
--    The app only ever invites by email with user_id null, so require exactly that.
drop policy if exists "Admins can invite members" on public.organization_members;
create policy "Admins can invite members" on public.organization_members
  for insert to authenticated
  with check (
    public.is_network_leader()
    or (public.is_org_admin_cascade(organization_id, auth.uid())
        and user_id is null
        and invited_email is not null)
  );

-- ...and stop an admin re-pointing an existing row at someone else, or moving a
-- member row into another organization. The one legitimate identity change is
-- link_org_invites claiming an email invite for the signed-in user.
create or replace function public.protect_member_identity()
returns trigger language plpgsql security definer set search_path to 'public' as $fn$
begin
  if auth.uid() is null or public.is_network_leader() then
    return new;
  end if;
  if new.organization_id is distinct from old.organization_id then
    raise exception 'A membership cannot be moved to another organization.';
  end if;
  if new.user_id is distinct from old.user_id
     and not (old.user_id is null and new.user_id = auth.uid()) then
    raise exception 'Members join by accepting an invite.';
  end if;
  return new;
end $fn$;

drop trigger if exists protect_member_identity on public.organization_members;
create trigger protect_member_identity
  before update on public.organization_members
  for each row execute function public.protect_member_identity();

-- 2. Email-based auto-join is only as trustworthy as the email. Require a
--    confirmed address before an invite or domain match grants membership.
create or replace function public.link_org_invites()
returns integer language plpgsql security definer set search_path to 'public' as $fn$
declare n integer; d integer;
begin
  if auth.uid() is null then return 0; end if;
  if (select email_confirmed_at from auth.users where id = auth.uid()) is null then
    return 0;
  end if;

  update public.organization_members
     set user_id = auth.uid(), status = 'approved', updated_at = now()
   where user_id is null
     and invited_email is not null
     and lower(invited_email) = lower(coalesce(auth.email(), ''));
  get diagnostics n = row_count;

  insert into public.organization_members (organization_id, user_id, role, status)
  select o.id, auth.uid(), 'member', 'approved'
    from public.organizations o
   where o.email_domain is not null
     and lower(o.email_domain) = lower(split_part(coalesce(auth.email(), ''), '@', 2))
     and not exists (select 1 from public.organization_members m
                      where m.organization_id = o.id and m.user_id = auth.uid());
  get diagnostics d = row_count;
  return n + d;
end $fn$;

-- 3. Other people's AI Copilot conversations and notifications were readable by
--    anyone who could view the initiative. The Copilot history list has no user
--    filter, so teammates' conversation titles appeared in your own history.
--    The own-row policies remain.
drop policy if exists "Initiative viewers can read" on public.ai_conversations;
drop policy if exists "Initiative viewers can read" on public.notifications;

-- 4. Yes/no helper predicates were executable by anyone, signed in or not, which
--    let an anonymous caller probe who holds which role. RLS only needs them for
--    signed-in users. (Granted to PUBLIC by default, so revoke from PUBLIC too.)
do $$
declare f regprocedure;
begin
  for f in
    select p.oid::regprocedure
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname in ('has_role','is_org_member','is_org_admin','is_org_admin_cascade',
                         'is_initiative_team_member','can_view_initiative','is_network_leader',
                         'can_view_school_audits','can_manage_school_audits')
  loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated, service_role', f);
  end loop;
end $$;

-- 5. A public bucket that accepts SVG will serve script-bearing SVGs from the
--    storage origin. No SVG logos exist, so drop the type.
update storage.buckets
   set allowed_mime_types = array['image/png','image/jpeg','image/webp']
 where id = 'org-logos';
