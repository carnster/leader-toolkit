import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Flag, Target } from "lucide-react";
import { Separator } from "@/components/ui/separator";

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

  // Extract frequency information
  const frequencyPattern = /\(([^)]+)\)/;
  
  const getFrequency = (item: string) => {
    const match = item.match(frequencyPattern);
    return match ? match[1] : null;
  };

  // Group items by frequency
  const groupByFrequency = (items: string[]) => {
    const groups: Record<string, string[]> = {};
    items.forEach(item => {
      const freq = getFrequency(item);
      const cleanItem = item.replace(frequencyPattern, '').trim();
      if (freq) {
        if (!groups[freq]) groups[freq] = [];
        groups[freq].push(cleanItem);
      }
    });
    return groups;
  };

  const leadingByFreq = groupByFrequency(leadingIndicators);
  const laggingByFreq = groupByFrequency(laggingIndicators);
  const timelineByFreq = groupByFrequency(measurementTimeline);

  const allFrequencies = Array.from(new Set([
    ...Object.keys(leadingByFreq),
    ...Object.keys(laggingByFreq),
    ...Object.keys(timelineByFreq)
  ])).sort((a, b) => {
    const order = ['Weekly', 'Fortnightly', 'Monthly', 'Bi-monthly', 'Half-termly', 'Termly', 'End-of-year'];
    return order.indexOf(a) - order.indexOf(b);
  });

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-primary" />
            Measurement Timeline Overview
          </CardTitle>
          <div className="flex gap-2">
            {leadingIndicators.length > 0 && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300">
                {leadingIndicators.length} Leading
              </Badge>
            )}
            {laggingIndicators.length > 0 && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300">
                {laggingIndicators.length} Lagging
              </Badge>
            )}
            {measurementTimeline.length > 0 && (
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300">
                {measurementTimeline.length} Activities
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {allFrequencies.length > 0 ? (
          <div className="space-y-4">
            {allFrequencies.map((freq) => {
              const leading = leadingByFreq[freq] || [];
              const lagging = laggingByFreq[freq] || [];
              const timeline = timelineByFreq[freq] || [];
              
              if (leading.length === 0 && lagging.length === 0 && timeline.length === 0) {
                return null;
              }

              return (
                <div key={freq} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-semibold">
                      {freq}
                    </Badge>
                    <Separator className="flex-1" />
                  </div>
                  
                  <div className="grid gap-3 md:grid-cols-3">
                    {/* Leading Indicators */}
                    {leading.length > 0 && (
                      <div className="rounded-lg border border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800 p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Flag className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <p className="text-xs font-medium text-blue-900 dark:text-blue-100">Leading</p>
                        </div>
                        <ul className="space-y-1">
                          {leading.map((item, idx) => (
                            <li key={idx} className="text-sm text-blue-700 dark:text-blue-300 flex items-start gap-1.5">
                              <span className="text-blue-500 mt-0.5">•</span>
                              <span className="flex-1">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Lagging Indicators */}
                    {lagging.length > 0 && (
                      <div className="rounded-lg border border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-800 p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <p className="text-xs font-medium text-green-900 dark:text-green-100">Lagging</p>
                        </div>
                        <ul className="space-y-1">
                          {lagging.map((item, idx) => (
                            <li key={idx} className="text-sm text-green-700 dark:text-green-300 flex items-start gap-1.5">
                              <span className="text-green-500 mt-0.5">•</span>
                              <span className="flex-1">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Data Collection Activities */}
                    {timeline.length > 0 && (
                      <div className="rounded-lg border border-purple-200 bg-purple-50/50 dark:bg-purple-950/20 dark:border-purple-800 p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          <p className="text-xs font-medium text-purple-900 dark:text-purple-100">Activities</p>
                        </div>
                        <ul className="space-y-1">
                          {timeline.map((item, idx) => (
                            <li key={idx} className="text-sm text-purple-700 dark:text-purple-300 flex items-start gap-1.5">
                              <span className="text-purple-500 mt-0.5">•</span>
                              <span className="flex-1">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Fallback: Show all items without grouping */}
            {leadingIndicators.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Flag className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <p className="text-sm font-medium">Leading Indicators</p>
                </div>
                <ul className="ml-6 space-y-1">
                  {leadingIndicators.map((item, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground">{item}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {laggingIndicators.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <p className="text-sm font-medium">Lagging Indicators</p>
                </div>
                <ul className="ml-6 space-y-1">
                  {laggingIndicators.map((item, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground">{item}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {measurementTimeline.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <p className="text-sm font-medium">Data Collection Activities</p>
                </div>
                <ul className="ml-6 space-y-1">
                  {measurementTimeline.map((item, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground">{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Implementation Tip */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
          <p className="text-xs font-medium mb-1">💡 Implementation Tip</p>
          <p className="text-xs text-muted-foreground">
            This timeline shows when you'll measure each indicator. Leading indicators help catch issues early, while lagging indicators confirm your ultimate impact. Monitor both regularly to stay on track.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}