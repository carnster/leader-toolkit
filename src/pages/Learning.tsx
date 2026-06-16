import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap, Sparkles, Loader2, CalendarDays, BookOpen, Users, Compass, Download } from "lucide-react";
import { useInitiatives } from "@/hooks/useInitiatives";
import { useLearningPlans, type LearningPlan } from "@/hooks/useLearningPlans";
import { CombinedCalendar } from "@/components/learning/CombinedCalendar";
import { exportLearningPlanPdf } from "@/components/learning/exportLearningPlanPdf";

const YEAR_OPTIONS = ["July 2026", "August 2026", "September 2026", "January 2027", "August 2027"];

export default function Learning() {
  const { initiatives, isLoading: loadingInitiatives } = useInitiatives();
  const { plans, generate, isGenerating } = useLearningPlans();

  const active = useMemo(
    () => initiatives.filter((i) => i.status === "active"),
    [initiatives]
  );

  const [scope, setScope] = useState<"single" | "all">("all");
  const [singleId, setSingleId] = useState<string>("");
  const [schoolYearStart, setSchoolYearStart] = useState<string>("August 2026");
  const [displayedPlan, setDisplayedPlan] = useState<LearningPlan | null>(null);

  useEffect(() => {
    if (!singleId && active.length > 0) setSingleId(active[0].id);
  }, [active, singleId]);

  useEffect(() => {
    if (!displayedPlan && plans.length > 0) setDisplayedPlan(plans[0]);
  }, [plans, displayedPlan]);

  const selectedInitiatives = useMemo(() => {
    if (scope === "all") return active.map((i) => ({ id: i.id, title: i.title }));
    const one = active.find((i) => i.id === singleId);
    return one ? [{ id: one.id, title: one.title }] : [];
  }, [scope, singleId, active, ]);

  const handleGenerate = async () => {
    try {
      const ids = selectedInitiatives.map((i) => i.id);
      const plan = await generate({ scope, initiativeIds: ids, schoolYearStart });
      setDisplayedPlan(plan);
    } catch {
      /* surfaced by the hook's toast */
    }
  };

  if (!loadingInitiatives && active.length === 0) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-2">Professional Learning</h1>
        <Card className="mt-6">
          <CardContent className="pt-6 text-center space-y-3">
            <GraduationCap className="h-10 w-10 text-muted-foreground mx-auto" aria-hidden="true" />
            <p className="text-muted-foreground">
              You have no active initiatives yet. Start one in{" "}
              <Link to="/decide" className="text-accent underline underline-offset-2 font-medium">Decide</Link>, and your
              professional learning plan will build from it.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Compass className="h-4 w-4" aria-hidden="true" />
          Cross-cutting: the learning and the rhythm behind every initiative
        </div>
        <h1 className="text-3xl font-bold">Professional Learning</h1>
        <p className="text-muted-foreground mt-1">
          Turn your initiatives into one coordinated year of staff learning, and see every support and every check on one
          calendar.
        </p>
      </div>

      {/* Build controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Build your year</CardTitle>
          <CardDescription>
            Choose one initiative or all the initiatives you are implementing, then synthesize a single plan for the year.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Scope</Label>
              <div className="flex gap-2">
                <Button variant={scope === "all" ? "default" : "outline"} size="sm" onClick={() => setScope("all")} className="flex-1">
                  <Users className="mr-2 h-4 w-4" /> All active ({active.length})
                </Button>
                <Button variant={scope === "single" ? "default" : "outline"} size="sm" onClick={() => setScope("single")} className="flex-1">
                  One initiative
                </Button>
              </div>
            </div>

            {scope === "single" ? (
              <div className="space-y-2">
                <Label>Initiative</Label>
                <Select value={singleId} onValueChange={setSingleId}>
                  <SelectTrigger><SelectValue placeholder="Select an initiative" /></SelectTrigger>
                  <SelectContent>
                    {active.map((i) => (
                      <SelectItem key={i.id} value={i.id}>{i.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Initiatives included</Label>
                <p className="text-sm text-muted-foreground pt-1.5">
                  {active.length} active {active.length === 1 ? "initiative" : "initiatives"} will be coordinated into one plan.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>School year starts</Label>
              <Select value={schoolYearStart} onValueChange={setSchoolYearStart}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {YEAR_OPTIONS.map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleGenerate} disabled={isGenerating || selectedInitiatives.length === 0}>
            {isGenerating ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Synthesizing the year...</>
            ) : (
              <><Sparkles className="mr-2 h-4 w-4" /> {displayedPlan ? "Rebuild plan" : "Build learning plan"}</>
            )}
          </Button>
          {isGenerating && (
            <p className="text-xs text-muted-foreground">
              Reading active ingredients, strategies, and existing PD across {selectedInitiatives.length}{" "}
              {selectedInitiatives.length === 1 ? "initiative" : "initiatives"}, then sequencing and deconflicting the year.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Plan + Calendar */}
      <Tabs defaultValue="plan" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="plan"><BookOpen className="h-4 w-4 mr-2" /> Learning Plan</TabsTrigger>
          <TabsTrigger value="calendar"><CalendarDays className="h-4 w-4 mr-2" /> Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="plan" className="mt-4">
          {displayedPlan ? (
            <PlanView plan={displayedPlan} />
          ) : (
            <Card>
              <CardContent className="pt-6 text-center space-y-2">
                <BookOpen className="h-8 w-8 text-muted-foreground mx-auto" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">No plan yet. Choose your scope above and build your year.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <CombinedCalendar initiatives={selectedInitiatives} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PlanView({ plan }: { plan: LearningPlan }) {
  const d = plan.plan_data || ({} as LearningPlan["plan_data"]);
  const periods = Array.isArray(d.periods) ? d.periods : [];
  const themes = Array.isArray(d.themes) ? d.themes : [];
  const coordinationNotes = Array.isArray(d.coordination_notes) ? d.coordination_notes : [];
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold">{plan.title}</h2>
          {plan.school_year_start && (
            <p className="text-sm text-muted-foreground">Year beginning {plan.school_year_start}</p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => exportLearningPlanPdf(plan)}>
          <Download className="mr-2 h-4 w-4" /> Export PDF
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">The year at a glance</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">{d.overview}</p>
          {themes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {themes.map((t, i) => <Badge key={i} variant="secondary">{t}</Badge>)}
            </div>
          )}
        </CardContent>
      </Card>

      {coordinationNotes.length > 0 && (
        <Card className="border-[hsl(var(--stage-decide))]/40 bg-[hsl(var(--stage-decide))]/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-[hsl(var(--stage-decide))]" aria-hidden="true" />
              Coordinating across initiatives
            </CardTitle>
            <CardDescription>How the plan protects staff capacity and deconflicts competing demands.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {coordinationNotes.map((n, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-[hsl(var(--stage-decide))] mt-1">•</span>
                  <span>{n}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {periods.map((p, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <CardTitle className="text-base">{p.label}</CardTitle>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">{p.timeframe}</span>
              </div>
              <CardDescription>{p.focus}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(Array.isArray(p.sessions) ? p.sessions : []).map((s, j) => (
                <div key={j} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-medium text-sm">{s.title}</h4>
                    {s.modality && <Badge variant="outline" className="text-xs">{s.modality}</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Builds:</span> {s.capability}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {s.audience && <span><span className="font-medium">Who:</span> {s.audience}</span>}
                    {s.cadence && <span><span className="font-medium">Cadence:</span> {s.cadence}</span>}
                  </div>
                  {s.rationale && <p className="text-xs text-muted-foreground italic">{s.rationale}</p>}
                  {s.initiatives && s.initiatives.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {s.initiatives.map((name, k) => (
                        <Badge key={k} variant="secondary" className="text-[10px]">{name}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
