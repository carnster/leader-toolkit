import { useState } from "react";
import { NavLink, useSearchParams } from "react-router-dom";
import {
  Lightbulb,
  Users,
  Calendar,
  Shield,
  Eye,
  MessageSquare,
  CheckCircle2,
  Settings,
  Target,
  ChevronDown,
  ChevronRight,
  FileText,
  LayoutDashboard,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { calculateSectionProgress, type CompletionCounts } from "@/lib/planProgress";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface PlanSidebarProps {
  completionCounts: CompletionCounts;
}

export function PlanSidebar({ completionCounts }: PlanSidebarProps) {
  const { open, state } = useSidebar();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentSection = searchParams.get("section") || "overview";
  const collapsed = state === "collapsed";
  
  const [strategicOpen, setStrategicOpen] = useState(true);
  const [teamOpen, setTeamOpen] = useState(true);
  const [communicationOpen, setCommunicationOpen] = useState(true);
  const [executionOpen, setExecutionOpen] = useState(true);
  const [qualityOpen, setQualityOpen] = useState(true);

  const setSection = (section: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("section", section);
    setSearchParams(params);
  };

  const getNavClass = (section: string) =>
    currentSection === section
      ? "bg-primary/10 text-primary font-medium"
      : "hover:bg-muted/50";

  const hasContent = (count: number) => count > 0;

  // Calculate progress for sections
  const getStrategicProgress = () => calculateSectionProgress("strategic", completionCounts);
  const getTeamProgress = () => calculateSectionProgress("team", completionCounts);
  const getCommunicationProgress = () => calculateSectionProgress("communication", completionCounts);
  const getExecutionProgress = () => calculateSectionProgress("execution", completionCounts);
  const getQualityProgress = () => calculateSectionProgress("quality", completionCounts);

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Planning Stages</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Overview */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setSection("overview")}
                  className={getNavClass("overview")}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {!collapsed && <span>Overview & Readiness</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Strategic Foundation */}
              <Collapsible open={strategicOpen} onOpenChange={setStrategicOpen}>
                <SidebarMenuItem>
                  <CollapsibleTrigger className="w-full" asChild>
                    <SidebarMenuButton 
                      onClick={(e) => {
                        // Navigate to first subsection on click
                        setSection("ingredients");
                      }}
                      className="hover:bg-muted/50"
                    >
                      <Target className="h-4 w-4" />
                      {!collapsed && (
                        <>
                          <span>Strategic Foundation</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge 
                                  variant={getStrategicProgress().percentage === 100 ? "default" : "secondary"}
                                  className="ml-auto mr-1"
                                >
                                  {getStrategicProgress().completed}/{getStrategicProgress().total}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="right">
                                <p className="text-xs">{getStrategicProgress().percentage}% complete</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setStrategicOpen(!strategicOpen);
                            }}
                            className="ml-1 p-1 hover:bg-muted rounded"
                          >
                            {strategicOpen ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        </>
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                </SidebarMenuItem>
                {!collapsed && (
                  <CollapsibleContent>
                    <div className="mb-2 mx-4">
                      <Progress value={getStrategicProgress().percentage} className="h-1" />
                    </div>
                    <div className="ml-4 space-y-1">
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          onClick={() => setSection("ingredients")}
                          className={getNavClass("ingredients")}
                        >
                          <Lightbulb className="h-3 w-3" />
                          <span className="text-sm">Active Ingredients</span>
                          {hasContent(completionCounts.ingredients) && (
                            <Badge variant="secondary" className="ml-auto text-xs">
                              {completionCounts.ingredients}
                            </Badge>
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          onClick={() => setSection("strategies")}
                          className={getNavClass("strategies")}
                        >
                          <Target className="h-3 w-3" />
                          <span className="text-sm">Implementation Strategies</span>
                          {hasContent(completionCounts.strategies) && (
                            <Badge variant="secondary" className="ml-auto text-xs">
                              {completionCounts.strategies}
                            </Badge>
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </div>
                  </CollapsibleContent>
                )}
              </Collapsible>

              {/* Team & Capacity */}
              <Collapsible open={teamOpen} onOpenChange={setTeamOpen}>
                <SidebarMenuItem>
                  <CollapsibleTrigger className="w-full" asChild>
                    <SidebarMenuButton
                      onClick={() => setSection("team")}
                      className="hover:bg-muted/50"
                    >
                      <Users className="h-4 w-4" />
                      {!collapsed && (
                        <>
                          <span>Team & Capacity</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge 
                                  variant={getTeamProgress().percentage === 100 ? "default" : "secondary"}
                                  className="ml-auto mr-1"
                                >
                                  {getTeamProgress().completed}/{getTeamProgress().total}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="right">
                                <p className="text-xs">{getTeamProgress().percentage}% complete</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setTeamOpen(!teamOpen);
                            }}
                            className="ml-1 p-1 hover:bg-muted rounded"
                          >
                            {teamOpen ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        </>
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                </SidebarMenuItem>
                {!collapsed && (
                  <CollapsibleContent>
                    <div className="mb-2 mx-4">
                      <Progress value={getTeamProgress().percentage} className="h-1" />
                    </div>
                    <div className="ml-4 space-y-1">
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          onClick={() => setSection("team-dashboard")}
                          className={getNavClass("team-dashboard")}
                        >
                          <Target className="h-3 w-3" />
                          <span className="text-sm">Team Dashboard</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          onClick={() => setSection("team")}
                          className={getNavClass("team")}
                        >
                          <Users className="h-3 w-3" />
                          <span className="text-sm">Team Members</span>
                          {hasContent(completionCounts.team) && (
                            <Badge variant="secondary" className="ml-auto text-xs">
                              {completionCounts.team}
                            </Badge>
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          onClick={() => setSection("pd")}
                          className={getNavClass("pd")}
                        >
                          <Lightbulb className="h-3 w-3" />
                          <span className="text-sm">Professional Development</span>
                          {hasContent(completionCounts.pd) && (
                            <Badge variant="secondary" className="ml-auto text-xs">
                              {completionCounts.pd}
                            </Badge>
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </div>
                  </CollapsibleContent>
                )}
              </Collapsible>

              {/* Communication & Engagement */}
              <Collapsible open={communicationOpen} onOpenChange={setCommunicationOpen}>
                <SidebarMenuItem>
                  <CollapsibleTrigger className="w-full" asChild>
                    <SidebarMenuButton
                      onClick={() => setSection("communication")}
                      className="hover:bg-muted/50"
                    >
                      <MessageSquare className="h-4 w-4" />
                      {!collapsed && (
                        <>
                          <span>Communication & Engagement</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge 
                                  variant={getCommunicationProgress().percentage === 100 ? "default" : "secondary"}
                                  className="ml-auto mr-1"
                                >
                                  {getCommunicationProgress().completed}/{getCommunicationProgress().total}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="right">
                                <p className="text-xs">{getCommunicationProgress().percentage}% complete</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCommunicationOpen(!communicationOpen);
                            }}
                            className="ml-1 p-1 hover:bg-muted rounded"
                          >
                            {communicationOpen ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        </>
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                </SidebarMenuItem>
                {!collapsed && (
                  <CollapsibleContent>
                    <div className="mb-2 mx-4">
                      <Progress value={getCommunicationProgress().percentage} className="h-1" />
                    </div>
                    <div className="ml-4 space-y-1">
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          onClick={() => setSection("communication")}
                          className={getNavClass("communication")}
                        >
                          <MessageSquare className="h-3 w-3" />
                          <span className="text-sm">Communication Plan</span>
                          {hasContent(completionCounts.communication) && (
                            <Badge variant="secondary" className="ml-auto text-xs">
                              {completionCounts.communication}
                            </Badge>
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </div>
                  </CollapsibleContent>
                )}
              </Collapsible>

              {/* Execution Planning */}
              <Collapsible open={executionOpen} onOpenChange={setExecutionOpen}>
                <SidebarMenuItem>
                  <CollapsibleTrigger className="w-full" asChild>
                    <SidebarMenuButton
                      onClick={() => setSection("timeline")}
                      className="hover:bg-muted/50"
                    >
                      <Calendar className="h-4 w-4" />
                      {!collapsed && (
                        <>
                          <span>Execution Planning</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge 
                                  variant={getExecutionProgress().percentage === 100 ? "default" : "secondary"}
                                  className="ml-auto mr-1"
                                >
                                  {getExecutionProgress().completed}/{getExecutionProgress().total}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="right">
                                <p className="text-xs">{getExecutionProgress().percentage}% complete</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExecutionOpen(!executionOpen);
                            }}
                            className="ml-1 p-1 hover:bg-muted rounded"
                          >
                            {executionOpen ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        </>
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                </SidebarMenuItem>
                {!collapsed && (
                  <CollapsibleContent>
                    <div className="mb-2 mx-4">
                      <Progress value={getExecutionProgress().percentage} className="h-1" />
                    </div>
                    <div className="ml-4 space-y-1">
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          onClick={() => setSection("timeline")}
                          className={getNavClass("timeline")}
                        >
                          <Calendar className="h-3 w-3" />
                          <span className="text-sm">Timeline & Milestones</span>
                          {hasContent(completionCounts.timeline) && (
                            <Badge variant="secondary" className="ml-auto text-xs">
                              {completionCounts.timeline}
                            </Badge>
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          onClick={() => setSection("risks")}
                          className={getNavClass("risks")}
                        >
                          <Shield className="h-3 w-3" />
                          <span className="text-sm">Risk Management</span>
                          {hasContent(completionCounts.risks) && (
                            <Badge variant="secondary" className="ml-auto text-xs">
                              {completionCounts.risks}
                            </Badge>
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          onClick={() => setSection("resources")}
                          className={getNavClass("resources")}
                        >
                          <Settings className="h-3 w-3" />
                          <span className="text-sm">Resource Allocation</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </div>
                  </CollapsibleContent>
                )}
              </Collapsible>

              {/* Quality Assurance */}
              <Collapsible open={qualityOpen} onOpenChange={setQualityOpen}>
                <SidebarMenuItem>
                  <CollapsibleTrigger className="w-full" asChild>
                    <SidebarMenuButton
                      onClick={() => setSection("fidelity")}
                      className="hover:bg-muted/50"
                    >
                      <Eye className="h-4 w-4" />
                      {!collapsed && (
                        <>
                          <span>Quality Assurance</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge 
                                  variant={getQualityProgress().percentage === 100 ? "default" : "secondary"}
                                  className="ml-auto mr-1"
                                >
                                  {getQualityProgress().completed}/{getQualityProgress().total}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="right">
                                <p className="text-xs">{getQualityProgress().percentage}% complete</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setQualityOpen(!qualityOpen);
                            }}
                            className="ml-1 p-1 hover:bg-muted rounded"
                          >
                            {qualityOpen ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        </>
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                </SidebarMenuItem>
                {!collapsed && (
                  <CollapsibleContent>
                    <div className="mb-2 mx-4">
                      <Progress value={getQualityProgress().percentage} className="h-1" />
                    </div>
                    <div className="ml-4 space-y-1">
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          onClick={() => setSection("fidelity")}
                          className={getNavClass("fidelity")}
                        >
                          <Eye className="h-3 w-3" />
                          <span className="text-sm">Fidelity Monitoring</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          onClick={() => setSection("adaptation")}
                          className={getNavClass("adaptation")}
                        >
                          <Settings className="h-3 w-3" />
                          <span className="text-sm">Adaptation Protocol</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </div>
                  </CollapsibleContent>
                )}
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
