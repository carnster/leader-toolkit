import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, BookOpen, Plus } from "lucide-react";
import { useState } from "react";
import { ERIC_CLUSTERS, ERIC_CLUSTER_MAP, type EricCategory } from "@/lib/ericClusters";

interface ERICStrategy {
  id: string;
  name: string;
  definition: string;
  category: EricCategory;
}

// A curated education-adapted subset of the 73 ERIC strategies (Powell et al. 2015),
// cluster assignments per Waltz et al. (2015) concept mapping.
const ERIC_STRATEGIES: ERICStrategy[] = [
  // Use evaluative and iterative strategies
  { id: "audit-feedback", name: "Audit and provide feedback", definition: "Collect and summarize implementation data and share it with staff to monitor and improve practice", category: "evaluative_iterative" },
  { id: "conduct-small-tests", name: "Conduct cyclical small tests of change", definition: "Test changes with small PDSA cycles before taking them school- or system-wide", category: "evaluative_iterative" },
  { id: "develop-formal-blueprint", name: "Develop a formal implementation blueprint", definition: "Create a formal plan with goals, strategies, scope, timeframe, and progress measures", category: "evaluative_iterative" },
  { id: "quality-monitoring", name: "Develop and organize quality monitoring systems", definition: "Build systems and procedures that monitor implementation processes and outcomes", category: "evaluative_iterative" },
  { id: "assess-readiness", name: "Assess for readiness; identify barriers and facilitators", definition: "Assess the school's readiness for change and identify what will help or hinder implementation", category: "evaluative_iterative" },
  { id: "stage-scale-up", name: "Stage implementation scale up", definition: "Phase implementation by starting with small pilots or demonstration classrooms before expanding", category: "evaluative_iterative" },

  // Provide interactive assistance
  { id: "facilitation", name: "Facilitation", definition: "Interactive problem solving and support delivered in the context of a recognized need for improvement", category: "provide_interactive_assistance" },
  { id: "provide-supervision", name: "Provide instructional coaching and supervision", definition: "Give educators ongoing, practice-focused coaching centered on the new approach", category: "provide_interactive_assistance" },
  { id: "local-technical-assistance", name: "Provide local technical assistance", definition: "Develop and use a system to deliver hands-on assistance using local personnel", category: "provide_interactive_assistance" },

  // Adapt and tailor to context
  { id: "tailor-strategies", name: "Tailor strategies to local context", definition: "Choose and adapt implementation strategies to address the barriers and assets identified in your context", category: "adapt_practice" },
  { id: "promote-adaptability", name: "Promote adaptability", definition: "Identify how the practice can be adapted to local needs while protecting its core active ingredients", category: "adapt_practice" },

  // Develop stakeholder interrelationships
  { id: "identify-champions", name: "Identify and prepare champions", definition: "Identify and prepare individuals who will dedicate themselves to supporting and driving the implementation", category: "develop_stakeholder_relationships" },
  { id: "build-coalition", name: "Build a coalition", definition: "Recruit and cultivate relationships with partners in the implementation effort", category: "develop_stakeholder_relationships" },
  { id: "develop-partnerships", name: "Develop academic partnerships", definition: "Partner with universities or external experts for shared training and research support", category: "develop_stakeholder_relationships" },
  { id: "implementation-teams", name: "Organize implementation team meetings", definition: "Develop teams of implementers with protected time to reflect on progress and support each other's learning", category: "develop_stakeholder_relationships" },
  { id: "consensus-discussions", name: "Conduct local consensus discussions", definition: "Include staff in discussions to establish that the problem matters and the chosen approach is right", category: "develop_stakeholder_relationships" },
  { id: "early-adopters", name: "Identify early adopters", definition: "Learn from staff who adopt the practice first and use their experience to inform wider rollout", category: "develop_stakeholder_relationships" },

  // Train and educate stakeholders
  { id: "conduct-training", name: "Conduct ongoing training", definition: "Plan for and deliver training on the new practice in an ongoing way, not as a one-off event", category: "train_educate" },
  { id: "educational-meetings", name: "Conduct educational meetings", definition: "Hold meetings targeted to different groups — teachers, leaders, families — to teach them about the practice", category: "train_educate" },
  { id: "develop-materials", name: "Develop educational materials", definition: "Create manuals, toolkits, and supporting materials that make the practice easier to learn and use", category: "train_educate" },
  { id: "learning-collaborative", name: "Create a learning collaborative", definition: "Form groups of educators who learn the practice together and hold each other accountable", category: "train_educate" },
  { id: "train-the-trainer", name: "Use train-the-trainer strategies", definition: "Train designated staff to train others in the practice, building internal capacity", category: "train_educate" },
  { id: "dynamic-training", name: "Make training dynamic", definition: "Vary training methods, make them interactive, and tie them to real classroom practice", category: "train_educate" },

  // Support educators
  { id: "revise-roles", name: "Revise professional roles", definition: "Shift and clarify roles and responsibilities so the practice has protected time and clear ownership", category: "support_clinicians" },
  { id: "create-teaching-teams", name: "Create new teaching teams", definition: "Change team composition, adding different skills and perspectives to support the practice", category: "support_clinicians" },
  { id: "remind-practitioners", name: "Remind and prompt educators", definition: "Build in reminders and prompts that help staff use the practice consistently", category: "support_clinicians" },
  { id: "resource-sharing", name: "Develop resource sharing agreements", definition: "Partner with organizations that have resources the implementation needs", category: "support_clinicians" },

  // Engage students and families
  { id: "involve-students-families", name: "Involve students and families", definition: "Engage students and family members in design decisions, feedback, and implementation", category: "engage_consumers" },
  { id: "prepare-active-participants", name: "Prepare students to be active participants", definition: "Equip students to understand and engage with the new practice rather than receive it passively", category: "engage_consumers" },
  { id: "mass-communication", name: "Use mass communication", definition: "Use newsletters, assemblies, and media to build awareness and demand for the change", category: "engage_consumers" },

  // Utilize financial strategies
  { id: "access-funding", name: "Access new funding", definition: "Secure new or repurposed funding to enable and sustain the implementation", category: "use_financial_strategies" },
  { id: "alter-incentives", name: "Alter incentive and recognition structures", definition: "Adjust how effort is recognized and rewarded to encourage adoption of the practice", category: "use_financial_strategies" },

  // Change infrastructure
  { id: "mandate-change", name: "Mandate change", definition: "Have leadership declare the priority of the practice and their determination to see it implemented", category: "change_infrastructure" },
  { id: "change-physical-structure", name: "Change physical structure and equipment", definition: "Adapt spaces, materials, and equipment to accommodate the new practice", category: "change_infrastructure" },
  { id: "change-record-systems", name: "Change record systems", definition: "Update data and record systems to allow better assessment of implementation and outcomes", category: "change_infrastructure" },
  { id: "change-schedules", name: "Change schedules and calendars", definition: "Restructure timetables, meeting schedules, and calendars so the practice has time to live in", category: "change_infrastructure" },
];

interface ERICStrategySelectorProps {
  onSelect?: (strategy: ERICStrategy) => void;
}

export function ERICStrategySelector({ onSelect }: ERICStrategySelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<EricCategory | null>(null);
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);

  const filteredStrategies = ERIC_STRATEGIES.filter((strategy) => {
    const matchesSearch = strategy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         strategy.definition.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || strategy.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleStrategy = (strategyId: string) => {
    if (selectedStrategies.includes(strategyId)) {
      setSelectedStrategies(selectedStrategies.filter(id => id !== strategyId));
    } else {
      setSelectedStrategies([...selectedStrategies, strategyId]);
      const strategy = ERIC_STRATEGIES.find(s => s.id === strategyId);
      if (strategy && onSelect) {
        onSelect(strategy);
      }
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
              Expert Recommendations for Implementing Change (Powell et al., 2015) — 73 evidence-based strategies in 9 clusters, adapted here for schools
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

        {/* Cluster Filters */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All Strategies
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
            <strong>{selectedStrategies.length}</strong> {selectedStrategies.length === 1 ? 'strategy' : 'strategies'} selected
          </div>
        )}

        {/* Strategy List */}
        <ScrollArea className="h-[400px] rounded-md border">
          <div className="space-y-2 p-4">
            {filteredStrategies.map((strategy) => {
              const cluster = ERIC_CLUSTER_MAP[strategy.category];
              const isSelected = selectedStrategies.includes(strategy.id);

              return (
                <div
                  key={strategy.id}
                  className={`rounded-lg border p-4 cursor-pointer transition-all ${
                    isSelected ? 'bg-primary/10 border-primary/50' : 'hover:bg-muted/50'
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
          Showing {filteredStrategies.length} of {ERIC_STRATEGIES.length} curated strategies (full ERIC compilation: 73)
        </div>
      </CardContent>
    </Card>
  );
}
