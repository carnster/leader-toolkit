import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, TrendingDown, Activity, Target, Lightbulb, CheckCircle2, Pencil, Archive, ArchiveRestore } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import { PDSACycleAssistant } from "@/components/PDSACycleAssistant";
import { MasterChecklist } from "@/components/MasterChecklist";
import { IndicatorImportBanner } from "@/components/IndicatorImportBanner";
import { EditIndicatorDialog } from "@/components/EditIndicatorDialog";
import { useSearchParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useActiveIngredients } from "@/hooks/useActiveIngredients";
import { useImplementationStrategies } from "@/hooks/useImplementationStrategies";
import { useIndicators, Indicator } from "@/hooks/useIndicators";
import { usePDSACycles } from "@/hooks/usePDSACycles";
import { useTimelineMilestones } from "@/hooks/useTimelineMilestones";
import { FidelityMonitoringPlan } from "@/components/FidelityMonitoringPlan";
import { TimelineTracker } from "@/components/TimelineTracker";

const chartColors = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--accent))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
];

export default function Monitor() {
  const [searchParams] = useSearchParams();
  const initiativeId = searchParams.get("initiative");
  const storedInitiativeId = typeof window !== "undefined" ? sessionStorage.getItem("initiativeId") : null;
  const effectiveInitiativeId = initiativeId || storedInitiativeId || "";
  
  const [editingIndicator, setEditingIndicator] = useState<Indicator | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [archivingIndicatorId, setArchivingIndicatorId] = useState<string | null>(null);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [showArchivedSheet, setShowArchivedSheet] = useState(false);
  
  const { activeIngredients, isLoading: isLoadingIngredients } = useActiveIngredients(effectiveInitiativeId);
  const { strategies, isLoading: isLoadingStrategies } = useImplementationStrategies(effectiveInitiativeId);
  const { indicators, indicatorValues, isLoading: isLoadingIndicators, updateIndicator, archiveIndicator, restoreIndicator } = useIndicators(effectiveInitiativeId);
  const { indicators: archivedIndicators } = useIndicators(effectiveInitiativeId, true);
  const { milestones, isLoading: isLoadingMilestones } = useTimelineMilestones(effectiveInitiativeId);
  const { pdsaCycles, isLoading: isLoadingPDSA } = usePDSACycles(effectiveInitiativeId);

  // Latest and previous recorded values per indicator (indicatorValues is ordered newest first)
  const valuesByIndicator = useMemo(() => {
    const map = new Map<string, { latest: number; previous: number | null }>();
    for (const v of indicatorValues) {
      const entry = map.get(v.indicator_id);
      if (!entry) {
        map.set(v.indicator_id, { latest: v.value, previous: null });
      } else if (entry.previous === null) {
        entry.previous = v.value;
      }
    }
    return map;
  }, [indicatorValues]);

  // Pivot recorded values into one row per date for the trends chart
  const chartData = useMemo(() => {
    if (indicatorValues.length === 0 || indicators.length === 0) return [];
    const indicatorNames = new Map(indicators.map(i => [i.id, i.name]));
    const sorted = [...indicatorValues].sort(
      (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    );
    const byDate = new Map<string, Record<string, number | string>>();
    for (const v of sorted) {
      const name = indicatorNames.get(v.indicator_id);
      if (!name) continue;
      const date = new Date(v.recorded_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (!byDate.has(date)) {
        byDate.set(date, { date });
      }
      byDate.get(date)![name] = v.value;
    }
    return Array.from(byDate.values());
  }, [indicatorValues, indicators]);

  const chartedIndicators = indicators.filter(i => indicatorValues.some(v => v.indicator_id === i.id));
  
  const handleEditIndicator = (indicator: Indicator) => {
    setEditingIndicator(indicator);
    setEditDialogOpen(true);
  };
  
  const handleSaveIndicator = (id: string, updates: Partial<Indicator>) => {
    updateIndicator({ id, updates });
  };

  const handleArchiveIndicator = (indicatorId: string) => {
    setArchivingIndicatorId(indicatorId);
    setArchiveDialogOpen(true);
  };

  const confirmArchiveIndicator = () => {
    if (archivingIndicatorId) {
      archiveIndicator(archivingIndicatorId);
      setArchiveDialogOpen(false);
      setArchivingIndicatorId(null);
    }
  };

  const handleRestoreIndicator = (indicatorId: string) => {
    restoreIndicator(indicatorId);
  };

  const filteredArchivedIndicators = archivedIndicators?.filter(i => i.archived) || [];
  
  const coreIngredients = activeIngredients.filter((ing: any) => ing.is_core ?? ing.isCore);
  const activeStrategies = strategies.filter(s => s.status === 'in_progress' || s.status === 'planned');
  
  // Get implementation milestones with sub-stages
  const implementMilestones = milestones.filter(m => m.phase === "Implement" && m.sub_stage);
  const currentSubStage = implementMilestones.find(m => m.status === "in_progress")?.sub_stage || 
                          implementMilestones[implementMilestones.length - 1]?.sub_stage;
  
  const subStageDetails = {
    "Installation (0-25%)": {
      color: "bg-amber-500/10 border-amber-500/20",
      description: "Setting up systems, training staff, preparing resources",
      fidelity: "Low",
      reach: "Low", 
      capacity: "Building",
      climate: "Mixed",
      impact: "Not yet visible"
    },
    "Initial Implementation (26-75%)": {
      color: "bg-blue-500/10 border-blue-500/20",
      description: "Beginning implementation with support, learning and adjusting",
      fidelity: "Partial to High in pockets",
      reach: "Moderate to Strong",
      capacity: "Growing to Adequate",
      climate: "Positive buy-in to Strong support",
      impact: "Early signs to Moderate gains"
    },
    "Full Implementation (76-100%)": {
      color: "bg-green-500/10 border-green-500/20",
      description: "Fully operational with high fidelity and sustainability",
      fidelity: "High and consistent",
      reach: "Full",
      capacity: "Sustainable",
      climate: "Culturally embedded",
      impact: "Clear impact"
    }
  };
  
  const currentDetails = currentSubStage ? subStageDetails[currentSubStage as keyof typeof subStageDetails] : null;
  
  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <BarChart3 className="h-4 w-4" />
          <span>Monitoring Hub: continuous, not a stage</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Monitoring Hub</h1>
        <p className="text-muted-foreground mt-2">
          Continuous monitoring that runs throughout implementation, not a separate stage. Track progress, assess fidelity, and use data to drive improvement at any point in your journey.
        </p>
        
        {/* Indicator Import Banner */}
        <div className="mt-4">
          <IndicatorImportBanner initiativeId={effectiveInitiativeId} />
        </div>
        
        <Card className="mt-4 border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              What to do in the Monitoring Hub
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• <strong>Track leading indicators:</strong> Monitor fidelity, adoption, and implementation quality</li>
              <li>• <strong>Track lagging indicators:</strong> Measure student outcomes and intended results</li>
              <li>• <strong>Run PDSA cycles:</strong> Test small changes to improve implementation effectiveness</li>
              <li>• <strong>Ask the right questions:</strong> "What are we trying to accomplish?" "How will we know it's working?"</li>
              <li>• <strong>Learn from data:</strong> Turn failure into growth; refine strategies based on evidence</li>
            </ul>
          </CardContent>
        </Card>
      </div>
      
      {/* Fidelity Monitoring Section - Moved from Plan stage */}
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle>Fidelity Monitoring & Observation</CardTitle>
          <CardDescription>
            Conduct observations, track fidelity data, and manage your monitoring schedule
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FidelityMonitoringPlan activeIngredients={activeIngredients} initiativeId={effectiveInitiativeId} />
        </CardContent>
      </Card>
      
      {/* Timeline Tracker */}
      <TimelineTracker initiativeId={effectiveInitiativeId} stage="monitor" />

      {/* Implementation Phase Status */}
      {currentSubStage && currentDetails && (
        <Card className={`border-2 ${currentDetails.color}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Current Implementation Phase
            </CardTitle>
            <CardDescription>
              {currentDetails.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold">{currentSubStage.split(' (')[0]}</h3>
              <Badge variant="outline" className="text-base px-3 py-1">
                {currentSubStage.match(/\(([^)]+)\)/)?.[1]}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-2">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase">Fidelity</p>
                <p className="text-sm font-semibold">{currentDetails.fidelity}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase">Reach</p>
                <p className="text-sm font-semibold">{currentDetails.reach}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase">Capacity</p>
                <p className="text-sm font-semibold">{currentDetails.capacity}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase">Climate</p>
                <p className="text-sm font-semibold">{currentDetails.climate}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase">Evidence of Impact</p>
                <p className="text-sm font-semibold">{currentDetails.impact}</p>
              </div>
            </div>
            
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground">
                Set phases in your <a href="/plan?section=timeline" className="underline hover:text-foreground">Implementation Timeline</a> to track progress
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Context from Plan Stage */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              Core Ingredients Being Monitored
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingIngredients ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : coreIngredients.length === 0 ? (
              <p className="text-sm text-muted-foreground">No core ingredients defined. Add them in Plan stage.</p>
            ) : (
              <div className="space-y-2">
                {coreIngredients.slice(0, 3).map((ingredient: any) => (
                  <div key={ingredient.id} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{ingredient.name}</span>
                  </div>
                ))}
                {coreIngredients.length > 3 && (
                  <p className="text-xs text-muted-foreground">+{coreIngredients.length - 3} more</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-secondary/20 bg-secondary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-secondary" />
              Active Implementation Strategies
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingStrategies ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : activeStrategies.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active strategies. Add them in Plan stage.</p>
            ) : (
              <div className="space-y-2">
                {activeStrategies.slice(0, 3).map((strategy) => (
                  <div key={strategy.id} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-secondary mt-0.5 flex-shrink-0" />
                    <span>{strategy.strategy_name}</span>
                  </div>
                ))}
                {activeStrategies.length > 3 && (
                  <p className="text-xs text-muted-foreground">+{activeStrategies.length - 3} more</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Key Indicators Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Key Indicators</h2>
        {filteredArchivedIndicators.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowArchivedSheet(true)}
          >
            <Archive className="h-4 w-4 mr-2" />
            View Archived ({filteredArchivedIndicators.length})
          </Button>
        )}
      </div>

      {/* Key Indicators */}
      {isLoadingIndicators ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-sm text-muted-foreground text-center">Loading indicators...</p>
          </CardContent>
        </Card>
      ) : indicators.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <div className="text-center text-muted-foreground">
              <Target className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="font-medium text-foreground">No indicators yet</p>
              <p className="text-sm mt-1">
                Define success metrics in the Decide stage, or import them using the banner above
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {indicators.map((indicator) => {
            const recorded = valuesByIndicator.get(indicator.id);
            const latestValue = recorded?.latest ?? null;
            const previousValue = recorded?.previous ?? null;
            const trend = latestValue !== null && previousValue !== null
              ? latestValue > previousValue ? "up" : latestValue < previousValue ? "down" : "stable"
              : null;
            const progress = latestValue !== null && indicator.target_value
              ? (latestValue / indicator.target_value) * 100
              : null;
            const suffix = indicator.name.includes("%") ? "%" : "";

            return (
              <Card key={indicator.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{indicator.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={indicator.type === "leading" ? "default" : "secondary"}>
                        {indicator.type}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditIndicator(indicator)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleArchiveIndicator(indicator.id)}
                        className="h-8 w-8 p-0"
                        title="Archive indicator"
                      >
                        <Archive className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                  {indicator.schedule && (
                    <p className="text-xs text-muted-foreground">
                      Measured {indicator.schedule.toLowerCase()}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-baseline justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold">
                          {latestValue !== null ? `${latestValue}${suffix}` : "—"}
                        </span>
                        {trend === "up" && (
                          <TrendingUp className="h-4 w-4 text-success" />
                        )}
                        {trend === "down" && (
                          <TrendingDown className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Target</p>
                        <p className="font-semibold">
                          {indicator.target_value !== null ? `${indicator.target_value}${suffix}` : "—"}
                        </p>
                      </div>
                    </div>

                    {latestValue === null ? (
                      <p className="text-sm text-muted-foreground">
                        No data recorded yet
                      </p>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress to target</span>
                          <span className="font-medium">
                            {progress !== null ? `${Math.round(progress)}%` : "—"}
                          </span>
                        </div>
                        <Progress
                          value={progress !== null ? Math.min(progress, 100) : 0}
                          className="h-2"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Implementation Dashboard */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Implementation Dashboard</CardTitle>
              <CardDescription>
                Recorded indicator values over time
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center border rounded-lg bg-muted/20">
              <div className="text-center text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No indicator data recorded yet</p>
                <p className="text-xs">Log values for your indicators to see trends over time</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  className="text-xs"
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis
                  className="text-xs"
                  stroke="hsl(var(--muted-foreground))"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Legend />
                {chartedIndicators.map((indicator, index) => (
                  <Line
                    key={indicator.id}
                    type="monotone"
                    dataKey={indicator.name}
                    stroke={chartColors[index % chartColors.length]}
                    strokeWidth={2}
                    dot={{ fill: chartColors[index % chartColors.length], r: 4 }}
                    activeDot={{ r: 6 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* PDSA Cycles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>PDSA Cycles</CardTitle>
                <CardDescription>
                  Plan-Do-Study-Act: Continuous improvement loops
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingPDSA ? (
            <p className="text-sm text-muted-foreground text-center py-4">Loading PDSA cycles...</p>
          ) : pdsaCycles.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              <Target className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="font-medium text-foreground">No PDSA cycles yet</p>
              <p className="text-sm mt-1">
                Use the PDSA Cycle Assistant below to plan your first improvement cycle
              </p>
            </div>
          ) : (
            pdsaCycles.map((cycle) => (
              <div key={cycle.id} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">PDSA {cycle.cycle_number}</h4>
                  <Badge variant={cycle.status === "complete" ? "default" : "secondary"}>
                    {cycle.status}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Aim: </span>
                    <span>{cycle.aim}</span>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Change Idea: </span>
                    <span>{cycle.change_idea}</span>
                  </div>
                  {cycle.results && (
                    <div>
                      <span className="font-medium text-muted-foreground">Results: </span>
                      <span>{cycle.results}</span>
                    </div>
                  )}
                  {cycle.decision && (
                    <div>
                      <span className="font-medium text-muted-foreground">Decision: </span>
                      <span>{cycle.decision}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* PDSA Cycle Assistant */}
      <PDSACycleAssistant initiativeId={effectiveInitiativeId} />

      {/* Master Checklist */}
      <MasterChecklist stage="deliver" initiativeId={effectiveInitiativeId} />

      {/* Data Entry */}
      <Card>
        <CardHeader>
          <CardTitle>Update Indicators</CardTitle>
          <CardDescription>
            Log new data points for leading and lagging measures
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <Button variant="outline" className="h-auto flex-col items-start p-4">
              <span className="font-semibold mb-1">Enter Fidelity Data</span>
              <span className="text-sm text-muted-foreground">
                Weekly aggregate or per-component
              </span>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start p-4">
              <span className="font-semibold mb-1">Import Assessment Data</span>
              <span className="text-sm text-muted-foreground">
                Upload CSV from SIS or LMS
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Edit Indicator Dialog */}
      <EditIndicatorDialog
        indicator={editingIndicator}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleSaveIndicator}
      />

      {/* Archive Indicator Confirmation Dialog */}
      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Indicator</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive this indicator? It will be hidden from the main view but can be restored later from the archived indicators.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmArchiveIndicator}
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archived Indicators Sheet */}
      <Sheet open={showArchivedSheet} onOpenChange={setShowArchivedSheet}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Archived Indicators</SheetTitle>
            <SheetDescription>
              View and restore previously archived indicators
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {filteredArchivedIndicators.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No archived indicators
              </p>
            ) : (
              filteredArchivedIndicators.map((indicator) => (
                <Card key={indicator.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">{indicator.name}</CardTitle>
                        <Badge 
                          variant={indicator.type === "leading" ? "default" : "secondary"}
                          className="mt-2"
                        >
                          {indicator.type}
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestoreIndicator(indicator.id)}
                      >
                        <ArchiveRestore className="h-4 w-4 mr-2" />
                        Restore
                      </Button>
                    </div>
                    {indicator.schedule && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Measured {indicator.schedule.toLowerCase()}
                      </p>
                    )}
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
