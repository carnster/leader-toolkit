import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { parseDateOnly } from "@/lib/dates";
import { useObservationSchedules, ObservationSchedule } from "@/hooks/useObservationSchedules";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useActiveIngredients } from "@/hooks/useActiveIngredients";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface ObservationScheduleDialogProps {
  schedule?: ObservationSchedule;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initiativeId: string;
}

const OBSERVATION_TYPES = [
  { value: "direct_observation", label: "Direct Observation" },
  { value: "self_report", label: "Self-Report" },
  { value: "artifact_review", label: "Artifact Review" },
  { value: "coaching_note", label: "Coaching Note" },
];

export function ObservationScheduleDialog({ schedule, open, onOpenChange, initiativeId }: ObservationScheduleDialogProps) {
  const { createSchedule, updateSchedule, deleteSchedule, isCreating, isUpdating, isDeleting } = useObservationSchedules(initiativeId);
  const { teamMembers } = useTeamMembers(initiativeId);
  const { activeIngredients } = useActiveIngredients(initiativeId);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    active_ingredient_id: schedule?.active_ingredient_id || "",
    observer_id: schedule?.observer_id || "",
    implementer_id: schedule?.implementer_id || "",
    scheduled_date: schedule?.scheduled_date ? parseDateOnly(schedule.scheduled_date) : undefined,
    scheduled_time: schedule?.scheduled_time || "",
    duration_minutes: schedule?.duration_minutes?.toString() || "30",
    observation_type: schedule?.observation_type || "direct_observation",
    location: schedule?.location || "",
    notes: schedule?.notes || "",
  });

  useEffect(() => {
    if (schedule) {
      setFormData({
        active_ingredient_id: schedule.active_ingredient_id || "",
        observer_id: schedule.observer_id || "",
        implementer_id: schedule.implementer_id || "",
        scheduled_date: parseDateOnly(schedule.scheduled_date),
        scheduled_time: schedule.scheduled_time || "",
        duration_minutes: schedule.duration_minutes?.toString() || "30",
        observation_type: schedule.observation_type,
        location: schedule.location || "",
        notes: schedule.notes || "",
      });
    } else {
      setFormData({
        active_ingredient_id: "",
        observer_id: "",
        implementer_id: "",
        scheduled_date: undefined,
        scheduled_time: "",
        duration_minutes: "30",
        observation_type: "direct_observation",
        location: "",
        notes: "",
      });
    }
  }, [schedule, open]);

  const handleSubmit = () => {
    const data = {
      initiative_id: initiativeId,
      active_ingredient_id: formData.active_ingredient_id || null,
      observer_id: formData.observer_id || null,
      implementer_id: formData.implementer_id || null,
      scheduled_date: formData.scheduled_date ? format(formData.scheduled_date, "yyyy-MM-dd") : "",
      scheduled_time: formData.scheduled_time || null,
      duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
      observation_type: formData.observation_type,
      status: "scheduled" as const,
      location: formData.location || null,
      notes: formData.notes || null,
      completed_observation_id: null,
    };

    if (schedule) {
      updateSchedule(
        { id: schedule.id, ...data },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createSchedule(data, { onSuccess: () => onOpenChange(false) });
    }
  };

  const handleDelete = () => {
    if (schedule) {
      deleteSchedule(schedule.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          onOpenChange(false);
        },
      });
    }
  };

  const coreIngredients = activeIngredients.filter(ing => ing.is_core);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{schedule ? "Edit Observation" : "Schedule Observation"}</DialogTitle>
            <DialogDescription>
              {schedule ? "Update observation details" : "Schedule a new fidelity observation"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="active_ingredient">Active Ingredient</Label>
              <Select value={formData.active_ingredient_id} onValueChange={(value) => setFormData({ ...formData, active_ingredient_id: value })}>
                <SelectTrigger id="active_ingredient">
                  <SelectValue placeholder="Select ingredient to observe" />
                </SelectTrigger>
                <SelectContent>
                  {coreIngredients.map((ing) => (
                    <SelectItem key={ing.id} value={ing.id}>{ing.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="observer">Observer</Label>
                <Select value={formData.observer_id} onValueChange={(value) => setFormData({ ...formData, observer_id: value })}>
                  <SelectTrigger id="observer">
                    <SelectValue placeholder="Select observer" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.user_id || member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="implementer">Implementer</Label>
                <Select value={formData.implementer_id} onValueChange={(value) => setFormData({ ...formData, implementer_id: value })}>
                  <SelectTrigger id="implementer">
                    <SelectValue placeholder="Select implementer" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.user_id || member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date *</Label>
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
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="observation_type">Observation Type *</Label>
                <Select value={formData.observation_type} onValueChange={(value) => setFormData({ ...formData, observation_type: value })}>
                  <SelectTrigger id="observation_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OBSERVATION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="5"
                  step="5"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Room 204, Math classroom"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder="Additional notes about this observation"
              />
            </div>

            <div className="flex justify-between pt-4">
              {schedule && (
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
                  disabled={!formData.scheduled_date || !formData.observation_type || isCreating || isUpdating}
                >
                  {isCreating || isUpdating ? "Saving..." : schedule ? "Save Changes" : "Schedule"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {schedule && (
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Observation?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this scheduled observation. This action cannot be undone.
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
