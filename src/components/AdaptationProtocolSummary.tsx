import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, Settings, Eye, AlertCircle, Edit } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { EditActiveIngredientDialog } from "@/components/EditActiveIngredientDialog";
import { useState } from "react";
import type { ActiveIngredient } from "@/hooks/useActiveIngredients";

interface AdaptationProtocolSummaryProps {
  activeIngredients: ActiveIngredient[];
  initiativeId: string;
}

export function AdaptationProtocolSummary({ activeIngredients, initiativeId }: AdaptationProtocolSummaryProps) {
  const [editingIngredient, setEditingIngredient] = useState<ActiveIngredient | null>(null);
  const coreIngredients = activeIngredients.filter(ing => ing.is_core);
  const adaptableIngredients = activeIngredients.filter(ing => !ing.is_core);

  if (activeIngredients.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Adaptation Protocol Summary
          </CardTitle>
          <CardDescription>
            No active ingredients defined yet. Add ingredients to see your adaptation protocol.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Adaptation Protocol Summary
        </CardTitle>
        <CardDescription>
          Overview of core components requiring fidelity and adaptable elements allowing flexibility
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Statistics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border bg-destructive/5 border-destructive/20">
            <div className="flex items-center gap-2 mb-1">
              <Lock className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium">Core Ingredients</span>
            </div>
            <div className="text-2xl font-bold text-destructive">{coreIngredients.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Must be implemented as designed</p>
          </div>
          <div className="p-4 rounded-lg border bg-primary/5 border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <Settings className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Adaptable Ingredients</span>
            </div>
            <div className="text-2xl font-bold text-primary">{adaptableIngredients.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Can be adjusted to context</p>
          </div>
        </div>

        {/* Core Ingredients Section */}
        {coreIngredients.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-destructive" />
              <h3 className="font-semibold text-sm">Core Ingredients (Non-Negotiable)</h3>
            </div>
            <div className="space-y-3">
              {coreIngredients.map((ingredient) => (
                <div key={ingredient.id} className="p-4 rounded-lg border bg-destructive/5 border-destructive/20">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{ingredient.name}</h4>
                        <Badge variant="destructive" className="text-xs">CORE</Badge>
                        {ingredient.category && (
                          <Badge variant="outline" className="text-xs">{ingredient.category}</Badge>
                        )}
                      </div>
                      {ingredient.description && (
                        <p className="text-sm text-muted-foreground">{ingredient.description}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingIngredient(ingredient)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>

                  {ingredient.look_fors && ingredient.look_fors.length > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Eye className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">Observable Look-Fors:</span>
                      </div>
                      <ul className="space-y-1 ml-5">
                        {ingredient.look_fors.map((lookFor, index) => (
                          <li key={index} className="text-sm list-disc">{lookFor}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(!ingredient.look_fors || ingredient.look_fors.length === 0) && (
                    <div className="mt-3 flex items-start gap-2 p-2 rounded bg-yellow-500/10 border border-yellow-500/20">
                      <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-yellow-700">No look-fors defined. Add observable indicators to guide implementation.</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {coreIngredients.length > 0 && adaptableIngredients.length > 0 && (
          <Separator />
        )}

        {/* Adaptable Ingredients Section */}
        {adaptableIngredients.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Adaptable Ingredients (Context-Flexible)</h3>
            </div>
            <div className="space-y-3">
              {adaptableIngredients.map((ingredient) => (
                <div key={ingredient.id} className="p-4 rounded-lg border bg-primary/5 border-primary/20">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{ingredient.name}</h4>
                        <Badge variant="default" className="text-xs">ADAPTABLE</Badge>
                        {ingredient.category && (
                          <Badge variant="outline" className="text-xs">{ingredient.category}</Badge>
                        )}
                      </div>
                      {ingredient.description && (
                        <p className="text-sm text-muted-foreground">{ingredient.description}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingIngredient(ingredient)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>

                  {ingredient.look_fors && ingredient.look_fors.length > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Eye className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">Observable Look-Fors:</span>
                      </div>
                      <ul className="space-y-1 ml-5">
                        {ingredient.look_fors.map((lookFor, index) => (
                          <li key={index} className="text-sm list-disc">{lookFor}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {ingredient.adaptable_boundaries && ingredient.adaptable_boundaries.length > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Settings className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">Adaptation Boundaries:</span>
                      </div>
                      <ul className="space-y-1 ml-5">
                        {ingredient.adaptable_boundaries.map((boundary, index) => (
                          <li key={index} className="text-sm list-disc text-muted-foreground">{boundary}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(!ingredient.look_fors || ingredient.look_fors.length === 0) && (
                    <div className="mt-3 flex items-start gap-2 p-2 rounded bg-yellow-500/10 border border-yellow-500/20">
                      <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-yellow-700">No look-fors defined. Add observable indicators to guide implementation.</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key Principles */}
        <div className="p-4 rounded-lg bg-muted/50 border">
          <h4 className="font-medium text-sm mb-2">Adaptation Protocol Principles</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• <span className="font-medium text-destructive">Core ingredients</span> must be implemented as designed to maintain effectiveness</li>
            <li>• <span className="font-medium text-primary">Adaptable ingredients</span> can be modified to fit local context while maintaining quality</li>
            <li>• All adaptations should be documented and monitored for impact on outcomes</li>
            <li>• When in doubt, consult evidence base or implementation team before adapting</li>
          </ul>
        </div>
      </CardContent>
    </Card>

    {/* Edit Dialog */}
    {editingIngredient && (
      <EditActiveIngredientDialog
        ingredient={editingIngredient}
        open={!!editingIngredient}
        onOpenChange={(open) => !open && setEditingIngredient(null)}
        initiativeId={initiativeId}
      />
    )}
    </>
  );
}
