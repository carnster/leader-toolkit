import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Shield, FileText, AlertTriangle } from "lucide-react";
import type { ActiveIngredient } from "@/hooks/useActiveIngredients";

interface AdaptationProtocolProps {
  activeIngredients: ActiveIngredient[];
}

export function AdaptationProtocol({ activeIngredients }: AdaptationProtocolProps) {
  const coreIngredients = activeIngredients.filter(ing => ing.is_core);
  const adaptableIngredients = activeIngredients.filter(ing => !ing.is_core);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          <CardTitle>Adaptation Protocol</CardTitle>
        </div>
        <CardDescription>
          Guidelines for maintaining fidelity while allowing contextual adaptation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Core Principle */}
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Core Principle of Adaptation
          </h4>
          <p className="text-sm text-muted-foreground">
            <strong>Adaptations should preserve fidelity to core ingredients</strong> while allowing flexibility
            in delivery methods, timing, and context to meet local needs and constraints.
          </p>
        </div>

        {/* Non-Negotiable Elements */}
        <div>
          <h4 className="font-semibold mb-3 text-destructive flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Non-Negotiable (CORE) Elements
          </h4>
          <p className="text-sm text-muted-foreground mb-3">
            These elements are essential to the intervention's effectiveness and must be implemented as designed:
          </p>
          <div className="space-y-2">
            {coreIngredients.length > 0 ? (
              coreIngredients.map((ingredient) => (
                <div key={ingredient.id} className="p-3 rounded-lg border border-destructive/20 bg-destructive/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="destructive" className="text-xs">CORE - Do Not Adapt</Badge>
                    <span className="font-medium text-sm">{ingredient.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{ingredient.description}</p>
                  {ingredient.look_fors && ingredient.look_fors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium mb-1">Must include these elements:</p>
                      <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                        {ingredient.look_fors.map((lookFor, idx) => (
                          <li key={idx}>✓ {lookFor}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Define core active ingredients to identify non-negotiable elements</p>
            )}
          </div>
        </div>

        {/* Adaptable Elements */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Adaptable Elements
          </h4>
          <p className="text-sm text-muted-foreground mb-3">
            These elements can be flexibly adjusted to fit your context while maintaining overall quality:
          </p>
          <div className="space-y-2">
            {adaptableIngredients.length > 0 ? (
              adaptableIngredients.map((ingredient) => (
                <div key={ingredient.id} className="p-3 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs">Adaptable</Badge>
                    <span className="font-medium text-sm">{ingredient.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{ingredient.description}</p>
                  {ingredient.adaptable_boundaries && ingredient.adaptable_boundaries.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium mb-1">Adaptation guidelines:</p>
                      <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                        {ingredient.adaptable_boundaries.map((boundary, idx) => (
                          <li key={idx}>→ {boundary}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Adaptable ingredients will be shown here once defined</p>
            )}
          </div>
        </div>

        {/* Types of Acceptable Adaptations */}
        <div>
          <h4 className="font-semibold mb-3">Types of Acceptable Adaptations</h4>
          <div className="grid gap-2">
            <div className="p-3 rounded-lg border">
              <p className="font-medium text-sm">✓ Surface Adaptations</p>
              <p className="text-xs text-muted-foreground">
                Language, examples, materials that increase cultural relevance without changing core content
              </p>
            </div>
            <div className="p-3 rounded-lg border">
              <p className="font-medium text-sm">✓ Delivery Format</p>
              <p className="text-xs text-muted-foreground">
                Timing, grouping, delivery mode (in-person vs. virtual) as needed for context
              </p>
            </div>
            <div className="p-3 rounded-lg border">
              <p className="font-medium text-sm">✓ Pacing & Sequencing</p>
              <p className="text-xs text-muted-foreground">
                Speed and order of non-core components to match student needs and school calendar
              </p>
            </div>
          </div>
        </div>

        {/* Documentation Process */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Adaptation Documentation Process
          </h4>
          <div className="space-y-2">
            <div className="p-3 rounded-lg border">
              <p className="font-medium text-sm mb-1">1. Propose Adaptation</p>
              <p className="text-xs text-muted-foreground">
                Implementer describes proposed change and rationale to team lead/coach
              </p>
            </div>
            <div className="p-3 rounded-lg border">
              <p className="font-medium text-sm mb-1">2. Review Against Protocol</p>
              <p className="text-xs text-muted-foreground">
                Team reviews to ensure core ingredients remain intact
              </p>
            </div>
            <div className="p-3 rounded-lg border">
              <p className="font-medium text-sm mb-1">3. Document & Approve</p>
              <p className="text-xs text-muted-foreground">
                Record adaptation decision with justification in implementation log
              </p>
            </div>
            <div className="p-3 rounded-lg border">
              <p className="font-medium text-sm mb-1">4. Monitor Impact</p>
              <p className="text-xs text-muted-foreground">
                Track fidelity and outcomes to assess whether adaptation maintained effectiveness
              </p>
            </div>
          </div>
        </div>

        {/* When to Seek Guidance */}
        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <h4 className="font-semibold mb-2 text-amber-900 dark:text-amber-100">When to Seek Guidance</h4>
          <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
            Contact the implementation team lead or external coach before making adaptations if:
          </p>
          <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1 ml-4">
            <li>• The adaptation might affect a core ingredient</li>
            <li>• You're unsure whether the adaptation is within acceptable boundaries</li>
            <li>• The adaptation represents a significant change to delivery format or content</li>
            <li>• Fidelity data shows declining implementation quality</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
