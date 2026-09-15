import { useSearchParams } from "react-router-dom";
import { CheckCircle2, LayoutDashboard } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { PLAN_STEPS, getPlanProgress, isStepComplete, type PlanCounts } from "@/lib/planSteps";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface PlanSidebarProps {
  counts: PlanCounts;
}

export function PlanSidebar({ counts }: PlanSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const [searchParams, setSearchParams] = useSearchParams();
  const currentSection = searchParams.get("section") || "overview";
  const progress = getPlanProgress(counts);

  const setSection = (section: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("section", section);
    setSearchParams(params);
  };

  const activeClass = "bg-[hsl(var(--stage-plan))]/10 text-[hsl(var(--stage-plan))] font-medium";

  return (
    <Sidebar className={collapsed ? "w-14" : "w-72"} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Your plan</SidebarGroupLabel>
          <SidebarGroupContent>
            {!collapsed && (
              <div className="px-2 pb-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>
                    {progress.completedSteps} of {progress.totalSteps} steps
                  </span>
                  <span>
                    {progress.requiredDone}/{progress.requiredTotal} required
                  </span>
                </div>
                <Progress value={progress.percent} className="h-1.5" />
              </div>
            )}
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setSection("overview")}
                  className={cn(currentSection === "overview" ? activeClass : "hover:bg-muted/50")}
                  title="Overview & Readiness"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {!collapsed && <span>Overview & Readiness</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Steps, in order</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {PLAN_STEPS.map((step) => {
                const done = isStepComplete(step, counts);
                const active = currentSection === step.id;
                const count = counts[step.countKey] ?? 0;
                return (
                  <SidebarMenuItem key={step.id}>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton
                            onClick={() => setSection(step.id)}
                            className={cn("h-auto py-1.5", active ? activeClass : "hover:bg-muted/50")}
                          >
                            <span
                              className={cn(
                                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold",
                                done
                                  ? "border-[hsl(var(--stage-plan))] bg-[hsl(var(--stage-plan))]/10 text-[hsl(var(--stage-plan))]"
                                  : step.tier === "strengthens"
                                  ? "border-dashed border-muted-foreground/50 text-muted-foreground"
                                  : "border-muted-foreground/50 text-muted-foreground"
                              )}
                            >
                              {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : step.number}
                            </span>
                            {!collapsed && (
                              <span className="flex min-w-0 flex-1 flex-col text-left leading-tight">
                                <span className="truncate text-sm">{step.title}</span>
                                <span className="truncate text-[11px] text-muted-foreground">
                                  {step.label}
                                  {step.tier === "strengthens" ? " · optional" : ""}
                                </span>
                              </span>
                            )}
                            {!collapsed && count > 0 && (
                              <Badge variant="secondary" className="ml-auto text-xs">
                                {count}
                              </Badge>
                            )}
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <p className="text-xs font-medium">
                            Step {step.number}: {step.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">{step.why}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Views</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setSection("team-dashboard")}
                  className={cn(currentSection === "team-dashboard" ? activeClass : "hover:bg-muted/50")}
                  title="Team dashboard"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  {!collapsed && <span>Team dashboard</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
