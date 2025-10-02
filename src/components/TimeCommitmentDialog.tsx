import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2 } from "lucide-react";
import { useTimeCommitments, TimeCommitment } from "@/hooks/useTimeCommitments";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface TimeCommitmentDialogProps {
  item?: TimeCommitment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initiativeId: string;
}

export function TimeCommitmentDialog({ item, open, onOpenChange, initiativeId }: TimeCommitmentDialogProps) {
  const { createTimeCommitment, updateTimeCommitment, deleteTimeCommitment, isCreating, isUpdating, isDeleting } = useTimeCommitments(initiativeId);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    role_name: item?.role_name || "",
    hours_per_week: item?.hours_per_week?.toString() || "",
    hours_per_month: item?.hours_per_month?.toString() || "",
    description: item?.description || "",
    notes: item?.notes || "",
  });

  useEffect(() => {
    if (item) {
      setFormData({
        role_name: item.role_name,
        hours_per_week: item.hours_per_week?.toString() || "",
        hours_per_month: item.hours_per_month?.toString() || "",
        description: item.description || "",
        notes: item.notes || "",
      });
    } else {
      setFormData({
        role_name: "",
        hours_per_week: "",
        hours_per_month: "",
        description: "",
        notes: "",
      });
    }
  }, [item, open]);

  const handleSubmit = () => {
    const data = {
      initiative_id: initiativeId,
      role_name: formData.role_name,
      hours_per_week: formData.hours_per_week ? parseFloat(formData.hours_per_week) : null,
      hours_per_month: formData.hours_per_month ? parseFloat(formData.hours_per_month) : null,
      description: formData.description || null,
      notes: formData.notes || null,
    };

    if (item) {
      updateTimeCommitment(
        { id: item.id, ...data },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createTimeCommitment(data, { onSuccess: () => onOpenChange(false) });
    }
  };

  const handleDelete = () => {
    if (item) {
      deleteTimeCommitment(item.id, {
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
            <DialogTitle>{item ? "Edit Time Commitment" : "Add Time Commitment"}</DialogTitle>
            <DialogDescription>
              {item ? "Update time commitment details" : "Add a new time commitment by role"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role_name">Role Name *</Label>
              <Input
                id="role_name"
                value={formData.role_name}
                onChange={(e) => setFormData({ ...formData, role_name: e.target.value })}
                placeholder="e.g., Direct Implementers, Implementation Coach"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hours_per_week">Hours Per Week</Label>
                <Input
                  id="hours_per_week"
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.hours_per_week}
                  onChange={(e) => setFormData({ ...formData, hours_per_week: e.target.value })}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hours_per_month">Hours Per Month</Label>
                <Input
                  id="hours_per_month"
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.hours_per_month}
                  onChange={(e) => setFormData({ ...formData, hours_per_month: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g., Delivery time + planning + PD participation"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder="Additional notes about this time commitment"
              />
            </div>

            <div className="flex justify-between pt-4">
              {item && (
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
                  disabled={!formData.role_name || isCreating || isUpdating}
                >
                  {isCreating || isUpdating ? "Saving..." : item ? "Save Changes" : "Add Item"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {item && (
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Time Commitment?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this time commitment. This action cannot be undone.
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
