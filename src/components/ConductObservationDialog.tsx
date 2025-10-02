import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import { useFidelityLogs } from "@/hooks/useFidelityLogs";
import { useFidelityChecklists, type ChecklistItem } from "@/hooks/useFidelityChecklists";
import { useObservationSchedules, type ObservationSchedule } from "@/hooks/useObservationSchedules";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useActiveIngredients } from "@/hooks/useActiveIngredients";

interface ConductObservationDialogProps {
  schedule?: ObservationSchedule;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initiativeId: string;
}

interface ChecklistResponse {
  [itemId: string]: number;
}

export function ConductObservationDialog({ schedule, open, onOpenChange, initiativeId }: ConductObservationDialogProps) {
  const { createLog, isCreating } = useFidelityLogs(initiativeId);
  const { checklists } = useFidelityChecklists(initiativeId);
  const { updateSchedule } = useObservationSchedules(initiativeId);
  const { activeIngredients } = useActiveIngredients(initiativeId);
  
  const [selectedIngredientId, setSelectedIngredientId] = useState(schedule?.active_ingredient_id || "");
  const [selectedChecklistId, setSelectedChecklistId] = useState("");
  const [rating, setRating] = useState(3);
  const [checklistResponses, setChecklistResponses] = useState<ChecklistResponse>({});
  const [notes, setNotes] = useState("");

  const selectedChecklist = checklists.find(c => c.id === selectedChecklistId);
  const coreIngredients = activeIngredients.filter(ing => ing.is_core);

  useEffect(() => {
    if (open) {
      setSelectedIngredientId(schedule?.active_ingredient_id || "");
      setSelectedChecklistId("");
      setRating(3);
      setChecklistResponses({});
      setNotes("");
    }
  }, [open, schedule]);

  useEffect(() => {
    // Auto-select checklist if ingredient changes
    if (selectedIngredientId) {
      const matchingChecklist = checklists.find(c => c.active_ingredient_id === selectedIngredientId);
      if (matchingChecklist) {
        setSelectedChecklistId(matchingChecklist.id);
        // Initialize responses
        const initialResponses: ChecklistResponse = {};
        matchingChecklist.checklist_items.forEach(item => {
          initialResponses[item.id] = 3; // Default to middle rating
        });
        setChecklistResponses(initialResponses);
      }
    }
  }, [selectedIngredientId, checklists]);

  const handleSubmit = async () => {
    if (!selectedIngredientId) return;

    // Calculate average rating if using checklist
    const finalRating = selectedChecklist 
      ? Object.values(checklistResponses).reduce((sum, val) => sum + val, 0) / Object.values(checklistResponses).length
      : rating;

    const logData = {
      initiative_id: initiativeId,
      component_id: selectedIngredientId,
      observer_id: schedule?.observer_id || null,
      rating: Math.round(finalRating),
      notes: notes || null,
      schedule_id: schedule?.id || null,
      checklist_id: selectedChecklistId || null,
      checklist_responses: selectedChecklist ? checklistResponses : {},
      evidence_photos: [],
      duration_minutes: schedule?.duration_minutes || null,
      location: schedule?.location || null,
    };

    createLog(logData, {
      onSuccess: (newLog) => {
        // Update schedule to completed if it exists
        if (schedule) {
          updateSchedule({
            id: schedule.id,
            status: "completed",
            completed_observation_id: newLog.id,
          });
        }
        onOpenChange(false);
      },
    });
  };

  const ratingLabels = selectedChecklist?.rating_scale.labels || [
    "Not Observed",
    "Emerging",
    "Developing",
    "Proficient",
    "Exemplary"
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Conduct Fidelity Observation</DialogTitle>
          <DialogDescription>
            Record observation data to track implementation quality
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Component Selection */}
          <div className="space-y-2">
            <Label htmlFor="ingredient">Active Ingredient *</Label>
            <Select value={selectedIngredientId} onValueChange={setSelectedIngredientId}>
              <SelectTrigger id="ingredient">
                <SelectValue placeholder="Select ingredient to observe" />
              </SelectTrigger>
              <SelectContent>
                {coreIngredients.map((ing) => (
                  <SelectItem key={ing.id} value={ing.id}>{ing.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Checklist Selection */}
          {selectedIngredientId && checklists.filter(c => c.active_ingredient_id === selectedIngredientId).length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="checklist">Use Observation Checklist (Optional)</Label>
              <Select value={selectedChecklistId} onValueChange={setSelectedChecklistId}>
                <SelectTrigger id="checklist">
                  <SelectValue placeholder="Select a checklist" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Checklist (Manual Rating)</SelectItem>
                  {checklists
                    .filter(c => c.active_ingredient_id === selectedIngredientId)
                    .map((checklist) => (
                      <SelectItem key={checklist.id} value={checklist.id}>
                        {checklist.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Checklist Items */}
          {selectedChecklist && (
            <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
              <h4 className="font-semibold">Observation Indicators</h4>
              {selectedChecklist.checklist_items.map((item: ChecklistItem) => (
                <div key={item.id} className="space-y-3 pb-4 border-b last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-sm">{item.indicator}</p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {ratingLabels[checklistResponses[item.id] - 1] || "Select rating"}
                      </span>
                      <Badge variant="outline">
                        {checklistResponses[item.id] || 3} / {selectedChecklist.rating_scale.max}
                      </Badge>
                    </div>
                    <Slider
                      value={[checklistResponses[item.id] || 3]}
                      onValueChange={([value]) => {
                        setChecklistResponses({ ...checklistResponses, [item.id]: value });
                      }}
                      min={selectedChecklist.rating_scale.min}
                      max={selectedChecklist.rating_scale.max}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>
              ))}
              <div className="pt-2 flex items-center justify-between text-sm bg-primary/5 p-3 rounded-lg">
                <span className="font-medium">Average Fidelity Score:</span>
                <Badge variant="default" className="text-base">
                  {Object.values(checklistResponses).length > 0
                    ? (Object.values(checklistResponses).reduce((sum, val) => sum + val, 0) / Object.values(checklistResponses).length).toFixed(1)
                    : "—"} / {selectedChecklist.rating_scale.max}
                </Badge>
              </div>
            </div>
          )}

          {/* Manual Rating */}
          {!selectedChecklist && selectedIngredientId && (
            <div className="space-y-3 border rounded-lg p-4 bg-muted/20">
              <Label>Overall Fidelity Rating *</Label>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{ratingLabels[rating - 1]}</span>
                <Badge variant="outline">{rating} / 5</Badge>
              </div>
              <Slider
                value={[rating]}
                onValueChange={([value]) => setRating(value)}
                min={1}
                max={5}
                step={1}
                className="w-full"
              />
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observation Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Record specific observations, evidence, strengths, areas for improvement..."
            />
          </div>

          {/* Schedule Info */}
          {schedule && (
            <div className="p-3 rounded-lg bg-muted/30 text-sm space-y-1">
              <p className="font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Completing scheduled observation
              </p>
              <p className="text-muted-foreground text-xs">
                This will mark the scheduled observation as completed
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!selectedIngredientId || isCreating}
            >
              {isCreating ? "Saving..." : "Complete Observation"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
