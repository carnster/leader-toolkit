-- The owner UPDATE policy on initiatives had no WITH CHECK, so it validated
-- only the OLD row (owner_id = auth.uid()) and let an owner rewrite
-- organization_id to any value, injecting their initiative into another
-- tenant's dashboards and board rollups. Add a WITH CHECK mirroring the INSERT
-- policy's org predicate: organization_id may be null, an org the caller is a
-- member/admin of, or any org for a network leader. Unchanged org_id and
-- normal stage/mode updates still pass.
drop policy if exists "Initiative owners can update their initiatives" on public.initiatives;
create policy "Initiative owners can update their initiatives"
on public.initiatives
for update
using (auth.uid() = owner_id)
with check (
  auth.uid() = owner_id
  and (
    organization_id is null
    or is_org_member(organization_id, auth.uid())
    or is_org_admin_cascade(organization_id, auth.uid())
    or is_network_leader()
  )
);
