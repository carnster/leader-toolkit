import { Cloud, CloudOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AutoSaveIndicatorProps {
  isSaving: boolean;
  lastSaved: Date | null;
  className?: string;
}

export function AutoSaveIndicator({ isSaving, lastSaved, className }: AutoSaveIndicatorProps) {
  const getTimeAgo = (date: Date | null) => {
    if (!date) return "Not saved";
    
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 10) return "Just now";
    if (seconds < 60) return `${seconds}s ago`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
      {isSaving ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Saving...</span>
        </>
      ) : lastSaved ? (
        <>
          <Cloud className="h-4 w-4 text-green-600" />
          <span>Saved {getTimeAgo(lastSaved)}</span>
        </>
      ) : (
        <>
          <CloudOff className="h-4 w-4" />
          <span>Not saved</span>
        </>
      )}
    </div>
  );
}