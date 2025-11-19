import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Network, CheckCircle2, Clock, AlertCircle, Flag } from "lucide-react";
import { format, parseISO } from "date-fns";
import { TimelineMilestone } from "@/hooks/useTimelineMilestones";

interface MilestoneDependencyFlowProps {
  milestones: TimelineMilestone[];
  onMilestoneClick?: (milestone: TimelineMilestone) => void;
}

interface NodePosition {
  id: string;
  x: number;
  y: number;
  layer: number;
}

export function MilestoneDependencyFlow({ milestones, onMilestoneClick }: MilestoneDependencyFlowProps) {
  // Calculate node positions using topological sort
  const { nodePositions, layers } = useMemo(() => {
    if (milestones.length === 0) return { nodePositions: [], layers: 0 };

    // Build dependency graph
    const dependencyMap = new Map<string, string[]>();
    const dependentMap = new Map<string, string[]>();
    
    milestones.forEach(m => {
      dependencyMap.set(m.id, m.depends_on || []);
      dependentMap.set(m.id, []);
    });

    // Build reverse dependencies (who depends on this milestone)
    milestones.forEach(m => {
      (m.depends_on || []).forEach(depId => {
        const dependents = dependentMap.get(depId) || [];
        dependents.push(m.id);
        dependentMap.set(depId, dependents);
      });
    });

    // Topological sort to determine layers
    const layers = new Map<string, number>();
    const visited = new Set<string>();
    
    const calculateLayer = (id: string): number => {
      if (layers.has(id)) return layers.get(id)!;
      if (visited.has(id)) return 0; // Circular dependency fallback
      
      visited.add(id);
      const dependencies = dependencyMap.get(id) || [];
      
      if (dependencies.length === 0) {
        layers.set(id, 0);
        return 0;
      }
      
      const maxDepLayer = Math.max(...dependencies.map(depId => calculateLayer(depId)));
      const layer = maxDepLayer + 1;
      layers.set(id, layer);
      return layer;
    };

    milestones.forEach(m => calculateLayer(m.id));

    // Group milestones by layer
    const layerGroups = new Map<number, string[]>();
    layers.forEach((layer, id) => {
      const group = layerGroups.get(layer) || [];
      group.push(id);
      layerGroups.set(layer, group);
    });

    const maxLayer = Math.max(...Array.from(layers.values()));
    const positions: NodePosition[] = [];
    const nodeWidth = 280;
    const nodeHeight = 100;
    const horizontalGap = 100;
    const verticalGap = 50;

    // Calculate positions
    for (let layer = 0; layer <= maxLayer; layer++) {
      const nodesInLayer = layerGroups.get(layer) || [];
      const layerHeight = nodesInLayer.length * (nodeHeight + verticalGap);
      const startY = -(layerHeight / 2);

      nodesInLayer.forEach((id, index) => {
        positions.push({
          id,
          x: layer * (nodeWidth + horizontalGap),
          y: startY + index * (nodeHeight + verticalGap),
          layer,
        });
      });
    }

    return { nodePositions: positions, layers: maxLayer + 1 };
  }, [milestones]);

  const getMilestoneStatus = (milestone: TimelineMilestone) => {
    if (milestone.status === "completed") return "completed";
    
    // Check if blocked by dependencies
    const hasUncompletedDeps = (milestone.depends_on || []).some(depId => {
      const dependency = milestones.find(m => m.id === depId);
      return dependency && dependency.status !== "completed";
    });
    
    if (hasUncompletedDeps) return "blocked";
    return "active";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-50 border-green-300 text-green-900";
      case "blocked": return "bg-orange-50 border-orange-300 text-orange-900";
      case "active": return "bg-blue-50 border-blue-300 text-blue-900";
      default: return "bg-card";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "blocked": return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case "active": return <Clock className="h-4 w-4 text-blue-600" />;
      default: return <Flag className="h-4 w-4" />;
    }
  };

  if (milestones.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Network className="h-5 w-5 text-primary" />
            <CardTitle>Milestone Dependency Flow</CardTitle>
          </div>
          <CardDescription>
            Visual representation of milestone sequences and dependencies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Network className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No milestones to display</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const svgWidth = Math.max(1000, layers * 380);
  const svgHeight = Math.max(600, nodePositions.length * 150);
  const centerX = 50;
  const centerY = svgHeight / 2;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Network className="h-5 w-5 text-primary" />
          <CardTitle>Milestone Dependency Flow</CardTitle>
        </div>
        <CardDescription>
          Visual representation of milestone sequences and dependencies
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg p-4 bg-muted/10 overflow-x-auto">
          <svg
            width={svgWidth}
            height={svgHeight}
            className="mx-auto"
            style={{ minHeight: "400px" }}
          >
            {/* Draw dependency arrows */}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 10 3, 0 6" fill="hsl(var(--primary))" opacity="0.5" />
              </marker>
            </defs>

            {milestones.map(milestone => {
              const fromPos = nodePositions.find(p => p.id === milestone.id);
              if (!fromPos) return null;

              return (milestone.depends_on || []).map(depId => {
                const toPos = nodePositions.find(p => p.id === depId);
                if (!toPos) return null;

                const x1 = centerX + toPos.x + 280;
                const y1 = centerY + toPos.y + 50;
                const x2 = centerX + fromPos.x;
                const y2 = centerY + fromPos.y + 50;

                return (
                  <line
                    key={`${depId}-${milestone.id}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="hsl(var(--primary))"
                    strokeWidth="2"
                    opacity="0.4"
                    markerEnd="url(#arrowhead)"
                  />
                );
              });
            })}

            {/* Draw milestone nodes */}
            {nodePositions.map(pos => {
              const milestone = milestones.find(m => m.id === pos.id);
              if (!milestone) return null;

              const status = getMilestoneStatus(milestone);
              const x = centerX + pos.x;
              const y = centerY + pos.y;

              return (
                <g key={pos.id}>
                  <foreignObject
                    x={x}
                    y={y}
                    width="280"
                    height="100"
                  >
                    <div className="w-full h-full p-1">
                      <Button
                        variant="outline"
                        className={`w-full h-full p-3 flex flex-col items-start justify-between text-left ${getStatusColor(status)}`}
                        onClick={() => onMilestoneClick?.(milestone)}
                      >
                        <div className="flex items-start gap-2 w-full">
                          {getStatusIcon(status)}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm line-clamp-2">{milestone.milestone}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between w-full mt-2">
                          <Badge variant="outline" className="text-xs">
                            {milestone.phase}
                          </Badge>
                          <span className="text-xs opacity-70">
                            {format(parseISO(milestone.target_date), "MMM d")}
                          </span>
                        </div>
                      </Button>
                    </div>
                  </foreignObject>
                </g>
              );
            })}
          </svg>

          <div className="flex items-center justify-center gap-6 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span>Active</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <span>Blocked</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
