-- Reads and writes disagreed on every initiative child table. Reading used
-- can_view_initiative() (owner, team member, org admin, district_leader,
-- superadmin) while writing required owner or team membership only. The result:
-- a network or school admin could open another school's initiative, see all of
-- it, and then fail to save anything. The decision brief error was the symptom
-- that surfaced; RLS denies silently, so it read as a bug rather than a
-- permission.
--
-- These policies are permissive and therefore additive: the existing owner and
-- team policies are untouched. Write is granted only to accounts that could
-- already read, so an unrelated member of another school gains nothing.
--
-- Deliberately NOT included, because they are personal or mint public access:
-- notifications, ai_conversations, ai_messages, pulse_checkins, pulse_links,
-- share_links.
do $$
declare t text;
begin
  foreach t in array array[
    'active_ingredients','adaptation_requests','budget_items','calendar_feeds',
    'coaching_cycles','commitments','communication_activities','decision_briefs',
    'fidelity_checklists','fidelity_logs','implementation_risks','implementation_strategies',
    'indicators','initiative_team_members','observation_schedules','pd_activities',
    'pdsa_cycles','sustainability_plans','team_meetings','time_commitments','timeline_milestones'
  ]
  loop
    execute format('drop policy if exists "Initiative viewers can write" on public.%I', t);
    execute format(
      'create policy "Initiative viewers can write" on public.%I
         for all to authenticated
         using (public.can_view_initiative(initiative_id, auth.uid()))
         with check (public.can_view_initiative(initiative_id, auth.uid()))', t);
  end loop;
end $$;

-- indicator_values hangs off indicators rather than initiatives directly, and
-- could not even be READ by a viewer for the same reason.
drop policy if exists "Initiative viewers can write" on public.indicator_values;
create policy "Initiative viewers can write" on public.indicator_values
  for all to authenticated
  using (exists (
    select 1 from public.indicators i
    where i.id = indicator_values.indicator_id
      and public.can_view_initiative(i.initiative_id, auth.uid())
  ))
  with check (exists (
    select 1 from public.indicators i
    where i.id = indicator_values.indicator_id
      and public.can_view_initiative(i.initiative_id, auth.uid())
  ));

drop policy if exists "Initiative viewers can read values" on public.indicator_values;
create policy "Initiative viewers can read values" on public.indicator_values
  for select to authenticated
  using (exists (
    select 1 from public.indicators i
    where i.id = indicator_values.indicator_id
      and public.can_view_initiative(i.initiative_id, auth.uid())
  ));
