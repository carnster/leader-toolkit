import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Flag, Target } from "lucide-react";

interface TimelineVisualizationProps {
  measurementTimeline: string[];
  leadingIndicators: string[];
  laggingIndicators: string[];
}

export function TimelineVisualization({ 
  measurementTimeline, 
  leadingIndicators, 
  laggingIndicators 
}: TimelineVisualizationProps) {
  if (measurementTimeline.length === 0 && leadingIndicators.length === 0 && laggingIndicators.length === 0) {
    return null;
  }

  // Extract frequency from item text (e.g., "Item name (Weekly)")
  const parseItem = (item: string) => {
    const match = item.match(/^(.+?)\s*\(([^)]+)\)$/);
    if (match) {
      return { name: match[1].trim(), frequency: match[2] };
    }
    return { name: item, frequency: null };
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5 text-primary" />
          Your Measurement Plan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Leading Indicators */}
        {leadingIndicators.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <h4 className="font-medium">Leading Indicators</h4>
              <Badge variant="secondary" className="ml-auto">{leadingIndicators.length}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Early signals that implementation is happening as planned
            </p>
            <div className="space-y-2">
              {leadingIndicators.map((item, idx) => {
                const parsed = parseItem(item);
                return (
                  <div key={idx} className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span className="flex-1 text-sm">{parsed.name}</span>
                    {parsed.frequency && (
                      <Badge variant="outline" className="shrink-0 text-xs">
                        {parsed.frequency}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Lagging Indicators */}
        {laggingIndicators.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-green-600 dark:text-green-400" />
              <h4 className="font-medium">Lagging Indicators</h4>
              <Badge variant="secondary" className="ml-auto">{laggingIndicators.length}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Outcome measures that confirm your ultimate impact
            </p>
            <div className="space-y-2">
              {laggingIndicators.map((item, idx) => {
                const parsed = parseItem(item);
                return (
                  <div key={idx} className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
                    <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                    <span className="flex-1 text-sm">{parsed.name}</span>
                    {parsed.frequency && (
                      <Badge variant="outline" className="shrink-0 text-xs">
                        {parsed.frequency}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Data Collection Activities */}
        {measurementTimeline.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <h4 className="font-medium">Data Collection Activities</h4>
              <Badge variant="secondary" className="ml-auto">{measurementTimeline.length}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              When and how you'll collect measurement data
            </p>
            <div className="space-y-2">
              {measurementTimeline.map((item, idx) => {
                const parsed = parseItem(item);
                return (
                  <div key={idx} className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
                    <span className="text-purple-600 dark:text-purple-400 mt-0.5">•</span>
                    <span className="flex-1 text-sm">{parsed.name}</span>
                    {parsed.frequency && (
                      <Badge variant="outline" className="shrink-0 text-xs">
                        {parsed.frequency}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tip */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <p className="text-sm font-medium mb-1">💡 Quick Tip</p>
          <p className="text-sm text-muted-foreground">
            Leading indicators help you adjust course early. Lagging indicators confirm your impact. Track both regularly to stay on target.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}