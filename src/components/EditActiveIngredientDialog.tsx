import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { useActiveIngredients, ActiveIngredient } from "@/hooks/useActiveIngredients";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface EditActiveIngredientDialogProps {
  ingredient: ActiveIngredient;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initiativeId: string;
}

export function EditActiveIngredientDialog({ ingredient, open, onOpenChange, initiativeId }: EditActiveIngredientDialogProps) {
  const { updateIngredient, deleteIngredient, isUpdating, isDeleting } = useActiveIngredients(initiativeId);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: ingredient.name,
    description: ingredient.description || "",
    category: ingredient.category || "",
    is_core: ingredient.is_core,
    look_fors: ingredient.look_fors || ["", "", ""],
  });

  useEffect(() => {
    setFormData({
      name: ingredient.name,
      description: ingredient.description || "",
      category: ingredient.category || "",
      is_core: ingredient.is_core,
      look_fors: ingredient.look_fors && ingredient.look_fors.length > 0 ? ingredient.look_fors : ["", "", ""],
    });
  }, [ingredient]);

  const handleSubmit = () => {
    updateIngredient(
      {
        id: ingredient.id,
        name: formData.name,
        description: formData.description,
        category: formData.category || null,
        is_core: formData.is_core,
        look_fors: formData.look_fors.filter(lf => lf.trim() !== ""),
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  const handleDelete = () => {
    deleteIngredient(ingredient.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        onOpenChange(false);
      },
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Active Ingredient</DialogTitle>
            <DialogDescription>
              Update the details of this component
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Component Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Instruction">Instruction</SelectItem>
                    <SelectItem value="Assessment">Assessment</SelectItem>
                    <SelectItem value="Resources">Resources</SelectItem>
                    <SelectItem value="Environment">Environment</SelectItem>
                    <SelectItem value="Engagement">Engagement</SelectItem>
                    <SelectItem value="Data">Data</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Fidelity Status</Label>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant={formData.is_core ? "destructive" : "outline"}
                    onClick={() => setFormData({ ...formData, is_core: true })}
                    className="flex-1"
                  >
                    CORE (Non-Negotiable)
                  </Button>
                  <Button
                    type="button"
                    variant={!formData.is_core ? "default" : "outline"}
                    onClick={() => setFormData({ ...formData, is_core: false })}
                    className="flex-1"
                  >
                    ADAPTABLE
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formData.is_core 
                    ? "🔒 CORE ingredients must be implemented as designed - essential to effectiveness"
                    : "⚙️ ADAPTABLE ingredients can be adjusted to fit local context while maintaining quality"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Look-Fors (Observable indicators)</Label>
              {formData.look_fors.map((lookFor, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={lookFor}
                    onChange={(e) => {
                      const newLookFors = [...formData.look_fors];
                      newLookFors[index] = e.target.value;
                      setFormData({ ...formData, look_fors: newLookFors });
                    }}
                    placeholder={`Look-for ${index + 1}`}
                  />
                  {formData.look_fors.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const newLookFors = formData.look_fors.filter((_, i) => i !== index);
                        setFormData({ ...formData, look_fors: newLookFors });
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
                onClick={() => setFormData({ ...formData, look_fors: [...formData.look_fors, ""] })}
              >
                <Plus className="mr-2 h-3 w-3" />
                Add Look-For
              </Button>
            </div>

            <div className="flex justify-between pt-4">
              <Button
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={!formData.name || isUpdating}>
                  {isUpdating ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Active Ingredient?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{ingredient.name}". This action cannot be undone.
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
    </>
  );
}
