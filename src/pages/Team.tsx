import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Users, Plus, CheckCircle2, AlertCircle, MessageCircle, Handshake, RefreshCw, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useInitiativeContext } from "@/hooks/useInitiativeContext";
import { useInitiatives } from "@/hooks/useInitiatives";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { TeamMemberDialog } from "@/components/TeamMemberDialog";
import { MeetingLog } from "@/components/MeetingLog";
import { MeetingBrief } from "@/components/MeetingBrief";
import { CalendarTaskExport } from "@/components/CalendarTaskExport";
import { QueryErrorState } from "@/components/QueryErrorState";

// Sentences to nudge a leader toward filling a specific missing seat. Keyed
// by COMPOSITION_ROLES[].key; roles without a tailored line (e.g. "leader")
// fall back to a generic prompt.
const MISSING_ROLE_MESSAGES: Record<string, string> = {
  lead: "No one is named as the lead yet. Every initiative needs one person who owns it.",
  implementers: "The people who will actually do the practice aren't on the team yet. Add at least one.",
  data: "No one is watching the data yet. Add a data owner.",
  coach: "No coach or supporter is listed. Someone needs to help people get better at this.",
  voice: "Student or family voice is missing. Add someone who brings it.",
};

// Team composition guidance from Implement with IMPACT (Ch. 3): effective
// implementation teams blend roles and perspectives. Detection is keyword-based
// against the free-text role; it guides, it does not police.
const COMPOSITION_ROLES = [
  {
    key: "lead",
    label: "Implementation Lead",
    keywords: ["implementation lead", "lead", "coordinator", "chair"],
    why: "Owns the plan, runs the cadence, and connects the team to leadership.",
  },
  {
    key: "leader",
    label: "School Leader",
    keywords: ["principal", "head", "director", "assistant principal", "school leader"],
    why: "Protects time and resources and removes organizational barriers.",
  },
  {
    key: "implementers",
    label: "Teachers Who Will Implement",
    keywords: ["teacher", "educator", "practitioner", "instructor"],
    why: "The people doing the daily work, involved from the start, builds ownership.",
  },
  {
    key: "data",
    label: "Data Role",
    keywords: ["data", "assessment", "analyst"],
    why: "Keeps decisions grounded in evidence rather than impressions.",
  },
  {
    key: "coach",
    label: "Coach or PD Role",
    keywords: ["coach", "professional development", "pd", "mentor", "instructional"],
    why: "Turns training into practice through modeling and feedback cycles.",
  },
  {
    key: "voice",
    label: "Family or Student Voice",
    keywords: ["family", "parent", "student", "community", "liaison"],
    why: "Keeps the people most affected inside the decision-making.",
  },
];

const BEHAVIORS = [
  {
    name: "Engage",
    icon: Handshake,
    summary: "Seek input from the people the change affects before deciding, not after.",
    protocol: [
      "Open each team meeting with implementer voice: what is one thing staff said this week?",
      "Before any major decision, name who has not been heard yet and go ask.",
      "Rotate who brings student and family perspectives to the table.",
    ],
  },
  {
    name: "Unite",
    icon: Users,
    summary: "Build one shared understanding of the why, the what, and the how.",
    protocol: [
      "Start meetings by restating the problem and goal in one sentence; correct drift immediately.",
      "Close every meeting with decisions made, owners, and what gets communicated to whom.",
      "Keep one version of the plan; if it changed, say so out loud and update it.",
    ],
  },
  {
    name: "Reflect",
    icon: RefreshCw,
    summary: "Use data and honest conversation to improve, without blame.",
    protocol: [
      "Review fidelity and indicator data at a set rhythm, not when things feel wrong.",
      "Ask what the data says before asking whose fault it is.",
      "Name one thing the team will do differently next cycle and check it next meeting.",
    ],
  },
];

export default function Team() {
  const { initiativeId } = useInitiativeContext();
  const { initiatives } = useInitiatives();
  const { teamMembers, isLoading, error } = useTeamMembers(initiativeId || undefined);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: lastMeeting } = useQuery({
    queryKey: ["team-meetings-latest", initiativeId],
    enabled: !!initiativeId,
    queryFn: async () => {
      const { data } = await supabase.from("team_meetings" as any).select("meeting_date").eq("initiative_id", initiativeId!).order("meeting_date", { ascending: false }).limit(1).maybeSingle();
      return (data as any)?.meeting_date as string | undefined;
    },
  });
  const daysSinceMeeting = lastMeeting ? Math.floor((Date.now() - new Date(lastMeeting).getTime()) / 86400000) : null;

  const initiativeTitle = initiatives?.find((i) => i.id === initiativeId)?.title || "Initiative";

  const roleText = teamMembers
    .map((m: any) => `${m.role_in_initiative || ""}`.toLowerCase())
    .join(" | ");
  const compositionStatus = COMPOSITION_ROLES.map((role) => ({
    ...role,
    covered: role.keywords.some((k) => roleText.includes(k)),
  }));
  const coveredCount = compositionStatus.filter((r) => r.covered).length;

  if (!initiativeId) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-2">Team Hub</h1>
        <Card className="mt-6">
          <CardContent className="pt-6 text-center space-y-3">
            <Users className="h-10 w-10 text-muted-foreground mx-auto" aria-hidden="true" />
            <p className="text-muted-foreground">
              Select an initiative to see its implementation team. Start from the{" "}
              <Link to="/" className="text-accent underline underline-offset-2 font-medium">Dashboard</Link>{" "}
              or create one in{" "}
              <Link to="/decide" className="text-accent underline underline-offset-2 font-medium">Decide</Link>.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // A failed fetch must not render as an empty roster: that invites
  // re-adding members who are already there.
  if (error) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-2">Team Hub</h1>
        <div className="mt-6">
          <QueryErrorState title="We could not load your team" />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Users className="h-4 w-4" aria-hidden="true" />
            Cross-cutting: your team carries every stage
          </div>
          <h1 className="text-3xl font-bold">Team Hub</h1>
          <p className="text-muted-foreground mt-1">
            The implementation team is the engine of the work: who is on it, whether the right
            perspectives are present, and how it behaves when it meets.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CalendarTaskExport
            initiativeId={initiativeId}
            initiativeTitle={initiativeTitle}
            variant="compact"
          />
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
        </div>
      </div>

      {/* Health line */}
      <Card className="border-primary/20">
        <CardContent className="py-4 text-sm">
          <span className="font-medium">Team of {teamMembers.length}.</span>{" "}
          {coveredCount} of {COMPOSITION_ROLES.length} seats filled.{" "}
          {daysSinceMeeting === null ? "No team meeting logged yet." : daysSinceMeeting === 0 ? "Met today." : `Last met ${daysSinceMeeting} day${daysSinceMeeting === 1 ? "" : "s"} ago.`}
          {daysSinceMeeting !== null && daysSinceMeeting > 21 && <span className="text-amber-700 dark:text-amber-300"> Time to get the team in a room.</span>}
        </CardContent>
      </Card>

      {/* Meeting brief: walk into the team meeting already prepared */}
      <MeetingBrief initiativeId={initiativeId || undefined} />

      {/* Roster */}
      <Card>
        <CardHeader>
          <CardTitle>Who's on the team</CardTitle>
          <CardDescription>
            {teamMembers.length} {teamMembers.length === 1 ? "member" : "members"} on this initiative
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading team...</p>
          ) : teamMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No team members yet. Add the people who will carry this work, including at least
              one person who will push back.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {teamMembers.map((member: any) => (
                <div key={member.id} className="flex items-start gap-3 rounded-lg border p-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {(member.profiles?.full_name || member.name || "??")
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="font-medium truncate">{member.profiles?.full_name || member.name || "Unknown"}</p>
                      {/* Access state, so an invite that never converted is visible instead of
                          silently identical to a linked member. user_id means they see this
                          initiative when they sign in; invited_email means it links on their
                          first sign-in with that email; neither means roster entry only. */}
                      {member.user_id ? (
                        <Badge variant="secondary" className="shrink-0 text-xs">Joined</Badge>
                      ) : member.invited_email ? (
                        <Badge variant="outline" className="shrink-0 text-xs border-amber-500/50 text-amber-700 dark:text-amber-400" title={`Invite waiting for ${member.invited_email} to sign in`}>
                          Invited, waiting to join
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="shrink-0 text-xs text-muted-foreground" title="Name-only entry. Add their email so this initiative appears when they sign in.">
                          No access
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{member.role_in_initiative}</p>
                    {member.responsibilities?.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {member.responsibilities.join("; ")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Composition Check */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Composition Check</CardTitle>
              <CardDescription>
                Effective implementation teams blend these perspectives. Based on the roles above.
              </CardDescription>
            </div>
            <Badge variant={coveredCount === COMPOSITION_ROLES.length ? "default" : "secondary"}>
              {coveredCount}/{COMPOSITION_ROLES.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {coveredCount === COMPOSITION_ROLES.length ? (
            <p className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" aria-hidden="true" />
              Every seat is filled. Nice work.
            </p>
          ) : (
            <div className="space-y-2">
              {compositionStatus
                .filter((role) => !role.covered)
                .map((role) => (
                  <div key={role.key} className="flex items-start gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <p className="text-muted-foreground">
                      {MISSING_ROLE_MESSAGES[role.key] ?? `Add someone to cover ${role.label}.`}
                    </p>
                  </div>
                ))}
            </div>
          )}
          <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground underline underline-offset-2 pt-1">
              See all six seats
              <ChevronDown className="h-3 w-3" aria-hidden="true" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-3">
              {compositionStatus.map((role) => (
                <div key={role.key} className="flex items-start gap-2 text-sm">
                  {role.covered ? (
                    <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0 mt-0.5" aria-hidden="true" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" aria-hidden="true" />
                  )}
                  <div>
                    <span className={role.covered ? "font-medium" : "text-muted-foreground font-medium"}>
                      {role.label}
                    </span>
                    <p className="text-xs text-muted-foreground">{role.why}</p>
                  </div>
                </div>
              ))}
              <p className="text-xs text-muted-foreground pt-2">
                One more worth naming on purpose: a candid skeptic. Their pushback now prevents quiet
                resistance later.
              </p>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Meeting Log: the protocol made practical */}
      <MeetingLog
        initiativeId={initiativeId}
        rosterNames={teamMembers.map((m: any) => m.profiles?.full_name || m.name).filter(Boolean)}
      />

      {/* Engage / Unite / Reflect */}
      <Collapsible>
        <CollapsibleTrigger className="flex items-center gap-2 text-xl font-semibold mb-1 hover:underline">
          How strong teams behave: Engage, Unite, Reflect
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <p className="text-sm text-muted-foreground mb-4 mt-1">
            Three behaviors that separate teams that implement from teams that meet. Use these as
            standing meeting protocols.
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            {BEHAVIORS.map((b) => (
              <Card key={b.name}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <b.icon className="h-4 w-4 text-accent" aria-hidden="true" />
                    {b.name}
                  </CardTitle>
                  <CardDescription>{b.summary}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                    {b.protocol.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Assignments link */}
      <Card>
        <CardContent className="pt-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-semibold mb-1 flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" aria-hidden="true" />
              Who Owns What
            </h3>
            <p className="text-sm text-muted-foreground">
              See every strategy, milestone, and risk assigned to each team member
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to={`/plan?initiative=${initiativeId}&section=team-dashboard`}>
              Open Team Assignments
            </Link>
          </Button>
        </CardContent>
      </Card>

      <TeamMemberDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initiativeId={initiativeId}
      />
    </div>
  );
}
