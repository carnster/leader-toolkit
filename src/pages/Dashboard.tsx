import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StageProgress } from "@/components/StageProgress";
import { Plus, TrendingUp, Users, CheckCircle2, Trash2, MoreVertical, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { useInitiatives } from "@/hooks/useInitiatives";
import { useDashboardAnalytics } from "@/hooks/useDashboardAnalytics";
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { FidelityTrendsChart } from "@/components/dashboard/FidelityTrendsChart";
import { ReadinessStatsWidget } from "@/components/dashboard/ReadinessStatsWidget";
import { BudgetTrackingChart } from "@/components/dashboard/BudgetTrackingChart";
import { InitiativeHealthWidget } from "@/components/dashboard/InitiativeHealthWidget";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TestNotifications } from "@/components/TestNotifications";
import { TeamDashboard } from "@/components/TeamDashboard";

export default function Dashboard() {
  const { initiatives, isLoading, deleteInitiative, isDeleting } = useInitiatives();
  const { data: analytics, isLoading: analyticsLoading } = useDashboardAnalytics();
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [initiativeToDelete, setInitiativeToDelete] = useState<string | null>(null);

  const handleDeleteClick = (id: string) => {
    setInitiativeToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (initiativeToDelete) {
      deleteInitiative(initiativeToDelete);
      setDeleteDialogOpen(false);
      setInitiativeToDelete(null);
    }
  };

  const stageMap: Record<string, string> = {
    decide: "Decide",
    plan: "Plan",
    implement: "Implement",
    monitor: "Monitor",
    sustain: "Sustain",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">Loading initiatives...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Implementation Dashboard</h1>
          <p className="text-muted-foreground">
            Track and manage your school improvement initiatives
          </p>
        </div>
        <Button onClick={() => navigate('/decide')}>
          <Plus className="mr-2 h-4 w-4" />
          New Initiative
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Initiatives</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsLoading ? "..." : analytics?.totalInitiatives || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {analyticsLoading ? "..." : analytics?.activeInitiatives || 0} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Fidelity</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsLoading ? "..." : analytics?.avgFidelityScore ? `${analytics.avgFidelityScore}/5` : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              {analyticsLoading ? "..." : analytics?.avgFidelityScore ? "Based on observations" : "No data yet"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsLoading ? "..." : analytics?.totalTeamMembers || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all initiatives
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Deadlines</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsLoading ? "..." : analytics?.upcomingDeadlines || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Next 7 days
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="initiatives">Initiatives</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <div className="col-span-4">
              <FidelityTrendsChart />
            </div>
            <div className="col-span-3">
              <InitiativeHealthWidget />
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <ReadinessStatsWidget />
            <BudgetTrackingChart />
          </div>

          <TestNotifications />
        </TabsContent>

        <TabsContent value="initiatives" className="space-y-4">
          {initiatives.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Active Initiatives</CardTitle>
                <CardDescription>
                  Monitor progress across all implementation stages
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {initiatives.map((initiative) => {
                  const stages = [
                    { id: "decide", name: "Decide", completed: initiative.stage !== "decide", current: initiative.stage === "decide" },
                    { id: "plan", name: "Plan", completed: ["implement", "monitor", "sustain"].includes(initiative.stage), current: initiative.stage === "plan" },
                    { id: "implement", name: "Implement", completed: ["monitor", "sustain"].includes(initiative.stage), current: initiative.stage === "implement" },
                    { id: "monitor", name: "Monitor", completed: initiative.stage === "sustain", current: initiative.stage === "monitor" },
                    { id: "sustain", name: "Sustain", completed: false, current: initiative.stage === "sustain" },
                  ];

                  return (
                    <div key={initiative.id} className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <h3 className="font-semibold">{initiative.title}</h3>
                          {initiative.description && (
                            <p className="text-sm text-muted-foreground">{initiative.description}</p>
                          )}
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>Stage: {stageMap[initiative.stage]}</span>
                            {initiative.target_end_date && (
                              <>
                                <span>•</span>
                                <span>Due: {new Date(initiative.target_end_date).toLocaleDateString()}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/${initiative.stage}?initiative=${initiative.id}`}>View Details</Link>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleDeleteClick(initiative.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Initiative
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <div className="pt-2">
                        <StageProgress stages={stages} />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mx-auto">
                    <Plus className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">No initiatives yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Get started by creating your first school improvement initiative
                    </p>
                    <Button onClick={() => navigate('/decide')}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Initiative
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Initiative?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this initiative and all associated data (active ingredients, decision briefs, PDSA cycles, etc.). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
