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
import { Flag, Clock, CheckCircle2, AlertCircle, Pencil, CalendarIcon } from "lucide-react";
import { format, parseISO, isPast, isFuture } from "date-fns";
import { useTimelineMilestones } from "@/hooks/useTimelineMilestones";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useState } from "react";
import { cn } from "@/lib/utils";

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
    const targetDate = parseISO(milestone.target_date);
    if (isPast(targetDate)) return "overdue";
    if (isFuture(targetDate)) return "upcoming";
    return "on-track";
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Completed</Badge>;
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
    });
    
    setEditingMilestone(null);
  };

  const handleCancelEdit = () => {
    setEditingMilestone(null);
  };

  return (
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
      <CardContent className="space-y-6">
        {/* Overall Progress */}
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
      </CardContent>

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
    </Card>
  );
}
