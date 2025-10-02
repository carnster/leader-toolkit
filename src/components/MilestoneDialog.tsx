import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Trash2, Info } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useTimelineMilestones, TimelineMilestone } from "@/hooks/useTimelineMilestones";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface MilestoneDialogProps {
  milestone?: TimelineMilestone;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initiativeId: string;
}

export function MilestoneDialog({ milestone, open, onOpenChange, initiativeId }: MilestoneDialogProps) {
  const { createMilestone, updateMilestone, deleteMilestone, isCreating, isUpdating, isDeleting } = useTimelineMilestones(initiativeId);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    phase: milestone?.phase || "",
    milestone: milestone?.milestone || "",
    target_date: milestone?.target_date ? new Date(milestone.target_date) : undefined,
    status: milestone?.status || "pending",
    completion_date: milestone?.completion_date ? new Date(milestone.completion_date) : undefined,
    notes: milestone?.notes || "",
    sub_stage: milestone?.sub_stage || "",
  });

  useEffect(() => {
    if (milestone) {
      setFormData({
        phase: milestone.phase,
        milestone: milestone.milestone,
        target_date: new Date(milestone.target_date),
        status: milestone.status,
        completion_date: milestone.completion_date ? new Date(milestone.completion_date) : undefined,
        notes: milestone.notes || "",
        sub_stage: milestone.sub_stage || "",
      });
    } else {
      setFormData({
        phase: "",
        milestone: "",
        target_date: undefined,
        status: "pending",
        completion_date: undefined,
        notes: "",
        sub_stage: "",
      });
    }
  }, [milestone, open]);

  const handleSubmit = () => {
    const data = {
      phase: formData.phase,
      milestone: formData.milestone,
      target_date: formData.target_date ? format(formData.target_date, "yyyy-MM-dd") : "",
      status: formData.status as TimelineMilestone["status"],
      completion_date: formData.completion_date ? format(formData.completion_date, "yyyy-MM-dd") : null,
      notes: formData.notes || null,
      sub_stage: formData.phase === "Implement" ? formData.sub_stage || null : null,
    };

    if (milestone) {
      updateMilestone(
        { id: milestone.id, ...data },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createMilestone(data, { onSuccess: () => onOpenChange(false) });
    }
  };

  const handleDelete = () => {
    if (milestone) {
      deleteMilestone(milestone.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          onOpenChange(false);
        },
      });
    }
  };

  const phaseInfo = {
    "Decide": {
      description: "Assess the problem, explore solutions, and make an informed decision about which evidence-based practice to implement.",
      examples: ["Complete needs assessment", "Form decision-making team", "Review evidence for potential practices", "Select implementation approach", "Secure leadership commitment"]
    },
    "Plan and Prepare": {
      description: "Develop detailed implementation plan, build team capacity, establish systems, and prepare resources.",
      examples: ["Create implementation team", "Develop fidelity monitoring plan", "Establish data collection systems", "Create communication plan", "Secure necessary resources", "Conduct initial staff training"]
    },
    "Implement": {
      description: "Launch and execute the initiative with ongoing support, monitoring, and adjustments to ensure quality implementation.",
      examples: ["Begin practice implementation", "Conduct regular observations", "Provide coaching support", "Collect fidelity data", "Make data-based adjustments", "Hold team check-ins"]
    },
    "Spread and Sustain": {
      description: "Expand successful implementation to additional contexts while embedding practices into ongoing operations.",
      examples: ["Scale to additional classrooms/teams", "Embed into policies and procedures", "Develop onboarding for new staff", "Create sustainability plan", "Build internal capacity", "Evaluate long-term outcomes"]
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{milestone ? "Edit Milestone" : "Add Milestone"}</DialogTitle>
            <DialogDescription>
              {milestone ? "Update milestone details" : "Add a new milestone to the implementation timeline"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phase">Implementation Phase *</Label>
              <Select value={formData.phase} onValueChange={(value) => setFormData({ ...formData, phase: value, sub_stage: value === "Implement" ? formData.sub_stage : "" })}>
                <SelectTrigger id="phase">
                  <SelectValue placeholder="Select implementation phase" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Decide">Decide</SelectItem>
                  <SelectItem value="Plan and Prepare">Plan and Prepare</SelectItem>
                  <SelectItem value="Implement">Implement</SelectItem>
                  <SelectItem value="Spread and Sustain">Spread and Sustain</SelectItem>
                </SelectContent>
              </Select>
              
              {formData.phase && phaseInfo[formData.phase as keyof typeof phaseInfo] && (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div className="space-y-2 flex-1">
                      <p className="text-sm text-muted-foreground">
                        {phaseInfo[formData.phase as keyof typeof phaseInfo].description}
                      </p>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Example milestones:</p>
                        <ul className="text-xs text-muted-foreground space-y-0.5">
                          {phaseInfo[formData.phase as keyof typeof phaseInfo].examples.map((example, idx) => (
                            <li key={idx}>• {example}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {formData.phase === "Implement" && (
              <div className="space-y-2">
                <Label htmlFor="sub_stage">Implementation Phase</Label>
                <Select value={formData.sub_stage} onValueChange={(value) => setFormData({ ...formData, sub_stage: value })}>
                  <SelectTrigger id="sub_stage">
                    <SelectValue placeholder="Select implementation phase" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Installation (0-25%)">
                      <div className="flex flex-col">
                        <span className="font-medium">Installation (0-25%)</span>
                        <span className="text-xs text-muted-foreground">Setting up systems, training staff, preparing resources</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Initial Implementation (26-75%)">
                      <div className="flex flex-col">
                        <span className="font-medium">Initial Implementation (26-75%)</span>
                        <span className="text-xs text-muted-foreground">Beginning implementation with support, learning and adjusting</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Full Implementation (76-100%)">
                      <div className="flex flex-col">
                        <span className="font-medium">Full Implementation (76-100%)</span>
                        <span className="text-xs text-muted-foreground">Fully operational with high fidelity and sustainability</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Track implementation progress through key phases
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="milestone">Milestone *</Label>
              <Input
                id="milestone"
                value={formData.milestone}
                onChange={(e) => setFormData({ ...formData, milestone: e.target.value })}
                placeholder="e.g., Leadership team trained, First PBIS team meeting"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Target Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.target_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.target_date ? format(formData.target_date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.target_date}
                      onSelect={(date) => setFormData({ ...formData, target_date: date })}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as TimelineMilestone["status"] })}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="at_risk">At Risk</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.status === "completed" && (
              <div className="space-y-2">
                <Label>Completion Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.completion_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.completion_date ? format(formData.completion_date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.completion_date}
                      onSelect={(date) => setFormData({ ...formData, completion_date: date })}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder="Additional notes about this milestone"
              />
            </div>

            <div className="flex justify-between pt-4">
              {milestone && (
                <Button
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={!formData.phase || !formData.milestone || !formData.target_date || isCreating || isUpdating}
                >
                  {isCreating || isUpdating ? "Saving..." : milestone ? "Save Changes" : "Add Milestone"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {milestone && (
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Milestone?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this milestone. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
