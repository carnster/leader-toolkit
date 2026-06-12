import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { parseDateOnly } from "@/lib/dates";
import { usePDActivities, PDActivity } from "@/hooks/usePDActivities";
import { useActiveIngredients } from "@/hooks/useActiveIngredients";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TeamMember } from "@/hooks/useTeamMembers";

interface PDActivityDialogProps {
  activity?: PDActivity;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initiativeId: string;
  teamMembers?: TeamMember[];
}

export function PDActivityDialog({ activity, open, onOpenChange, initiativeId, teamMembers = [] }: PDActivityDialogProps) {
  const { createActivity, updateActivity, deleteActivity, isCreating, isUpdating, isDeleting } = usePDActivities(initiativeId);
  const { activeIngredients, isLoading: isLoadingIngredients } = useActiveIngredients(initiativeId);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    activity_type: activity?.activity_type || "initial_training",
    title: activity?.title || "",
    description: activity?.description || "",
    facilitator: activity?.facilitator || "",
    facilitator_id: activity?.facilitator_id || "",
    target_audience: activity?.target_audience || [""],
    scheduled_date: activity?.scheduled_date ? parseDateOnly(activity.scheduled_date) : undefined,
    duration_minutes: activity?.duration_minutes || undefined,
    completion_status: activity?.completion_status || "planned",
    attendance_count: activity?.attendance_count || undefined,
    fidelity_focus: activity?.fidelity_focus || [""],
  });

  useEffect(() => {
    if (activity) {
      setFormData({
        activity_type: activity.activity_type,
        title: activity.title,
        description: activity.description || "",
        facilitator: activity.facilitator || "",
        facilitator_id: activity.facilitator_id || "",
        target_audience: activity.target_audience && activity.target_audience.length > 0 ? activity.target_audience : [""],
        scheduled_date: activity.scheduled_date ? parseDateOnly(activity.scheduled_date) : undefined,
        duration_minutes: activity.duration_minutes || undefined,
        completion_status: activity.completion_status,
        attendance_count: activity.attendance_count || undefined,
        fidelity_focus: activity.fidelity_focus && activity.fidelity_focus.length > 0 ? activity.fidelity_focus : [""],
      });
    } else {
      setFormData({
        activity_type: "initial_training",
        title: "",
        description: "",
        facilitator: "",
        facilitator_id: "",
        target_audience: [""],
        scheduled_date: undefined,
        duration_minutes: undefined,
        completion_status: "planned",
        attendance_count: undefined,
        fidelity_focus: [""],
      });
    }
  }, [activity, open]);

  const handleSubmit = () => {
    const data = {
      activity_type: formData.activity_type as PDActivity["activity_type"],
      title: formData.title,
      description: formData.description || null,
      facilitator: formData.facilitator || null,
      facilitator_id: formData.facilitator_id || null,
      target_audience: formData.target_audience.filter(a => a.trim() !== ""),
      scheduled_date: formData.scheduled_date ? format(formData.scheduled_date, "yyyy-MM-dd") : null,
      duration_minutes: formData.duration_minutes || null,
      completion_status: formData.completion_status as PDActivity["completion_status"],
      attendance_count: formData.attendance_count || null,
      fidelity_focus: formData.fidelity_focus.filter(f => f.trim() !== ""),
    };

    if (activity) {
      updateActivity(
        { id: activity.id, ...data },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createActivity(data, { onSuccess: () => onOpenChange(false) });
    }
  };

  const handleDelete = () => {
    if (activity) {
      deleteActivity(activity.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          onOpenChange(false);
        },
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{activity ? "Edit PD Activity" : "Add PD Activity"}</DialogTitle>
            <DialogDescription>
              {activity ? "Update professional development details" : "Schedule a professional development activity"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="activity_type">Activity Type *</Label>
              <Select value={formData.activity_type} onValueChange={(value) => setFormData({ ...formData, activity_type: value as PDActivity["activity_type"] })}>
                <SelectTrigger id="activity_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="initial_training">Initial Training</SelectItem>
                  <SelectItem value="ongoing_coaching">Ongoing Coaching</SelectItem>
                  <SelectItem value="collaborative_learning">Collaborative Learning</SelectItem>
                  <SelectItem value="external_workshop">External Workshop</SelectItem>
                  <SelectItem value="self_directed">Self-Directed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Activity Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Introduction to PBIS Framework"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                placeholder="Brief description of the activity"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="facilitator_id">Facilitator (Team Member)</Label>
              <Select 
                value={formData.facilitator_id || "unassigned"} 
                onValueChange={(value) => {
                  const selectedMember = teamMembers.find(m => m.id === value);
                  setFormData({ 
                    ...formData, 
                    facilitator_id: value === "unassigned" ? "" : value,
                    facilitator: value === "unassigned" ? "" : (selectedMember?.name || selectedMember?.profiles?.full_name || "")
                  });
                }}
              >
                <SelectTrigger id="facilitator_id">
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">None</SelectItem>
                  {teamMembers.map(member => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name || member.profiles?.full_name || "Unnamed Member"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration_minutes || ""}
                onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="60"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Scheduled Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.scheduled_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.scheduled_date ? format(formData.scheduled_date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.scheduled_date}
                      onSelect={(date) => setFormData({ ...formData, scheduled_date: date })}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="completion_status">Status</Label>
                <Select value={formData.completion_status} onValueChange={(value) => setFormData({ ...formData, completion_status: value as PDActivity["completion_status"] })}>
                  <SelectTrigger id="completion_status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.completion_status === "completed" && (
              <div className="space-y-2">
                <Label htmlFor="attendance">Attendance Count</Label>
                <Input
                  id="attendance"
                  type="number"
                  value={formData.attendance_count || ""}
                  onChange={(e) => setFormData({ ...formData, attendance_count: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="Number of attendees"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Target Audience</Label>
              {formData.target_audience.map((audience, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={audience}
                    onChange={(e) => {
                      const newAudience = [...formData.target_audience];
                      newAudience[index] = e.target.value;
                      setFormData({ ...formData, target_audience: newAudience });
                    }}
                    placeholder={`e.g., All teachers, Grade 3-5, Leadership team`}
                  />
                  {formData.target_audience.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const newAudience = formData.target_audience.filter((_, i) => i !== index);
                        setFormData({ ...formData, target_audience: newAudience });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFormData({ ...formData, target_audience: [...formData.target_audience, ""] })}
              >
                <Plus className="mr-2 h-3 w-3" />
                Add Audience
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Fidelity Focus Areas (Active Ingredients)</Label>
              {isLoadingIngredients ? (
                <p className="text-sm text-muted-foreground">Loading active ingredients...</p>
              ) : activeIngredients.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active ingredients defined yet. Add them in the Strategic Foundation section first.</p>
              ) : (
                <ScrollArea className="h-[200px] rounded-md border p-4">
                  <div className="space-y-3">
                    {activeIngredients.map((ingredient) => {
                      const isChecked = formData.fidelity_focus.includes(ingredient.name);
                      return (
                        <div key={ingredient.id} className="flex items-start space-x-3">
                          <Checkbox
                            id={`ingredient-${ingredient.id}`}
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              const newFocus = checked
                                ? [...formData.fidelity_focus.filter(f => f !== ""), ingredient.name]
                                : formData.fidelity_focus.filter(f => f !== ingredient.name);
                              setFormData({ ...formData, fidelity_focus: newFocus.length > 0 ? newFocus : [""] });
                            }}
                          />
                          <div className="flex-1 space-y-1">
                            <label
                              htmlFor={`ingredient-${ingredient.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {ingredient.name}
                              {ingredient.is_core && (
                                <span className="ml-2 text-xs text-primary">(Core)</span>
                              )}
                            </label>
                            {ingredient.description && (
                              <p className="text-xs text-muted-foreground">{ingredient.description}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>

            <div className="flex justify-between pt-4">
              {activity && (
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
                  disabled={!formData.title || isCreating || isUpdating}
                >
                  {isCreating || isUpdating ? "Saving..." : activity ? "Save Changes" : "Add Activity"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {activity && (
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete PD Activity?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this professional development activity. This action cannot be undone.
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
