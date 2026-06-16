import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, BookOpen, Plus, Clock } from "lucide-react";
import { useMemo, useState } from "react";
import { ERIC_CLUSTERS, ERIC_CLUSTER_MAP, type EricCategory } from "@/lib/ericClusters";
import {
  ERIC_STRATEGIES,
  ERIC_PHASES,
  phasesForStage,
  type ERICStrategy,
  type EricPhase,
} from "@/lib/ericStrategies";

const STAGE_LABELS: Record<string, string> = {
  decide: "Decide",
  plan: "Plan & Prepare",
  implement: "Implement",
  sustain: "Spread & Sustain",
};

interface ERICStrategySelectorProps {
  /** Current stage of the initiative; surfaces phase-appropriate strategies first. Defaults to plan. */
  currentStage?: string;
  onSelect?: (strategy: ERICStrategy) => void;
}

export function ERICStrategySelector({ currentStage = "plan", onSelect }: ERICStrategySelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<EricCategory | null>(null);
  const [stageOnly, setStageOnly] = useState(true);
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);

  const stagePhases = useMemo<Set<EricPhase>>(() => new Set(phasesForStage(currentStage)), [currentStage]);
  const stageLabel = STAGE_LABELS[currentStage] || "your stage";

  const strategiesForStage = ERIC_STRATEGIES.filter((s) => stagePhases.has(s.phase));

  const filteredStrategies = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return ERIC_STRATEGIES
      .filter((strategy) => {
        const matchesSearch =
          strategy.name.toLowerCase().includes(q) || strategy.definition.toLowerCase().includes(q);
        const matchesCategory = !selectedCategory || strategy.category === selectedCategory;
        const matchesStage = !stageOnly || stagePhases.has(strategy.phase);
        return matchesSearch && matchesCategory && matchesStage;
      })
      // Stage-appropriate strategies float to the top, then by phase order.
      .sort((a, b) => {
        const aMatch = stagePhases.has(a.phase) ? 0 : 1;
        const bMatch = stagePhases.has(b.phase) ? 0 : 1;
        if (aMatch !== bMatch) return aMatch - bMatch;
        return ERIC_PHASES[a.phase].order - ERIC_PHASES[b.phase].order;
      });
  }, [searchQuery, selectedCategory, stageOnly, stagePhases]);

  const toggleStrategy = (strategyId: string) => {
    if (selectedStrategies.includes(strategyId)) {
      setSelectedStrategies(selectedStrategies.filter((id) => id !== strategyId));
    } else {
      setSelectedStrategies([...selectedStrategies, strategyId]);
      const strategy = ERIC_STRATEGIES.find((s) => s.id === strategyId);
      if (strategy && onSelect) onSelect(strategy);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>ERIC Implementation Strategies Library</CardTitle>
            <CardDescription>
              Expert Recommendations for Implementing Change (Powell et al., 2015), adapted for schools and tagged
              to the implementation phase when each strategy matters most (ISST).
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search strategies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Stage filter */}
        <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-primary" aria-hidden="true" />
            <span>
              <span className="font-medium">Right for {stageLabel} now:</span>{" "}
              {strategiesForStage.length} strategies fit this stage.
            </span>
          </div>
          <Button variant={stageOnly ? "default" : "outline"} size="sm" onClick={() => setStageOnly((v) => !v)}>
            {stageOnly ? "Showing stage-fit only" : "Show all phases"}
          </Button>
        </div>

        {/* Cluster Filters */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All Clusters
          </Button>
          {ERIC_CLUSTERS.map((cluster) => (
            <Button
              key={cluster.value}
              variant={selectedCategory === cluster.value ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cluster.value)}
            >
              {cluster.label}
            </Button>
          ))}
        </div>

        {/* Selected Count */}
        {selectedStrategies.length > 0 && (
          <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 text-sm">
            <strong>{selectedStrategies.length}</strong>{" "}
            {selectedStrategies.length === 1 ? "strategy" : "strategies"} selected
          </div>
        )}

        {/* Strategy List */}
        <ScrollArea className="h-[400px] rounded-md border">
          <div className="space-y-2 p-4">
            {filteredStrategies.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No strategies match. Try clearing the search or showing all phases.
              </p>
            )}
            {filteredStrategies.map((strategy) => {
              const cluster = ERIC_CLUSTER_MAP[strategy.category];
              const phase = ERIC_PHASES[strategy.phase];
              const fitsStage = stagePhases.has(strategy.phase);
              const isSelected = selectedStrategies.includes(strategy.id);

              return (
                <div
                  key={strategy.id}
                  className={`rounded-lg border p-4 cursor-pointer transition-all ${
                    isSelected ? "bg-primary/10 border-primary/50" : "hover:bg-muted/50"
                  }`}
                  onClick={() => toggleStrategy(strategy.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium text-sm">{strategy.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {cluster.label}
                        </Badge>
                        <Badge
                          variant={fitsStage ? "default" : "secondary"}
                          className="text-xs gap-1"
                          title={phase.blurb}
                        >
                          <Clock className="h-3 w-3" aria-hidden="true" />
                          {phase.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{strategy.definition}</p>
                    </div>
                    {isSelected && (
                      <div className="flex-shrink-0">
                        <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                          <Plus className="h-3 w-3 rotate-45" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <div className="text-xs text-muted-foreground">
          Showing {filteredStrategies.length} of {ERIC_STRATEGIES.length} education-adapted strategies, tagged by
          implementation phase. Full ERIC compilation: 73 strategies in 9 clusters.
        </div>
      </CardContent>
    </Card>
  );
}
