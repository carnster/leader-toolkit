import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImplementationStrategy } from "@/hooks/useImplementationStrategies";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, HelpCircle } from "lucide-react";
import { TeamMember } from "@/hooks/useTeamMembers";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ERIC_CLUSTERS, type EricCategory } from "@/lib/ericClusters";

interface ImplementationStrategyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (strategy: Partial<ImplementationStrategy>) => void;
  strategy?: ImplementationStrategy | null;
  teamMembers?: TeamMember[];
}

const ericCategories = ERIC_CLUSTERS;

const statusOptions = [
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On Hold" },
];

export function ImplementationStrategyDialog({ open, onOpenChange, onSave, strategy, teamMembers = [] }: ImplementationStrategyDialogProps) {
  const [formData, setFormData] = useState<Partial<ImplementationStrategy>>({
    eric_category: "train_educate",
    strategy_name: "",
    description: "",
    target_barrier: "",
    timeline: "",
    resources_needed: "",
    success_indicators: "",
    status: "planned",
    responsible_party_id: "",
  });
  const [showExamples, setShowExamples] = useState(false);

  useEffect(() => {
    if (strategy) {
      setFormData(strategy);
    } else {
      setFormData({
        eric_category: "train_educate",
        strategy_name: "",
        description: "",
        target_barrier: "",
        timeline: "",
        resources_needed: "",
        success_indicators: "",
        status: "planned",
        responsible_party_id: "",
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
          {/* ERIC Framework Info Banner */}
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="flex items-start gap-2">
              <HelpCircle className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">About ERIC Strategies</p>
                <p className="text-xs text-muted-foreground mt-1">
                  ERIC (Expert Recommendations for Implementing Change, Powell et al. 2015) provides 73 evidence-based implementation strategies organized into nine clusters. Choose strategies that address your specific implementation barriers.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="eric_category">ERIC Category *</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowExamples(!showExamples)}
                className="h-auto py-1 px-2 text-xs"
              >
                {showExamples ? "Hide" : "Show"} Examples
                <ChevronDown className={`ml-1 h-3 w-3 transition-transform ${showExamples ? "rotate-180" : ""}`} />
              </Button>
            </div>
            <select
              id="eric_category"
              className="w-full rounded-md border px-3 py-2"
              value={formData.eric_category}
              onChange={(e) => setFormData({ ...formData, eric_category: e.target.value as EricCategory })}
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
            
            {/* Example Strategies Collapsible */}
            {showExamples && (
              <div className="rounded-md border bg-muted/50 p-3 space-y-2 mt-2">
                <p className="text-xs font-medium">Example {ericCategories.find(c => c.value === formData.eric_category)?.label} strategies:</p>
                <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                  {ericCategories.find(c => c.value === formData.eric_category)?.examples.map((example, idx) => (
                    <li key={idx}>• {example}</li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground italic mt-2">
                  Source: Powell et al. (2015) Implementation Science - 73 ERIC strategies
                </p>
              </div>
            )}
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
            <Label htmlFor="responsible_party_id">Responsible Party</Label>
          <Select 
            value={formData.responsible_party_id || "unassigned"} 
            onValueChange={(value) => setFormData({ ...formData, responsible_party_id: value === "unassigned" ? null : value })}
          >
            <SelectTrigger id="responsible_party_id">
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
