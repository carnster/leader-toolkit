import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MultiItemInputProps {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  addButtonText?: string;
  className?: string;
  itemClassName?: string;
}

export function MultiItemInput({
  items,
  onChange,
  placeholder = "Enter item and click Add",
  addButtonText = "Add",
  className,
  itemClassName = "bg-primary/10 text-primary border-primary/20"
}: MultiItemInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !items.includes(trimmed)) {
      onChange([...items, trimmed]);
      setInputValue("");
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
      {/* Input and Add Button */}
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button 
          type="button" 
          onClick={handleAdd}
          disabled={!inputValue.trim()}
          variant="outline"
        >
          <Plus className="h-4 w-4 mr-1" />
          {addButtonText}
        </Button>
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
          {items.length} {items.length === 1 ? "item" : "items"} added
        </p>
      )}
    </div>
  );
}
