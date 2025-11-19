import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Flag } from "lucide-react";

interface TimelineVisualizationProps {
  measurementTimeline: string;
  leadingIndicators: string[];
  laggingIndicators: string[];
}

export function TimelineVisualization({ 
  measurementTimeline, 
  leadingIndicators, 
  laggingIndicators 
}: TimelineVisualizationProps) {
  if (!measurementTimeline && leadingIndicators.length === 0 && laggingIndicators.length === 0) {
    return null;
  }

  // Parse and format measurement timeline entries
  const parseTimelineEntries = (timeline: string): string[] => {
    if (!timeline) return [];
    
    // Remove common bullet/numbering prefixes and split by various delimiters
    const entries = timeline
      // Split by newlines, commas, semicolons, or "and"
      .split(/[\n,;]|(?:\s+and\s+)/i)
      .map(entry => entry
        // Remove bullets (•, -, *, >, etc.)
        .replace(/^[\s\-•*>]+/, '')
        // Remove numbering (1., 2), etc.)
        .replace(/^\d+[\.)]\s*/, '')
        .trim()
      )
      .filter(entry => entry.length > 0);
    
    return entries;
  };

  const timelineEntries = parseTimelineEntries(measurementTimeline);
  
  // Extract timeline keywords and organize
  const timelinePattern = /\b(weekly|fortnightly|monthly|termly|half-termly|quarterly|annually|daily)\b/gi;
  const matches = measurementTimeline.match(timelinePattern) || [];
  const frequencies = [...new Set(matches.map(m => m.toLowerCase()))];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Measurement Timeline Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Timeline Summary */}
        {frequencies.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Measurement Frequencies:</p>
            <div className="flex flex-wrap gap-2">
              {frequencies.map((freq, idx) => (
                <Badge key={idx} variant="outline">
                  {freq}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Visual Timeline */}
        <div className="space-y-4">
          {leadingIndicators.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Flag className="h-4 w-4 text-blue-600" />
                <p className="text-sm font-medium">Leading Indicators (Early Signals)</p>
                <Badge variant="secondary" className="text-xs">
                  {leadingIndicators.length}
                </Badge>
              </div>
              <div className="ml-6 space-y-1">
                {leadingIndicators.map((indicator, idx) => (
                  <div key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span>{indicator.trim()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {laggingIndicators.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Flag className="h-4 w-4 text-green-600" />
                <p className="text-sm font-medium">Lagging Indicators (Outcomes)</p>
                <Badge variant="secondary" className="text-xs">
                  {laggingIndicators.length}
                </Badge>
              </div>
              <div className="ml-6 space-y-1">
                {laggingIndicators.map((indicator, idx) => (
                  <div key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-green-600">•</span>
                    <span>{indicator.trim()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Timeline Description */}
        {timelineEntries.length > 0 && (
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-sm font-medium mb-2">Measurement Plan:</p>
            <div className="space-y-1">
              {timelineEntries.map((entry, idx) => (
                <div key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{entry}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tip */}
        <div className="text-xs text-muted-foreground border-l-2 border-primary pl-3">
          <p className="font-medium mb-1">Implementation Tip:</p>
          <p>Leading indicators help you catch issues early. Lagging indicators confirm your ultimate impact. Monitor both regularly to adjust your approach as needed.</p>
        </div>
      </CardContent>
    </Card>
  );
}