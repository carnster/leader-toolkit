import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Flag, Clock, CheckCircle2, AlertCircle, Pencil, CalendarIcon, Network } from "lucide-react";
import { format, parseISO, isPast, isFuture } from "date-fns";
import { useTimelineMilestones } from "@/hooks/useTimelineMilestones";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { MilestoneDependencyFlow } from "./MilestoneDependencyFlow";

interface TimelineTrackerProps {
  initiativeId: string;
  stage: "implement" | "monitor";
}

export function TimelineTracker({ initiativeId, stage }: TimelineTrackerProps) {
  const { milestones, isLoading, updateMilestone, isUpdating } = useTimelineMilestones(initiativeId);
  const { teamMembers } = useTeamMembers(initiativeId);
  const [completingMilestone, setCompletingMilestone] = useState<any>(null);
  const [completionNotes, setCompletionNotes] = useState("");
  const [completionDate, setCompletionDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [editingMilestone, setEditingMilestone] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    milestone: "",
    target_date: new Date(),
    notes: "",
    owner_id: "",
    depends_on: [] as string[],
  });
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading timeline...</CardTitle>
        </CardHeader>
      </Card>
    );
  }
  
  // Filter milestones relevant to current stage
  const relevantMilestones = milestones.filter(m => {
    if (stage === "implement") {
      return m.sub_stage === "installation" || m.sub_stage === "initial_implementation";
    } else {
      return true; // Monitor shows all milestones
    }
  });
  
  const completedMilestones = relevantMilestones.filter(m => m.status === "completed").length;
  const progressPercentage = relevantMilestones.length > 0 
    ? Math.round((completedMilestones / relevantMilestones.length) * 100)
    : 0;
  
  const getMilestoneStatus = (milestone: any) => {
    if (milestone.status === "completed") return "completed";
    if (milestone.status === "cancelled") return "cancelled";
    
    // Check if blocked by dependencies
    if (isBlocked(milestone)) return "blocked";
    
    const targetDate = parseISO(milestone.target_date);
    if (isPast(targetDate)) return "overdue";
    if (isFuture(targetDate)) return "upcoming";
    return "on-track";
  };

  const isBlocked = (milestone: any): boolean => {
    if (!milestone.depends_on || milestone.depends_on.length === 0) return false;
    
    // Check if any dependencies are not completed
    return milestone.depends_on.some((depId: string) => {
      const dependency = milestones.find(m => m.id === depId);
      return dependency && dependency.status !== "completed";
    });
  };

  const getDependencyNames = (milestone: any): string[] => {
    if (!milestone.depends_on || milestone.depends_on.length === 0) return [];
    
    return milestone.depends_on
      .map((depId: string) => {
        const dependency = milestones.find(m => m.id === depId);
        return dependency ? dependency.milestone : null;
      })
      .filter(Boolean) as string[];
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Completed</Badge>;
      case "blocked":
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-300"><AlertCircle className="h-3 w-3 mr-1" />Blocked</Badge>;
      case "overdue":
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Overdue</Badge>;
      case "upcoming":
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Upcoming</Badge>;
      case "cancelled":
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="default"><Flag className="h-3 w-3 mr-1" />On Track</Badge>;
    }
  };

  const handleMarkComplete = (milestone: any) => {
    setCompletingMilestone(milestone);
    setCompletionNotes(milestone.notes || "");
    setCompletionDate(format(new Date(), "yyyy-MM-dd"));
  };

  const handleConfirmComplete = () => {
    if (!completingMilestone) return;
    
    updateMilestone({
      id: completingMilestone.id,
      status: "completed",
      completion_date: completionDate,
      notes: completionNotes || completingMilestone.notes
    });
    
    setCompletingMilestone(null);
    setCompletionNotes("");
  };

  const handleCancelComplete = () => {
    setCompletingMilestone(null);
    setCompletionNotes("");
  };

  const handleEditMilestone = (milestone: any) => {
    setEditingMilestone(milestone);
    setEditFormData({
      milestone: milestone.milestone,
      target_date: parseISO(milestone.target_date),
      notes: milestone.notes || "",
      owner_id: milestone.owner_id || "",
      depends_on: milestone.depends_on || [],
    });
  };

  const handleConfirmEdit = () => {
    if (!editingMilestone) return;
    
    updateMilestone({
      id: editingMilestone.id,
      milestone: editFormData.milestone,
      target_date: format(editFormData.target_date, "yyyy-MM-dd"),
      notes: editFormData.notes || null,
      owner_id: editFormData.owner_id || null,
      depends_on: editFormData.depends_on.length > 0 ? editFormData.depends_on : null,
    });
    
    setEditingMilestone(null);
  };

  const handleCancelEdit = () => {
    setEditingMilestone(null);
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-primary" />
            <CardTitle>Implementation Timeline (from Plan Stage)</CardTitle>
          </div>
          <CardDescription>
            Track milestone progress and key dates from your implementation plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="list">
                <Flag className="h-4 w-4 mr-2" />
                List View
              </TabsTrigger>
              <TabsTrigger value="flow">
                <Network className="h-4 w-4 mr-2" />
                Dependency Flow
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-6">
        {/* Overall Progress */}
        {relevantMilestones.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Overall Milestone Progress</span>
              <span className="text-muted-foreground">{completedMilestones} of {relevantMilestones.length}</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {progressPercentage}% of {stage === "implement" ? "implementation" : "all"} milestones completed
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <span className="text-sm font-medium">Overall Milestone Progress</span>
            <p className="text-xs text-muted-foreground">
              No milestones to track yet — progress will appear once milestones are added in the Plan stage.
            </p>
          </div>
        )}
        
        {/* Milestone List */}
        <div className="space-y-3">
          {relevantMilestones.length > 0 ? (
            relevantMilestones.map((milestone) => {
              const status = getMilestoneStatus(milestone);
              
              return (
                <div
                  key={milestone.id}
                  className={`p-3 rounded-lg border ${
                    status === "completed" ? "bg-green-50 border-green-200" :
                    status === "overdue" ? "bg-red-50 border-red-200" :
                    "bg-card"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusBadge(status)}
                        <Badge variant="outline" className="text-xs">
                          {milestone.phase}
                        </Badge>
                      </div>
                      <p className="font-medium text-sm">{milestone.milestone}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Target: {format(parseISO(milestone.target_date), "MMM d, yyyy")}
                        {milestone.completion_date && (
                          <span className="ml-2">
                            • Completed: {format(parseISO(milestone.completion_date), "MMM d, yyyy")}
                          </span>
                        )}
                      </p>
                      {milestone.depends_on && milestone.depends_on.length > 0 && (
                        <div className="mt-2 p-2 rounded bg-muted/50 border border-border/50">
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Dependencies:
                          </p>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            {getDependencyNames(milestone).map((depName, idx) => (
                              <li key={idx} className="flex items-center gap-1">
                                <span className="text-primary">→</span>
                                {depName}
                              </li>
                            ))}
                          </ul>
                          {status === "blocked" && (
                            <p className="text-xs text-orange-600 mt-2 font-medium">
                              ⚠️ Complete dependencies before starting this milestone
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditMilestone(milestone)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {milestone.status !== "completed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkComplete(milestone)}
                          disabled={status === "blocked"}
                          title={status === "blocked" ? "Complete dependencies first" : ""}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Mark Complete
                        </Button>
                      )}
                    </div>
                  </div>
                  {milestone.notes && (
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      {milestone.notes}
                    </p>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Flag className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No milestones defined yet in your implementation plan</p>
            </div>
          )}
        </div>
            </TabsContent>

            <TabsContent value="flow">
              <MilestoneDependencyFlow 
                milestones={relevantMilestones}
                onMilestoneClick={(milestone) => handleEditMilestone(milestone)}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Completion Dialog */}
      <Dialog open={!!completingMilestone} onOpenChange={(open) => !open && handleCancelComplete()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Milestone as Complete</DialogTitle>
            <DialogDescription>
              Confirm completion of this milestone and add any notes about the completion.
            </DialogDescription>
          </DialogHeader>
          
          {completingMilestone && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="font-medium">Milestone</Label>
                <p className="text-sm text-muted-foreground">{completingMilestone.milestone}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="completion-date">Completion Date</Label>
                <input
                  id="completion-date"
                  type="date"
                  value={completionDate}
                  onChange={(e) => setCompletionDate(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="completion-notes">Completion Notes (Optional)</Label>
                <Textarea
                  id="completion-notes"
                  placeholder="Add any notes about completing this milestone..."
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleCancelComplete}>
              Cancel
            </Button>
            <Button onClick={handleConfirmComplete} disabled={isUpdating}>
              {isUpdating ? "Marking Complete..." : "Mark Complete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingMilestone} onOpenChange={(open) => !open && handleCancelEdit()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Milestone</DialogTitle>
            <DialogDescription>
              Update milestone details for quick changes during implementation.
            </DialogDescription>
          </DialogHeader>
          
          {editingMilestone && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-milestone">Milestone Name</Label>
                <Input
                  id="edit-milestone"
                  value={editFormData.milestone}
                  onChange={(e) => setEditFormData({ ...editFormData, milestone: e.target.value })}
                  placeholder="Enter milestone name..."
                />
              </div>

              <div className="space-y-2">
                <Label>Target Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !editFormData.target_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editFormData.target_date ? format(editFormData.target_date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={editFormData.target_date}
                      onSelect={(date) => date && setEditFormData({ ...editFormData, target_date: date })}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-owner">Owner (Optional)</Label>
                <Select
                  value={editFormData.owner_id}
                  onValueChange={(value) => setEditFormData({ ...editFormData, owner_id: value })}
                >
                  <SelectTrigger id="edit-owner">
                    <SelectValue placeholder="Select team member..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name || member.profiles?.full_name || "Unknown"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-dependencies">Dependencies (Optional)</Label>
                <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                  <p className="text-xs text-muted-foreground mb-2">
                    Select milestones that must be completed before this one can begin:
                  </p>
                  {milestones
                    .filter(m => m.id !== editingMilestone?.id)
                    .map((m) => (
                      <label key={m.id} className="flex items-start gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={editFormData.depends_on.includes(m.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditFormData({
                                ...editFormData,
                                depends_on: [...editFormData.depends_on, m.id]
                              });
                            } else {
                              setEditFormData({
                                ...editFormData,
                                depends_on: editFormData.depends_on.filter(id => id !== m.id)
                              });
                            }
                          }}
                          className="mt-0.5"
                        />
                        <div className="flex-1">
                          <p className="text-sm">{m.milestone}</p>
                          <p className="text-xs text-muted-foreground">
                            {m.phase} • {format(parseISO(m.target_date), "MMM d, yyyy")}
                            {m.status === "completed" && " • ✓ Completed"}
                          </p>
                        </div>
                      </label>
                    ))}
                  {milestones.length <= 1 && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      No other milestones available
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes (Optional)</Label>
                <Textarea
                  id="edit-notes"
                  placeholder="Add any notes about this milestone..."
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleCancelEdit}>
              Cancel
            </Button>
            <Button onClick={handleConfirmEdit} disabled={isUpdating || !editFormData.milestone}>
              {isUpdating ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
