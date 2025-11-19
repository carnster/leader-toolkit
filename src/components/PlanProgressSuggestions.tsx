import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Lightbulb, ArrowRight } from "lucide-react";
import { generateSmartSuggestions, type CompletionCounts } from "@/lib/planProgress";

interface PlanProgressSuggestionsProps {
  counts: CompletionCounts;
  onNavigate: (section: string) => void;
}

export function PlanProgressSuggestions({ counts, onNavigate }: PlanProgressSuggestionsProps) {
  const suggestions = generateSmartSuggestions(counts);

  if (suggestions.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">All Set! 🎉</CardTitle>
          </div>
          <CardDescription>
            Your implementation plan is complete. Ready to move to the Implement stage!
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const highPriority = suggestions.filter((s) => s.priority === "high");
  const mediumPriority = suggestions.filter((s) => s.priority === "medium");
  const lowPriority = suggestions.filter((s) => s.priority === "low");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Next Steps</CardTitle>
        </div>
        <CardDescription>
          Complete these items to strengthen your implementation plan
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {highPriority.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="destructive" className="text-xs">High Priority</Badge>
              <span className="text-xs text-muted-foreground">Essential for implementation</span>
            </div>
            {highPriority.map((suggestion, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20"
              >
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{suggestion.sectionLabel}</p>
                  <p className="text-sm text-muted-foreground">{suggestion.message}</p>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onNavigate(suggestion.section)}
                  className="flex-shrink-0"
                >
                  {suggestion.action}
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {mediumPriority.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="text-xs bg-orange-500">Medium Priority</Badge>
              <span className="text-xs text-muted-foreground">Recommended for success</span>
            </div>
            {mediumPriority.map((suggestion, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-orange-500/5 border border-orange-500/20"
              >
                <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{suggestion.sectionLabel}</p>
                  <p className="text-sm text-muted-foreground">{suggestion.message}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onNavigate(suggestion.section)}
                  className="flex-shrink-0 border-orange-500/20 hover:bg-orange-500/10"
                >
                  {suggestion.action}
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {lowPriority.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-xs">Optional</Badge>
              <span className="text-xs text-muted-foreground">Enhance your plan</span>
            </div>
            {lowPriority.map((suggestion, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border"
              >
                <Lightbulb className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{suggestion.sectionLabel}</p>
                  <p className="text-sm text-muted-foreground">{suggestion.message}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onNavigate(suggestion.section)}
                  className="flex-shrink-0"
                >
                  {suggestion.action}
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
