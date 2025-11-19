import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Indicator } from "@/hooks/useIndicators";
import { z } from "zod";

const indicatorSchema = z.object({
  name: z.string()
    .trim()
    .min(1, { message: "Indicator name is required" })
    .max(200, { message: "Name must be less than 200 characters" }),
  schedule: z.string().nullable(),
  target_value: z.number()
    .nullable()
    .refine(val => val === null || val >= 0, {
      message: "Target value must be positive"
    }),
});

interface EditIndicatorDialogProps {
  indicator: Indicator | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, updates: Partial<Indicator>) => void;
}

const FREQUENCY_OPTIONS = [
  { value: "weekly", label: "Weekly" },
  { value: "fortnightly", label: "Fortnightly" },
  { value: "monthly", label: "Monthly" },
  { value: "bi-monthly", label: "Bi-monthly" },
  { value: "half-termly", label: "Half-termly" },
  { value: "termly", label: "Termly" },
  { value: "end-of-year", label: "End of Year" },
  { value: "custom", label: "Custom" },
];

export function EditIndicatorDialog({ indicator, open, onOpenChange, onSave }: EditIndicatorDialogProps) {
  const [name, setName] = useState(indicator?.name || "");
  const [schedule, setSchedule] = useState(indicator?.schedule || "");
  const [targetValue, setTargetValue] = useState(indicator?.target_value?.toString() || "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  // Update local state when indicator changes
  useState(() => {
    if (indicator) {
      setName(indicator.name);
      setSchedule(indicator.schedule || "");
      setTargetValue(indicator.target_value?.toString() || "");
      setErrors({});
    }
  });

  const handleSave = () => {
    if (!indicator) return;

    // Validate inputs
    const result = indicatorSchema.safeParse({
      name: name,
      schedule: schedule || null,
      target_value: targetValue ? parseFloat(targetValue) : null,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((error) => {
        if (error.path[0]) {
          fieldErrors[error.path[0].toString()] = error.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    // Save updates
    onSave(indicator.id, {
      name: name.trim(),
      schedule: schedule || null,
      target_value: targetValue ? parseFloat(targetValue) : null,
    });

    onOpenChange(false);
  };

  const handleCancel = () => {
    // Reset to original values
    if (indicator) {
      setName(indicator.name);
      setSchedule(indicator.schedule || "");
      setTargetValue(indicator.target_value?.toString() || "");
    }
    setErrors({});
    onOpenChange(false);
  };

  if (!indicator) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Indicator</DialogTitle>
          <DialogDescription>
            Update the indicator name, measurement frequency, and target value
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Indicator Name */}
          <div className="space-y-2">
            <Label htmlFor="indicator-name">
              Indicator Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="indicator-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) {
                  setErrors({ ...errors, name: "" });
                }
              }}
              placeholder="e.g., Teacher completion of lesson plans"
              maxLength={200}
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Type (Read-only) */}
          <div className="space-y-2">
            <Label>Type</Label>
            <div className="px-3 py-2 rounded-md border bg-muted text-sm">
              {indicator.type === "leading" ? "Leading Indicator" : "Lagging Indicator"}
            </div>
            <p className="text-xs text-muted-foreground">
              Type cannot be changed after creation
            </p>
          </div>

          {/* Measurement Frequency */}
          <div className="space-y-2">
            <Label htmlFor="schedule">Measurement Frequency</Label>
            <Select value={schedule} onValueChange={setSchedule}>
              <SelectTrigger id="schedule">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.schedule && (
              <p className="text-sm text-destructive">{errors.schedule}</p>
            )}
          </div>

          {/* Target Value */}
          <div className="space-y-2">
            <Label htmlFor="target-value">Target Value (Optional)</Label>
            <Input
              id="target-value"
              type="number"
              value={targetValue}
              onChange={(e) => {
                setTargetValue(e.target.value);
                if (errors.target_value) {
                  setErrors({ ...errors, target_value: "" });
                }
              }}
              placeholder="e.g., 85"
              step="0.1"
              min="0"
              className={errors.target_value ? "border-destructive" : ""}
            />
            {errors.target_value && (
              <p className="text-sm text-destructive">{errors.target_value}</p>
            )}
            <p className="text-xs text-muted-foreground">
              The goal or benchmark you're aiming for with this indicator
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
