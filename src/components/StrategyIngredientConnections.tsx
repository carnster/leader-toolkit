import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Network, Edit } from "lucide-react";
import { ActiveIngredient } from "@/hooks/useActiveIngredients";
import { ImplementationStrategy } from "@/hooks/useImplementationStrategies";
import { useState } from "react";

interface StrategyIngredientConnectionsProps {
  activeIngredients: ActiveIngredient[];
  strategies: ImplementationStrategy[];
  onEditStrategy: (strategy: ImplementationStrategy) => void;
}

const ericCategoryColors = {
  enable: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200",
  redesign: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-200",
  integrate: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200",
  create: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200",
};

const ericCategoryLabels = {
  enable: "Enable",
  redesign: "Redesign",
  integrate: "Integrate",
  create: "Create",
};

export function StrategyIngredientConnections({
  activeIngredients,
  strategies,
  onEditStrategy,
}: StrategyIngredientConnectionsProps) {
  const [selectedIngredient, setSelectedIngredient] = useState<string | null>(null);

  const groupedStrategies = strategies.reduce((acc, strategy) => {
    if (!acc[strategy.eric_category]) {
      acc[strategy.eric_category] = [];
    }
    acc[strategy.eric_category].push(strategy);
    return acc;
  }, {} as Record<string, ImplementationStrategy[]>);

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Network className="h-5 w-5 text-primary" />
          <CardTitle>Implementation Logic</CardTitle>
        </div>
        <CardDescription>
          Visual mapping of how your strategies support active ingredients
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Active Ingredients Section */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Active Ingredients</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {activeIngredients.map(ingredient => (
              <button
                key={ingredient.id}
                onClick={() => setSelectedIngredient(
                  selectedIngredient === ingredient.id ? null : ingredient.id
                )}
                className={`p-4 rounded-lg border-2 transition-all text-left hover:shadow-md ${
                  selectedIngredient === ingredient.id
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm truncate">{ingredient.name}</h4>
                      {ingredient.is_core && (
                        <Badge variant="secondary" className="text-xs shrink-0">Core</Badge>
                      )}
                    </div>
                    {ingredient.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {ingredient.description}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Connection Indicator */}
        {selectedIngredient && (
          <div className="flex items-center justify-center py-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-px w-8 bg-border"></div>
              <span>Supported by these strategies</span>
              <div className="h-px w-8 bg-border"></div>
            </div>
          </div>
        )}

        {/* Strategies by ERIC Category */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">Implementation Strategies by Category</h3>
          
          {Object.entries(groupedStrategies).map(([category, categoryStrategies]) => (
            <div key={category} className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className={ericCategoryColors[category as keyof typeof ericCategoryColors]}>
                  {ericCategoryLabels[category as keyof typeof ericCategoryLabels]}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {categoryStrategies.length} {categoryStrategies.length === 1 ? 'strategy' : 'strategies'}
                </span>
              </div>
              
              <div className="grid gap-2">
                {categoryStrategies.map(strategy => (
                  <div
                    key={strategy.id}
                    className={`p-3 rounded-lg border transition-all ${
                      selectedIngredient
                        ? "opacity-100 border-l-4"
                        : "opacity-100"
                    }`}
                    style={{
                      borderLeftColor: selectedIngredient
                        ? `hsl(var(--primary))`
                        : undefined,
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm mb-1">{strategy.strategy_name}</h4>
                        {strategy.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {strategy.description}
                          </p>
                        )}
                        {strategy.target_barrier && (
                          <div className="flex items-start gap-1.5">
                            <span className="text-xs text-muted-foreground">Addresses:</span>
                            <span className="text-xs text-foreground">{strategy.target_barrier}</span>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditStrategy(strategy)}
                        className="shrink-0"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {Object.keys(groupedStrategies).length === 0 && (
            <p className="text-sm text-muted-foreground italic text-center py-8">
              No implementation strategies yet. Add strategies to support your active ingredients.
            </p>
          )}
        </div>

        {/* Legend */}
        <div className="pt-4 border-t">
          <p className="text-xs font-medium mb-2">ERIC Strategy Categories:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-500"></div>
              <span className="text-muted-foreground">Enable - Build capacity</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-purple-500"></div>
              <span className="text-muted-foreground">Redesign - Adjust context</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-500"></div>
              <span className="text-muted-foreground">Integrate - Embed routine</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-orange-500"></div>
              <span className="text-muted-foreground">Create - Build supports</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
