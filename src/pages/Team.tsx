import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Plus, CheckCircle2, AlertCircle, MessageCircle, Handshake, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { useInitiativeContext } from "@/hooks/useInitiativeContext";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { TeamMemberDialog } from "@/components/TeamMemberDialog";

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
  const { teamMembers, isLoading } = useTeamMembers(initiativeId || undefined);
  const [dialogOpen, setDialogOpen] = useState(false);

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
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Member
        </Button>
      </div>

      {/* Roster */}
      <Card>
        <CardHeader>
          <CardTitle>Roster</CardTitle>
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
                    <p className="font-medium truncate">{member.profiles?.full_name || member.name || "Unknown"}</p>
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
        </CardContent>
      </Card>

      {/* Engage / Unite / Reflect */}
      <div>
        <h2 className="text-xl font-semibold mb-1">How the Team Behaves: Engage, Unite, Reflect</h2>
        <p className="text-sm text-muted-foreground mb-4">
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
      </div>

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
