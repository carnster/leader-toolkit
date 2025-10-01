import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, BookOpen, Plus } from "lucide-react";
import { useState } from "react";

interface ERICStrategy {
  id: string;
  name: string;
  definition: string;
  category: "enable" | "redesign" | "integrate" | "create";
}

const ERIC_STRATEGIES: ERICStrategy[] = [
  // Enable strategies
  { id: "conduct-training", name: "Conduct ongoing training", definition: "Plan for and conduct training in the clinical innovation in an ongoing way", category: "enable" },
  { id: "provide-supervision", name: "Provide clinical supervision", definition: "Provide clinicians with ongoing supervision focusing on the innovation", category: "enable" },
  { id: "educational-meetings", name: "Conduct educational meetings", definition: "Hold meetings targeted toward different stakeholder groups to teach them about the innovation", category: "enable" },
  { id: "develop-materials", name: "Develop educational materials", definition: "Develop and format manuals, toolkits, and other supporting materials", category: "enable" },
  { id: "facilitation", name: "Facilitation", definition: "A process of interactive problem solving and support in a context of recognized need for improvement", category: "enable" },
  { id: "identify-champions", name: "Identify and prepare champions", definition: "Identify and prepare individuals who dedicate themselves to supporting and driving through implementation", category: "enable" },
  { id: "local-technical-assistance", name: "Provide local technical assistance", definition: "Develop and use a system to deliver technical assistance using local personnel", category: "enable" },
  { id: "audit-feedback", name: "Audit and provide feedback", definition: "Collect and summarize performance data and give it to staff to monitor and modify practice", category: "enable" },
  
  // Redesign strategies
  { id: "change-physical-structure", name: "Change physical structure and equipment", definition: "Adapt the physical structure and/or equipment to best accommodate the innovation", category: "redesign" },
  { id: "change-record-systems", name: "Change record systems", definition: "Change records systems to allow better assessment of implementation or outcomes", category: "redesign" },
  { id: "create-clinical-teams", name: "Create new clinical teams", definition: "Change who serves on the team, adding different disciplines and skills", category: "redesign" },
  { id: "revise-roles", name: "Revise professional roles", definition: "Shift and revise roles among professionals who provide care and clarify their relationships", category: "redesign" },
  { id: "change-service-sites", name: "Change service sites", definition: "Change the location of service sites to increase access", category: "redesign" },
  
  // Integrate strategies
  { id: "conduct-small-tests", name: "Conduct cyclical small tests of change", definition: "Implement changes using small tests before taking changes system-wide (PDSA cycles)", category: "integrate" },
  { id: "develop-formal-blueprint", name: "Develop a formal implementation blueprint", definition: "Develop a formal blueprint with goals, strategies, scope, timeframe, and progress measures", category: "integrate" },
  { id: "quality-monitoring", name: "Develop and organize quality monitoring systems", definition: "Develop systems and procedures that monitor processes and outcomes for quality assurance", category: "integrate" },
  { id: "mandate-change", name: "Mandate change", definition: "Have leadership declare the priority of the innovation and determination to have it implemented", category: "integrate" },
  { id: "stage-scale-up", name: "Stage implementation scale up", definition: "Phase implementation efforts by starting with small pilots or demonstration projects", category: "integrate" },
  
  // Create strategies
  { id: "build-coalition", name: "Build a coalition", definition: "Recruit and cultivate relationships with partners in the implementation effort", category: "create" },
  { id: "learning-collaborative", name: "Create a learning collaborative", definition: "Facilitate formation of groups of providers and foster collaborative learning environment", category: "create" },
  { id: "develop-partnerships", name: "Develop academic partnerships", definition: "Partner with a university for shared training and bringing research skills", category: "create" },
  { id: "resource-sharing", name: "Develop resource sharing agreements", definition: "Develop partnerships with organizations that have resources needed", category: "create" },
  { id: "implementation-teams", name: "Organize clinician implementation team meetings", definition: "Develop teams of implementers with protected time to reflect and support learning", category: "create" }
];

const CATEGORY_INFO = {
  enable: { label: "Enable", color: "primary", description: "Build capacity and skills" },
  redesign: { label: "Redesign", color: "secondary", description: "Adapt context and structures" },
  integrate: { label: "Integrate", color: "accent", description: "Embed in routine practice" },
  create: { label: "Create", color: "success", description: "Build new supports and systems" }
};

interface ERICStrategySelectorProps {
  onSelect?: (strategy: ERICStrategy) => void;
}

export function ERICStrategySelector({ onSelect }: ERICStrategySelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
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
              Evidence-based strategies organized by the ERIC framework (73 total strategies)
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

        {/* Category Filters */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All Strategies
          </Button>
          {Object.entries(CATEGORY_INFO).map(([key, info]) => (
            <Button
              key={key}
              variant={selectedCategory === key ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(key)}
            >
              {info.label}
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
              const categoryInfo = CATEGORY_INFO[strategy.category];
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
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{strategy.name}</h4>
                        <Badge variant="outline" className="text-xs capitalize">
                          {categoryInfo.label}
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
          Showing {filteredStrategies.length} of {ERIC_STRATEGIES.length} strategies
        </div>
      </CardContent>
    </Card>
  );
}
