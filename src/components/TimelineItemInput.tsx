import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineItemInputProps {
  items: string[];
  onChange: (items: string[]) => void;
  className?: string;
  itemClassName?: string;
  placeholder?: string;
  itemTypeName?: string;
}

const FREQUENCY_OPTIONS = [
  { value: "weekly", label: "Weekly" },
  { value: "fortnightly", label: "Fortnightly" },
  { value: "monthly", label: "Monthly" },
  { value: "bi-monthly", label: "Bi-monthly" },
  { value: "half-termly", label: "Half-termly" },
  { value: "termly", label: "Termly" },
  { value: "end-of-year-2024", label: "End of Year 2024" },
  { value: "end-of-year-2025", label: "End of Year 2025" },
  { value: "end-of-year-2026", label: "End of Year 2026" },
  { value: "custom", label: "Custom..." },
];

export function TimelineItemInput({
  items,
  onChange,
  className,
  itemClassName = "bg-purple-50 text-purple-900 border-purple-200 dark:bg-purple-950 dark:text-purple-100 dark:border-purple-800",
  placeholder = "e.g., Fidelity checks, Review meetings, Outcome reporting",
  itemTypeName = "timeline activity"
}: TimelineItemInputProps) {
  const [selectedFrequency, setSelectedFrequency] = useState<string>("");
  const [activityDescription, setActivityDescription] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleFrequencyChange = (value: string) => {
    setSelectedFrequency(value);
    setShowCustomInput(value === "custom");
  };

  const handleAdd = () => {
    if (!activityDescription.trim()) return;

    let timelineEntry: string;
    
    if (selectedFrequency === "custom" || !selectedFrequency) {
      // Just use the activity description if custom or no frequency selected
      timelineEntry = activityDescription.trim();
    } else {
      // Combine frequency with activity description
      const frequencyLabel = FREQUENCY_OPTIONS.find(opt => opt.value === selectedFrequency)?.label || "";
      timelineEntry = `${activityDescription.trim()} (${frequencyLabel})`;
    }

    if (!items.includes(timelineEntry)) {
      onChange([...items, timelineEntry]);
      setActivityDescription("");
      setSelectedFrequency("");
      setShowCustomInput(false);
    }
  };

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Input Section */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            value={activityDescription}
            onChange={(e) => setActivityDescription(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="flex-1"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={selectedFrequency} onValueChange={handleFrequencyChange}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select frequency (optional)" />
            </SelectTrigger>
            <SelectContent className="bg-background">
              {FREQUENCY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            type="button" 
            onClick={handleAdd}
            disabled={!activityDescription.trim()}
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>

        {showCustomInput && (
          <p className="text-xs text-muted-foreground">
            Tip: With custom selected, just enter the full timeline description including frequency
          </p>
        )}
      </div>

      {/* List of Items */}
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div
              key={index}
              className={cn(
                "flex items-start gap-2 p-3 rounded-md border",
                itemClassName
              )}
            >
              <span className="flex-1 text-sm">{item}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(index)}
                className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Count */}
      {items.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {items.length} {items.length === 1 ? itemTypeName : `${itemTypeName}s`} added
        </p>
      )}
    </div>
  );
}
