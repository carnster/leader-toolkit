-- The member-view policy on organizations correlated
-- organization_members.organization_id to the membership row's own id (m.id)
-- instead of the organizations row, so the EXISTS was always false and a plain
-- member (not creator, admin, or network leader) could not read their own
-- organization. Fix the correlation.
drop policy if exists "Members and requesters can view their organization" on public.organizations;
create policy "Members and requesters can view their organization"
on public.organizations
for select
using (
  (created_by = auth.uid())
  or exists (
    select 1 from public.organization_members m
    where m.organization_id = organizations.id and m.user_id = auth.uid()
  )
  or is_org_admin_cascade(id, auth.uid())
  or is_network_leader()
);
