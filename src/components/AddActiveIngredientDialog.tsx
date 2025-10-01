import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useActiveIngredients } from "@/hooks/useActiveIngredients";

interface AddActiveIngredientDialogProps {
  initiativeId: string;
}

export function AddActiveIngredientDialog({ initiativeId }: AddActiveIngredientDialogProps) {
  const { createIngredient, isCreating } = useActiveIngredients(initiativeId);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    is_core: true,
    look_fors: ["", "", ""],
  });

  const handleSubmit = () => {
    if (!formData.name) return;

    createIngredient(
      {
        initiative_id: initiativeId,
        name: formData.name,
        description: formData.description,
        category: formData.category || null,
        is_core: formData.is_core,
        look_fors: formData.look_fors.filter(lf => lf.trim() !== ""),
        adaptable_boundaries: null,
      },
      {
        onSuccess: () => {
          setFormData({
            name: "",
            description: "",
            category: "",
            is_core: true,
            look_fors: ["", "", ""],
          });
          setOpen(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Component
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Active Ingredient</DialogTitle>
          <DialogDescription>
            Define a core practice or adaptable element for this initiative
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Component Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Daily structured practice sessions"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what this component involves..."
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
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.is_core ? "core" : "adaptable"}
                onValueChange={(value) => setFormData({ ...formData, is_core: value === "core" })}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="core">Core (Non-negotiable)</SelectItem>
                  <SelectItem value="adaptable">Adaptable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Look-Fors (Observable indicators of quality implementation)</Label>
            {formData.look_fors.map((lookFor, index) => (
              <Input
                key={index}
                value={lookFor}
                onChange={(e) => {
                  const newLookFors = [...formData.look_fors];
                  newLookFors[index] = e.target.value;
                  setFormData({ ...formData, look_fors: newLookFors });
                }}
                placeholder={`Look-for ${index + 1}`}
              />
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

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.name || isCreating}>
              {isCreating ? "Adding..." : "Add Component"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
