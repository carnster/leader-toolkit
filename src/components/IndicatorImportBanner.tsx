import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Download, Loader2, CheckCircle2 } from "lucide-react";
import { migrateIndicatorsFromDecisionBrief, checkIndicatorsNeedImport } from "@/lib/indicatorMigration";
import { useToast } from "@/hooks/use-toast";

interface IndicatorImportBannerProps {
  initiativeId: string;
  onImportComplete?: () => void;
}

export function IndicatorImportBanner({ initiativeId, onImportComplete }: IndicatorImportBannerProps) {
  const [needsImport, setNeedsImport] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [imported, setImported] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkImportStatus();
  }, [initiativeId]);

  const checkImportStatus = async () => {
    const needs = await checkIndicatorsNeedImport(initiativeId);
    setNeedsImport(needs);
  };

  const handleImport = async () => {
    setIsImporting(true);
    const result = await migrateIndicatorsFromDecisionBrief(initiativeId);
    
    if (result.success) {
      setImported(true);
      setNeedsImport(false);
      toast({
        title: "Indicators imported",
        description: `Successfully imported ${result.count} indicators from your decision brief`,
      });
      onImportComplete?.();
      
      // Refresh the page after a short delay to show updated data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } else {
      toast({
        title: "Import failed",
        description: result.error || "Failed to import indicators",
        variant: "destructive",
      });
    }
    
    setIsImporting(false);
  };

  if (!needsImport || imported) {
    return null;
  }

  return (
    <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
      <Download className="h-4 w-4" />
      <AlertTitle>Import Indicators from Decision Brief</AlertTitle>
      <AlertDescription>
        <div className="flex items-start justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            You have indicators defined in your decision brief that can be imported here for tracking. This will set up your measurement framework automatically.
          </p>
          <Button 
            onClick={handleImport} 
            disabled={isImporting}
            variant="outline"
            size="sm"
            className="shrink-0"
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : imported ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Imported
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Import Indicators
              </>
            )}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
