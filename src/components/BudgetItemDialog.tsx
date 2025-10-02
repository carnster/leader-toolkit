import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { useBudgetItems, BudgetItem } from "@/hooks/useBudgetItems";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface BudgetItemDialogProps {
  item?: BudgetItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initiativeId: string;
}

const BUDGET_CATEGORIES = [
  "Professional Development",
  "Personnel Time",
  "Materials & Supplies",
  "Technology & Infrastructure",
  "Evaluation & Monitoring",
  "Other",
];

export function BudgetItemDialog({ item, open, onOpenChange, initiativeId }: BudgetItemDialogProps) {
  const { createBudgetItem, updateBudgetItem, deleteBudgetItem, isCreating, isUpdating, isDeleting } = useBudgetItems(initiativeId);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: item?.category || "",
    description: item?.description || "",
    estimated_cost: item?.estimated_cost?.toString() || "",
    actual_cost: item?.actual_cost?.toString() || "",
    funding_source: item?.funding_source || "",
    notes: item?.notes || "",
  });

  useEffect(() => {
    if (item) {
      setFormData({
        category: item.category,
        description: item.description || "",
        estimated_cost: item.estimated_cost.toString(),
        actual_cost: item.actual_cost?.toString() || "",
        funding_source: item.funding_source || "",
        notes: item.notes || "",
      });
    } else {
      setFormData({
        category: "",
        description: "",
        estimated_cost: "",
        actual_cost: "",
        funding_source: "",
        notes: "",
      });
    }
  }, [item, open]);

  const handleSubmit = () => {
    const data = {
      initiative_id: initiativeId,
      category: formData.category,
      description: formData.description || null,
      estimated_cost: parseFloat(formData.estimated_cost) || 0,
      actual_cost: formData.actual_cost ? parseFloat(formData.actual_cost) : null,
      funding_source: formData.funding_source || null,
      notes: formData.notes || null,
    };

    if (item) {
      updateBudgetItem(
        { id: item.id, ...data },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createBudgetItem(data, { onSuccess: () => onOpenChange(false) });
    }
  };

  const handleDelete = () => {
    if (item) {
      deleteBudgetItem(item.id, {
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
            <DialogTitle>{item ? "Edit Budget Item" : "Add Budget Item"}</DialogTitle>
            <DialogDescription>
              {item ? "Update budget item details" : "Add a new budget item to track costs"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select budget category" />
                </SelectTrigger>
                <SelectContent>
                  {BUDGET_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g., Training materials, coaching stipends"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimated_cost">Estimated Cost *</Label>
                <Input
                  id="estimated_cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.estimated_cost}
                  onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="actual_cost">Actual Cost</Label>
                <Input
                  id="actual_cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.actual_cost}
                  onChange={(e) => setFormData({ ...formData, actual_cost: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="funding_source">Funding Source</Label>
              <Input
                id="funding_source"
                value={formData.funding_source}
                onChange={(e) => setFormData({ ...formData, funding_source: e.target.value })}
                placeholder="e.g., Title I, District Budget, Grant"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder="Additional notes about this budget item"
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
                  disabled={!formData.category || !formData.estimated_cost || isCreating || isUpdating}
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
              <AlertDialogTitle>Delete Budget Item?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this budget item. This action cannot be undone.
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
