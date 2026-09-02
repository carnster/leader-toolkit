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
import { BARRIER_DOMAINS } from "@/lib/barrierDomains";
import { useToast } from "@/hooks/use-toast";
import {
  isTwoDimension,
  isTwoDimensionResponse,
  practiceRating,
  isDivergent,
  deliveredNotWorking,
  levelLabel,
  levelColorClass,
  isNotRated,
  summarizeTwoDimensionResponses,
  formatLevelCounts,
  LEVELS,
  STUDENT_GROUPS,
  DEFAULT_STUDENT_GROUP,
  type FidelityCode,
  type TwoDimensionResponse,
} from "@/lib/fidelityModel";

// Sentinel for "no barrier picked": a Radix Select item cannot hold an empty
// string value, so this maps back to null on save.
const NO_BARRIER = "none";

// All codes offered on each Delivery/Enactment selector, worst to... well,
// NO stands apart from the F>P>M>N ladder, so it's appended rather than
// folded into LEVELS order.
const TWO_DIM_CODES: FidelityCode[] = [...LEVELS, "NO"];

interface ConductObservationDialogProps {
  schedule?: ObservationSchedule;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initiativeId: string;
}

// A legacy log rates each item 1-5. A two-dimension log rates each item on
// Delivery and Enactment separately; either side of the pair may be unset
// until the observer picks it.
type ChecklistResponseValue = number | Partial<TwoDimensionResponse>;

interface ChecklistResponse {
  [itemId: string]: ChecklistResponseValue;
}

export function ConductObservationDialog({ schedule, open, onOpenChange, initiativeId }: ConductObservationDialogProps) {
  const { createLog, isCreating } = useFidelityLogs(initiativeId);
  const { checklists } = useFidelityChecklists(initiativeId);
  const { updateSchedule } = useObservationSchedules(initiativeId);
  const { activeIngredients } = useActiveIngredients(initiativeId);
  const { toast } = useToast();

  const [selectedIngredientId, setSelectedIngredientId] = useState(schedule?.active_ingredient_id || "");
  const [selectedChecklistId, setSelectedChecklistId] = useState("");
  const [rating, setRating] = useState(3);
  const [checklistResponses, setChecklistResponses] = useState<ChecklistResponse>({});
  const [notes, setNotes] = useState("");
  const [barrierDomain, setBarrierDomain] = useState<string>(NO_BARRIER);
  // Which student group this observation was scoped to. Fidelity is read to the
  // lowest observed group, so every observation records whose experience it saw.
  const [studentGroup, setStudentGroup] = useState<string>(DEFAULT_STUDENT_GROUP);

  const selectedChecklist = checklists.find(c => c.id === selectedChecklistId);
  const isTwoDim = isTwoDimension(selectedChecklist?.rating_scale as any);
  const coreIngredients = activeIngredients.filter(ing => ing.is_core);

  useEffect(() => {
    if (open) {
      setSelectedIngredientId(schedule?.active_ingredient_id || "");
      setSelectedChecklistId("");
      setRating(3);
      setChecklistResponses({});
      setNotes("");
      setBarrierDomain(NO_BARRIER);
      setStudentGroup(DEFAULT_STUDENT_GROUP);
    }
  }, [open, schedule]);

  useEffect(() => {
    // Auto-select checklist if ingredient changes
    if (selectedIngredientId) {
      const matchingChecklist = checklists.find(c => c.active_ingredient_id === selectedIngredientId);
      if (matchingChecklist) {
        setSelectedChecklistId(matchingChecklist.id);
      }
    }
  }, [selectedIngredientId, checklists]);

  useEffect(() => {
    // (Re)initialize per-item responses whenever the active checklist changes,
    // in whichever shape that checklist's rating scale calls for.
    if (!selectedChecklist) return;
    const initialResponses: ChecklistResponse = {};
    const twoDim = isTwoDimension(selectedChecklist.rating_scale as any);
    selectedChecklist.checklist_items.forEach(item => {
      initialResponses[item.id] = twoDim ? {} : 3;
    });
    setChecklistResponses(initialResponses);
  }, [selectedChecklistId]);

  const updateTwoDimResponse = (itemId: string, dimension: "delivery" | "enactment", value: FidelityCode) => {
    setChecklistResponses(prev => ({
      ...prev,
      [itemId]: { ...(prev[itemId] as Partial<TwoDimensionResponse>), [dimension]: value },
    }));
  };

  const handleSubmit = async () => {
    if (!selectedIngredientId) return;

    let finalRating: number | null;
    let responsesToSave: ChecklistResponse | Record<string, unknown> = {};

    if (selectedChecklist && isTwoDim) {
      // Two-dimension checklists never collapse to a 1-5 average; rating
      // stays null and each item's Delivery/Enactment pair is what's saved.
      finalRating = null;
      responsesToSave = { ...checklistResponses };
      if (isNotRated(checklistResponses as Record<string, TwoDimensionResponse>)) {
        (responsesToSave as Record<string, unknown>)._not_rated = true;
        toast({
          title: "Marked Not Rated",
          description: "More than a quarter of look-fors were Not Observed, so this checklist wasn't scored on the remainder.",
        });
      }
    } else if (selectedChecklist) {
      // Legacy checklist: average the 1-5 item ratings, unchanged. Guard the
      // empty case so a checklist with no items can never write NaN.
      const values = Object.values(checklistResponses).filter(
        (v): v is number => typeof v === "number"
      );
      finalRating = values.length > 0
        ? Math.round(values.reduce((sum, val) => sum + val, 0) / values.length)
        : null;
      responsesToSave = { ...checklistResponses };
    } else {
      finalRating = rating;
      responsesToSave = {};
    }

    // Record which student group this observation saw, on every log type, so
    // fidelity can be read to the lowest observed group. Stored under a
    // reserved key that the two-dimension summariser already skips.
    (responsesToSave as Record<string, unknown>)._student_group = studentGroup;

    const logData = {
      initiative_id: initiativeId,
      component_id: selectedIngredientId,
      observer_id: schedule?.observer_id || null,
      rating: finalRating,
      notes: notes || null,
      schedule_id: schedule?.id || null,
      checklist_id: selectedChecklistId || null,
      checklist_responses: responsesToSave,
      evidence_photos: [],
      duration_minutes: schedule?.duration_minutes || null,
      location: schedule?.location || null,
      log_type: 'standard' as const,
      participants: [],
      follow_up_actions: null,
      barrier_domain: barrierDomain === NO_BARRIER ? null : barrierDomain,
    };

    createLog(logData, {
      onSuccess: (newLog) => {
        // Update schedule to completed if it exists
        if (schedule) {
          updateSchedule({
            id: schedule.id,
            status: "completed",
            completed_observation_id: newLog.log.id,
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
      <DialogContent className="w-[calc(100vw-1.5rem)] max-w-3xl max-h-[90vh] overflow-y-auto">
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
              <Select value={selectedChecklistId || "none"} onValueChange={(value) => setSelectedChecklistId(value === "none" ? "" : value)}>
                <SelectTrigger id="checklist">
                  <SelectValue placeholder="Select a checklist" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Checklist (Manual Rating)</SelectItem>
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

          {/* Student group observed: fidelity is read to the lowest group */}
          {selectedIngredientId && (
            <div className="space-y-2">
              <Label htmlFor="student-group">Student group observed</Label>
              <Select value={studentGroup} onValueChange={setStudentGroup}>
                <SelectTrigger id="student-group">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STUDENT_GROUPS.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Whose experience did this observation see? Fidelity is read to the lowest observed
                group, so recording this is how the equity gap becomes visible.
              </p>
            </div>
          )}

          {/* Checklist Items: two-dimension (Delivery + Enactment) */}
          {selectedChecklist && isTwoDim && (
            <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
              <h4 className="font-semibold">Observation Indicators</h4>
              {selectedChecklist.checklist_items.map((item: ChecklistItem) => {
                const response = (checklistResponses[item.id] as Partial<TwoDimensionResponse>) || {};
                const practice = practiceRating(response.delivery, response.enactment);
                const divergent = isDivergent(response.delivery, response.enactment);
                const dnw = deliveredNotWorking(response.delivery, response.enactment);
                return (
                  <div key={item.id} className="space-y-3 pb-4 border-b last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-sm">{item.indicator}</p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Delivery</Label>
                        <Select
                          value={response.delivery || ""}
                          onValueChange={(value) => updateTwoDimResponse(item.id, "delivery", value as FidelityCode)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Rate" />
                          </SelectTrigger>
                          <SelectContent>
                            {TWO_DIM_CODES.map((code) => (
                              <SelectItem key={code} value={code}>
                                {code} — {levelLabel(code)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Enactment</Label>
                        <Select
                          value={response.enactment || ""}
                          onValueChange={(value) => updateTwoDimResponse(item.id, "enactment", value as FidelityCode)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Rate" />
                          </SelectTrigger>
                          <SelectContent>
                            {TWO_DIM_CODES.map((code) => (
                              <SelectItem key={code} value={code}>
                                {code} — {levelLabel(code)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={levelColorClass(practice)}>
                        Practice: {practice ? levelLabel(practice) : "—"}
                      </Badge>
                      {divergent && (
                        <Badge variant="outline" className={levelColorClass("M")}>
                          {dnw ? "Delivered, Not Working" : "Divergent"}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
              {(() => {
                const summary = summarizeTwoDimensionResponses(checklistResponses as Record<string, TwoDimensionResponse>);
                return (
                  <div className="pt-2 space-y-2 bg-primary/5 p-3 rounded-lg text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">Delivery:</span>
                      <Badge variant="outline">{formatLevelCounts(summary.delivery)}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">Enactment:</span>
                      <Badge variant="outline">{formatLevelCounts(summary.enactment)}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">Divergence flags:</span>
                      <Badge variant="outline" className={summary.divergentCount > 0 ? levelColorClass("M") : undefined}>
                        {summary.divergentCount}
                        {summary.deliveredNotWorkingCount > 0 && ` (${summary.deliveredNotWorkingCount} Delivered, Not Working)`}
                      </Badge>
                    </div>
                    {isNotRated(checklistResponses as Record<string, TwoDimensionResponse>) && (
                      <p className="text-xs text-muted-foreground">
                        More than a quarter of these items are Not Observed. This observation will be marked Not Rated.
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Checklist Items: legacy 1-5 */}
          {selectedChecklist && !isTwoDim && (
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
                        {ratingLabels[(checklistResponses[item.id] as number) - 1] || "Select rating"}
                      </span>
                      <Badge variant="outline">
                        {(checklistResponses[item.id] as number) || 3} / {(selectedChecklist.rating_scale as any).max}
                      </Badge>
                    </div>
                    <Slider
                      value={[(checklistResponses[item.id] as number) || 3]}
                      onValueChange={([value]) => {
                        setChecklistResponses({ ...checklistResponses, [item.id]: value });
                      }}
                      min={(selectedChecklist.rating_scale as any).min}
                      max={(selectedChecklist.rating_scale as any).max}
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
                    ? ((Object.values(checklistResponses) as number[]).reduce((sum, val) => sum + val, 0) / Object.values(checklistResponses).length).toFixed(1)
                    : "—"} / {(selectedChecklist.rating_scale as any).max}
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

          {/* Barrier domain: optional, blameless read on what is in the way */}
          <div className="space-y-2">
            <Label htmlFor="barrier">What is getting in the way? (optional)</Label>
            <Select value={barrierDomain} onValueChange={setBarrierDomain}>
              <SelectTrigger id="barrier">
                <SelectValue placeholder="Skip, or name the likeliest reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_BARRIER}>Not sure yet</SelectItem>
                {BARRIER_DOMAINS.map((domain) => (
                  <SelectItem key={domain} value={domain}>{domain}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              If the practice is not showing up yet, what is the likeliest reason? This is a coaching
              prompt, not a judgment, and it is always optional.
            </p>
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
          <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              className="w-full sm:w-auto"
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
