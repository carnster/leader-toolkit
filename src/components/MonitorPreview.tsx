import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp, Eye } from "lucide-react";
import { parseIndicator } from "@/lib/indicatorMigration";

interface MonitorPreviewProps {
  leadingIndicators: string[];
  laggingIndicators: string[];
}

export function MonitorPreview({ leadingIndicators, laggingIndicators }: MonitorPreviewProps) {
  if (leadingIndicators.length === 0 && laggingIndicators.length === 0) {
    return null;
  }

  return (
    <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950 dark:border-purple-800">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          <CardTitle className="text-lg">Monitoring Hub Preview</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          These indicators will be automatically set up for tracking when you move to the Plan stage
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Leading Indicators Preview */}
        {leadingIndicators.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              <h4 className="font-semibold text-sm">Leading Indicators ({leadingIndicators.length})</h4>
            </div>
            <div className="space-y-2 pl-6">
              {leadingIndicators.slice(0, 3).map((indicator, idx) => {
                const { name, schedule } = parseIndicator(indicator);
                return (
                  <div key={idx} className="flex items-start justify-between gap-2 p-2 bg-background rounded border">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{name}</p>
                      {schedule && (
                        <p className="text-xs text-muted-foreground">
                          Measured {schedule.toLowerCase()}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Tracking
                    </Badge>
                  </div>
                );
              })}
              {leadingIndicators.length > 3 && (
                <p className="text-xs text-muted-foreground pl-2">
                  + {leadingIndicators.length - 3} more
                </p>
              )}
            </div>
          </div>
        )}

        {/* Lagging Indicators Preview */}
        {laggingIndicators.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <h4 className="font-semibold text-sm">Lagging Indicators ({laggingIndicators.length})</h4>
            </div>
            <div className="space-y-2 pl-6">
              {laggingIndicators.slice(0, 3).map((indicator, idx) => {
                const { name, schedule } = parseIndicator(indicator);
                return (
                  <div key={idx} className="flex items-start justify-between gap-2 p-2 bg-background rounded border">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{name}</p>
                      {schedule && (
                        <p className="text-xs text-muted-foreground">
                          Measured {schedule.toLowerCase()}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Tracking
                    </Badge>
                  </div>
                );
              })}
              {laggingIndicators.length > 3 && (
                <p className="text-xs text-muted-foreground pl-2">
                  + {laggingIndicators.length - 3} more
                </p>
              )}
            </div>
          </div>
        )}

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            💡 In the Monitoring Hub, you'll be able to record values for these indicators, view trends over time, and track implementation progress.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
