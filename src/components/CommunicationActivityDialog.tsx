import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useCommunicationActivities, CommunicationActivity } from "@/hooks/useCommunicationActivities";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { TeamMember } from "@/hooks/useTeamMembers";

interface CommunicationActivityDialogProps {
  activity?: CommunicationActivity;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initiativeId: string;
  teamMembers?: TeamMember[];
}

const STAKEHOLDER_GROUPS = [
  "Implementation Team",
  "Students/Families",
  "School Leadership",
  "Broader Staff",
  "District Leadership",
  "Community Partners",
  "Other"
];

const ACTIVITY_TYPES = [
  "Pre-Launch",
  "Launch Phase",
  "Implementation Phase",
  "Sustainability Phase",
  "Ongoing"
];

const CHANNELS = [
  "Team Meeting",
  "Email Newsletter",
  "Parent Portal",
  "All-Staff Meeting",
  "PLC/Department Meeting",
  "One-on-One",
  "Family Event",
  "Digital Dashboard",
  "Other"
];

export function CommunicationActivityDialog({ activity, open, onOpenChange, initiativeId, teamMembers = [] }: CommunicationActivityDialogProps) {
  const { createActivity, updateActivity, deleteActivity, isCreating, isUpdating, isDeleting } = useCommunicationActivities(initiativeId);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    stakeholder_group: activity?.stakeholder_group || "",
    activity_type: activity?.activity_type || "",
    description: activity?.description || "",
    channel: activity?.channel || "",
    scheduled_date: activity?.scheduled_date ? new Date(activity.scheduled_date) : undefined,
    completed: activity?.completed || false,
    completed_date: activity?.completed_date ? new Date(activity.completed_date) : undefined,
    notes: activity?.notes || "",
    assigned_to_id: activity?.assigned_to_id || "",
  });

  useEffect(() => {
    if (activity) {
      setFormData({
        stakeholder_group: activity.stakeholder_group,
        activity_type: activity.activity_type,
        description: activity.description,
        channel: activity.channel || "",
        scheduled_date: activity.scheduled_date ? new Date(activity.scheduled_date) : undefined,
        completed: activity.completed,
        completed_date: activity.completed_date ? new Date(activity.completed_date) : undefined,
        notes: activity.notes || "",
        assigned_to_id: activity.assigned_to_id || "",
      });
    } else {
      setFormData({
        stakeholder_group: "",
        activity_type: "",
        description: "",
        channel: "",
        scheduled_date: undefined,
        completed: false,
        completed_date: undefined,
        notes: "",
        assigned_to_id: "",
      });
    }
  }, [activity, open]);

  const handleSubmit = () => {
    const data = {
      stakeholder_group: formData.stakeholder_group,
      activity_type: formData.activity_type,
      description: formData.description,
      channel: formData.channel || null,
      scheduled_date: formData.scheduled_date ? format(formData.scheduled_date, "yyyy-MM-dd") : null,
      completed: formData.completed,
      completed_date: formData.completed && formData.completed_date ? format(formData.completed_date, "yyyy-MM-dd") : null,
      notes: formData.notes || null,
      assigned_to_id: formData.assigned_to_id || null,
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
            <DialogTitle>{activity ? "Edit Communication Activity" : "Add Communication Activity"}</DialogTitle>
            <DialogDescription>
              {activity ? "Update communication details" : "Schedule a stakeholder communication activity"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stakeholder_group">Stakeholder Group *</Label>
                <Select value={formData.stakeholder_group} onValueChange={(value) => setFormData({ ...formData, stakeholder_group: value })}>
                  <SelectTrigger id="stakeholder_group">
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                  <SelectContent>
                    {STAKEHOLDER_GROUPS.map(group => (
                      <SelectItem key={group} value={group}>{group}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="activity_type">Phase/Type *</Label>
                <Select value={formData.activity_type} onValueChange={(value) => setFormData({ ...formData, activity_type: value })}>
                  <SelectTrigger id="activity_type">
                    <SelectValue placeholder="Select phase" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                placeholder="e.g., All-staff introduction to PBIS initiative"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="channel">Channel</Label>
                <Select value={formData.channel} onValueChange={(value) => setFormData({ ...formData, channel: value })}>
                  <SelectTrigger id="channel">
                    <SelectValue placeholder="Select channel" />
                  </SelectTrigger>
                  <SelectContent>
                    {CHANNELS.map(channel => (
                      <SelectItem key={channel} value={channel}>{channel}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
            </div>

            <div className="space-y-2">
              <Label htmlFor="assigned_to_id">Assigned To</Label>
            <Select 
              value={formData.assigned_to_id || "unassigned"} 
              onValueChange={(value) => setFormData({ ...formData, assigned_to_id: value === "unassigned" ? null : value })}
            >
              <SelectTrigger id="assigned_to_id">
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

            <div className="space-y-4 p-4 rounded-lg border">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="completed"
                  checked={formData.completed}
                  onCheckedChange={(checked) => setFormData({ 
                    ...formData, 
                    completed: checked as boolean,
                    completed_date: checked ? (formData.completed_date || new Date()) : undefined
                  })}
                />
                <label
                  htmlFor="completed"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Mark as completed
                </label>
              </div>

              {formData.completed && (
                <div className="space-y-2 pl-6">
                  <Label>Completion Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.completed_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.completed_date ? format(formData.completed_date, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.completed_date}
                        onSelect={(date) => setFormData({ ...formData, completed_date: date })}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder="Additional notes about this communication..."
              />
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
                  disabled={!formData.stakeholder_group || !formData.activity_type || !formData.description || isCreating || isUpdating}
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
              <AlertDialogTitle>Delete Communication Activity?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this communication activity. This action cannot be undone.
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
