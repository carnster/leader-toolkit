import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X, Plus } from "lucide-react";
import type { ActiveIngredient } from "@/hooks/useActiveIngredients";
import type { TeamMember } from "@/hooks/useTeamMembers";
import { Checkbox } from "@/components/ui/checkbox";

type ObservationMode = 'quick' | 'detailed' | 'team';

interface FlexibleObservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: ObservationMode;
  activeIngredients: ActiveIngredient[];
  teamMembers: TeamMember[];
  onSubmit: (log: any) => void;
  isSubmitting: boolean;
}

export function FlexibleObservationDialog({
  open,
  onOpenChange,
  mode,
  activeIngredients,
  teamMembers,
  onSubmit,
  isSubmitting
}: FlexibleObservationDialogProps) {
  const [selectedIngredient, setSelectedIngredient] = useState<string>("");
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [followUpActions, setFollowUpActions] = useState<string[]>([]);
  const [newAction, setNewAction] = useState<string>("");
  
  // Team check-in specific fields
  const [teamProgress, setTeamProgress] = useState<string>("");
  const [teamWorking, setTeamWorking] = useState<string>("");
  const [teamBarriers, setTeamBarriers] = useState<string>("");
  const [teamAdaptations, setTeamAdaptations] = useState<string>("");

  const handleSubmit = () => {
    let consolidatedNotes = notes;
    
    // For team check-ins, consolidate all team fields into notes
    if (mode === 'team') {
      const sections = [];
      if (teamProgress) sections.push(`**Implementation Progress:** ${teamProgress}`);
      if (teamWorking) sections.push(`**What's Working / Needs Adjustment:** ${teamWorking}`);
      if (teamBarriers) sections.push(`**Barriers & Solutions:** ${teamBarriers}`);
      if (teamAdaptations) sections.push(`**Adaptation Decisions:** ${teamAdaptations}`);
      if (notes) sections.push(`**Additional Notes:** ${notes}`);
      consolidatedNotes = sections.join('\n\n');
    }
    
    const logData = {
      component_id: selectedIngredient || null,
      rating,
      notes: consolidatedNotes || null,
      log_type: mode,
      participants: mode === 'team' ? selectedParticipants : [],
      follow_up_actions: (mode === 'detailed' || mode === 'team') ? followUpActions : null,
      observer_id: null, // Will be set by the hook
      schedule_id: null,
      checklist_id: null,
      checklist_responses: {},
      evidence_photos: [],
      duration_minutes: null,
      location: null,
    };

    onSubmit(logData);
    handleClose();
  };

  const handleClose = () => {
    setSelectedIngredient("");
    setRating(3);
    setNotes("");
    setSelectedParticipants([]);
    setFollowUpActions([]);
    setNewAction("");
    setTeamProgress("");
    setTeamWorking("");
    setTeamBarriers("");
    setTeamAdaptations("");
    onOpenChange(false);
  };

  const addFollowUpAction = () => {
    if (newAction.trim()) {
      setFollowUpActions([...followUpActions, newAction.trim()]);
      setNewAction("");
    }
  };

  const removeFollowUpAction = (index: number) => {
    setFollowUpActions(followUpActions.filter((_, i) => i !== index));
  };

  const toggleParticipant = (memberId: string) => {
    setSelectedParticipants(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const getModeConfig = () => {
    switch (mode) {
      case 'quick':
        return {
          title: "60-Second Fidelity Log",
          description: "Quick check on core component implementation",
          showIngredient: true,
          showLookFors: true,
          showTeamFields: false,
          showParticipants: false,
          showFollowUp: false,
          notesLabel: "Quick Notes (optional, max 150 chars)",
          notesMax: 150,
        };
      case 'detailed':
        return {
          title: "Coach Observation",
          description: "Detailed observation with feedback notes",
          showIngredient: true,
          showLookFors: true,
          showTeamFields: false,
          showParticipants: false,
          showFollowUp: true,
          notesLabel: "Detailed Observation Notes",
          notesMax: 1000,
        };
      case 'team':
        return {
          title: "Team Check-In",
          description: "Team reflection and adjustment decisions",
          showIngredient: false,
          showLookFors: false,
          showTeamFields: true,
          showParticipants: true,
          showFollowUp: true,
          notesLabel: "Additional Notes (optional)",
          notesMax: 500,
        };
      default:
        return {
          title: "Observation Log",
          description: "Record implementation observation",
          showIngredient: true,
          showLookFors: false,
          showTeamFields: false,
          showParticipants: false,
          showFollowUp: false,
          notesLabel: "Notes",
          notesMax: 500,
        };
    }
  };

  const config = getModeConfig();
  const selectedIngredientData = activeIngredients.find(ing => ing.id === selectedIngredient);
  const canSubmit = selectedIngredient && rating !== null && (mode !== 'team' || selectedParticipants.length > 0);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{config.title}</DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Active Ingredient Selection */}
          <div className="space-y-2">
            <Label htmlFor="ingredient">
              Active Ingredient <span className="text-destructive">*</span>
            </Label>
            <Select value={selectedIngredient} onValueChange={setSelectedIngredient}>
              <SelectTrigger id="ingredient">
                <SelectValue placeholder="Select active ingredient to observe..." />
              </SelectTrigger>
              <SelectContent>
                {activeIngredients.map((ingredient) => (
                  <SelectItem key={ingredient.id} value={ingredient.id}>
                    {ingredient.name}
                    {ingredient.is_core && (
                      <Badge variant="default" className="ml-2 text-xs">CORE</Badge>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Team Participants (team mode only) */}
          {mode === 'team' && (
            <div className="space-y-2">
              <Label>
                Team Participants <span className="text-destructive">*</span>
              </Label>
              <div className="border rounded-lg p-4 space-y-2 max-h-48 overflow-y-auto">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`member-${member.id}`}
                      checked={selectedParticipants.includes(member.id)}
                      onCheckedChange={() => toggleParticipant(member.id)}
                    />
                    <Label
                      htmlFor={`member-${member.id}`}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {member.name || member.profiles?.full_name || 'Unknown'}
                      <span className="text-xs text-muted-foreground ml-2">
                        ({member.role_in_initiative})
                      </span>
                    </Label>
                  </div>
                ))}
              </div>
              {selectedParticipants.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedParticipants.length} participant{selectedParticipants.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>
          )}

          {/* Rating Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>
                Fidelity Rating {mode === 'team' && '(Group Consensus)'}
              </Label>
              <Badge variant="secondary" className="text-lg font-bold">
                {rating ?? "–"}
              </Badge>
            </div>
            <Slider
              value={[rating ?? 3]}
              onValueChange={(value) => setRating(value[0])}
              min={1}
              max={5}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 - Not Observed</span>
              <span>3 - Developing</span>
              <span>5 - Exemplary</span>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">{config.notesLabel}</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={config.notesMax}
              placeholder={
                mode === 'quick'
                  ? "Brief observation (optional)..."
                  : mode === 'team'
                  ? "What's working? What needs adjustment?"
                  : "Detailed observation notes..."
              }
              rows={mode === 'quick' ? 2 : 4}
            />
            <p className="text-xs text-muted-foreground">
              {notes.length}/{config.notesMax} characters
            </p>
          </div>

          {/* Follow-up Actions - Detailed & Team modes */}
          {config.showFollowUp && (
            <div className="space-y-2">
              <Label>{mode === 'team' ? 'Action Items & Next Steps' : 'Follow-up Actions'}</Label>
              <div className="flex gap-2">
                <Input
                  value={newAction}
                  onChange={(e) => setNewAction(e.target.value)}
                  placeholder="Add action item..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addFollowUpAction();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={addFollowUpAction}
                  disabled={!newAction.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {followUpActions.length > 0 && (
                <div className="space-y-2 mt-2">
                  {followUpActions.map((action, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 bg-muted rounded-lg text-sm"
                    >
                      <span className="flex-1">{action}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeFollowUpAction(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "Saving..." : "Save Observation"}
            </Button>
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
