import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImplementationStrategy } from "@/hooks/useImplementationStrategies";

interface ImplementationStrategyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (strategy: Partial<ImplementationStrategy>) => void;
  strategy?: ImplementationStrategy | null;
}

const ericCategories = [
  { value: "enable", label: "Enable - Support capacity building", description: "Train, educate, provide tools" },
  { value: "redesign", label: "Redesign - Adjust context", description: "Modify workflows, systems, structures" },
  { value: "integrate", label: "Integrate - Embed in routine", description: "Make it part of standard practice" },
  { value: "create", label: "Create - Build new supports", description: "Develop new policies, teams, resources" },
];

const statusOptions = [
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On Hold" },
];

export function ImplementationStrategyDialog({ open, onOpenChange, onSave, strategy }: ImplementationStrategyDialogProps) {
  const [formData, setFormData] = useState<Partial<ImplementationStrategy>>({
    eric_category: "enable",
    strategy_name: "",
    description: "",
    target_barrier: "",
    timeline: "",
    resources_needed: "",
    success_indicators: "",
    status: "planned",
  });

  useEffect(() => {
    if (strategy) {
      setFormData(strategy);
    } else {
      setFormData({
        eric_category: "enable",
        strategy_name: "",
        description: "",
        target_barrier: "",
        timeline: "",
        resources_needed: "",
        success_indicators: "",
        status: "planned",
      });
    }
  }, [strategy, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{strategy ? "Edit Implementation Strategy" : "Add Implementation Strategy"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="eric_category">ERIC Category *</Label>
            <select
              id="eric_category"
              className="w-full rounded-md border px-3 py-2"
              value={formData.eric_category}
              onChange={(e) => setFormData({ ...formData, eric_category: e.target.value as any })}
              required
            >
              {ericCategories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            <p className="text-sm text-muted-foreground">
              {ericCategories.find(c => c.value === formData.eric_category)?.description}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="strategy_name">Strategy Name *</Label>
            <Input
              id="strategy_name"
              value={formData.strategy_name}
              onChange={(e) => setFormData({ ...formData, strategy_name: e.target.value })}
              placeholder="e.g., Weekly coaching sessions for teachers"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe how this strategy will be implemented..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_barrier">Target Barrier</Label>
            <Textarea
              id="target_barrier"
              value={formData.target_barrier || ""}
              onChange={(e) => setFormData({ ...formData, target_barrier: e.target.value })}
              placeholder="What specific implementation barrier does this address?"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timeline">Timeline</Label>
              <Input
                id="timeline"
                value={formData.timeline || ""}
                onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                placeholder="e.g., Weeks 1-4"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="w-full rounded-md border px-3 py-2"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="resources_needed">Resources Needed</Label>
            <Textarea
              id="resources_needed"
              value={formData.resources_needed || ""}
              onChange={(e) => setFormData({ ...formData, resources_needed: e.target.value })}
              placeholder="Time, materials, budget, personnel..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="success_indicators">Success Indicators</Label>
            <Textarea
              id="success_indicators"
              value={formData.success_indicators || ""}
              onChange={(e) => setFormData({ ...formData, success_indicators: e.target.value })}
              placeholder="How will you know this strategy is working?"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {strategy ? "Save Changes" : "Add Strategy"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
