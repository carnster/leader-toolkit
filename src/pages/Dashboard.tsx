import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StageProgress } from "@/components/StageProgress";
import { Plus, AlertCircle, TrendingUp, Users, CheckCircle2, Trash2, MoreVertical } from "lucide-react";
import { Link } from "react-router-dom";
import { useInitiatives } from "@/hooks/useInitiatives";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { InitiativeTemplateSelector } from "@/components/InitiativeTemplateSelector";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const mockStages = [
  { id: "decide", name: "Decide", completed: true, current: false },
  { id: "plan", name: "Plan", completed: true, current: false },
  { id: "implement", name: "Implement", completed: false, current: true },
  { id: "monitor", name: "Monitor", completed: false, current: false },
  { id: "sustain", name: "Sustain", completed: false, current: false },
];

const mockInitiatives = [
  {
    id: "1",
    title: "Reading Fluency Programme",
    stage: "Implement",
    progress: 65,
    dueDate: "2025-11-15",
    status: "on-track",
    team: 8,
  },
  {
    id: "2",
    title: "Math Mastery Approach",
    stage: "Plan",
    progress: 30,
    dueDate: "2025-12-01",
    status: "at-risk",
    team: 12,
  },
  {
    id: "3",
    title: "Behaviour for Learning",
    stage: "Monitor",
    progress: 85,
    dueDate: "2025-10-30",
    status: "on-track",
    team: 15,
  },
];

const mockAlerts = [
  {
    id: "1",
    type: "warning",
    message: "Reading Fluency: Fidelity check due tomorrow",
    initiative: "Reading Fluency Programme",
  },
  {
    id: "2",
    type: "info",
    message: "Math Mastery: Team meeting scheduled for Thursday",
    initiative: "Math Mastery Approach",
  },
];

export default function Dashboard() {
  const { initiatives, isLoading, createInitiative, deleteInitiative, isCreating, isDeleting } = useInitiatives();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newInitiative, setNewInitiative] = useState({ title: "", description: "" });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [initiativeToDelete, setInitiativeToDelete] = useState<string | null>(null);

  const handleCreateInitiative = () => {
    createInitiative({
      title: newInitiative.title,
      description: newInitiative.description,
      stage: "decide",
      status: "active",
    });
    setNewInitiative({ title: "", description: "" });
    setDialogOpen(false);
  };

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Implementation Dashboard</h1>
          <p className="text-muted-foreground">
            Track and manage your school improvement initiatives
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Initiative
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Initiative</DialogTitle>
              <DialogDescription>
                Start a new school improvement initiative
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-3">
                <InitiativeTemplateSelector />
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or start from scratch</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newInitiative.title}
                  onChange={(e) => setNewInitiative({ ...newInitiative, title: e.target.value })}
                  placeholder="e.g., Student Support Initiative"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={newInitiative.description}
                  onChange={(e) => setNewInitiative({ ...newInitiative, description: e.target.value })}
                  placeholder="Brief description of the initiative..."
                  rows={3}
                />
              </div>
              <Button
                onClick={handleCreateInitiative}
                disabled={!newInitiative.title || isCreating}
                className="w-full"
              >
                {isCreating ? "Creating..." : "Create Initiative"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Initiatives</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{initiatives.length}</div>
            <p className="text-xs text-muted-foreground">
              {initiatives.filter(i => i.status === "active").length} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Fidelity</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78%</div>
            <p className="text-xs text-muted-foreground">
              +5% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">35</div>
            <p className="text-xs text-muted-foreground">
              Across all initiatives
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAlerts.length}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section - Hidden when no alerts */}
      {false && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
            <CardDescription>Items requiring your attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start gap-3 rounded-lg border p-3"
              >
                <AlertCircle
                  className={`h-5 w-5 mt-0.5 ${
                    alert.type === "warning"
                      ? "text-warning"
                      : "text-primary"
                  }`}
                />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{alert.message}</p>
                  <p className="text-xs text-muted-foreground">{alert.initiative}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Active Initiatives */}
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
              const mockStages = [
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
                    <StageProgress stages={mockStages} />
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
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Initiative
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Initiative</DialogTitle>
                      <DialogDescription>
                        Start a new school improvement initiative
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <InitiativeTemplateSelector />
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">Or start from scratch</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          value={newInitiative.title}
                          onChange={(e) => setNewInitiative({ ...newInitiative, title: e.target.value })}
                          placeholder="e.g., Student Support Initiative"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description (optional)</Label>
                        <Textarea
                          id="description"
                          value={newInitiative.description}
                          onChange={(e) => setNewInitiative({ ...newInitiative, description: e.target.value })}
                          placeholder="Brief description of the initiative..."
                          rows={3}
                        />
                      </div>
                      <Button
                        onClick={handleCreateInitiative}
                        disabled={!newInitiative.title || isCreating}
                        className="w-full"
                      >
                        {isCreating ? "Creating..." : "Create Initiative"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and workflows</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Button variant="outline" className="h-auto flex-col items-start p-4" asChild>
              <Link to="/implement">
                <span className="font-semibold">Log Fidelity Check</span>
                <span className="text-sm text-muted-foreground">
                  Quick 60-second observation
                </span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start p-4" asChild>
              <Link to="/monitor">
                <span className="font-semibold">Review Data</span>
                <span className="text-sm text-muted-foreground">
                  Check leading indicators
                </span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start p-4" asChild>
              <Link to="/decide">
                <span className="font-semibold">Start New Initiative</span>
                <span className="text-sm text-muted-foreground">
                  Begin with Decision Brief
                </span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
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
