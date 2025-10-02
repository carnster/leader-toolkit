import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { useState } from "react";

interface ReadinessChecklistProps {
  activeIngredientsCount: number;
  strategiesCount: number;
  teamMembersCount: number;
  milestonesCount: number;
  risksCount: number;
  pdActivitiesCount: number;
}

export function ReadinessChecklist({
  activeIngredientsCount,
  strategiesCount,
  teamMembersCount,
  milestonesCount,
  risksCount,
  pdActivitiesCount,
}: ReadinessChecklistProps) {
  const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>({});

  const checklistItems = [
    {
      id: "ingredients",
      section: "Active Ingredients",
      label: "All core and adaptable ingredients identified with clear look-fors",
      required: true,
      autoCheck: activeIngredientsCount > 0,
    },
    {
      id: "strategies",
      section: "Implementation Strategies",
      label: "ERIC strategies defined for addressing barriers",
      required: true,
      autoCheck: strategiesCount > 0,
    },
    {
      id: "team-assembled",
      section: "Team",
      label: "Implementation team assembled with clear roles and responsibilities",
      required: true,
      autoCheck: teamMembersCount > 0,
    },
    {
      id: "timeline",
      section: "Timeline",
      label: "Phased timeline with key milestones established",
      required: true,
      autoCheck: milestonesCount > 0,
    },
    {
      id: "risks",
      section: "Risk Management",
      label: "Potential risks identified with mitigation strategies",
      required: true,
      autoCheck: risksCount > 0,
    },
    {
      id: "pd-plan",
      section: "Professional Development",
      label: "PD plan includes initial training and ongoing coaching",
      required: true,
      autoCheck: pdActivitiesCount > 0,
    },
    {
      id: "fidelity",
      section: "Fidelity Monitoring",
      label: "Observation schedule and data collection methods defined",
      required: true,
      autoCheck: false,
    },
    {
      id: "communication",
      section: "Communication",
      label: "Stakeholder communication plan in place",
      required: true,
      autoCheck: false,
    },
    {
      id: "resources-secured",
      section: "Resources",
      label: "Budget allocated and materials/supplies secured",
      required: true,
      autoCheck: false,
    },
    {
      id: "training-complete",
      section: "Training",
      label: "Initial training for all implementers completed",
      required: true,
      autoCheck: false,
    },
    {
      id: "buy-in",
      section: "Stakeholder Buy-in",
      label: "Key stakeholders informed and supportive",
      required: false,
      autoCheck: false,
    },
    {
      id: "adaptation-protocol",
      section: "Adaptation",
      label: "Guidelines for acceptable adaptations documented",
      required: false,
      autoCheck: false,
    },
  ];

  const handleCheck = (id: string, checked: boolean) => {
    setCheckedItems(prev => ({ ...prev, [id]: checked }));
  };

  const requiredItems = checklistItems.filter(item => item.required);
  const completedRequired = requiredItems.filter(
    item => item.autoCheck || checkedItems[item.id]
  ).length;
  const totalRequired = requiredItems.length;
  const completionPercentage = Math.round((completedRequired / totalRequired) * 100);

  const isReady = completionPercentage === 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <CardTitle>Implementation Readiness Checklist</CardTitle>
          </div>
          <div>
            {isReady ? (
              <Badge variant="default" className="bg-green-600">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Ready to Implement
              </Badge>
            ) : (
              <Badge variant="secondary">
                {completedRequired}/{totalRequired} Complete
              </Badge>
            )}
          </div>
        </div>
        <CardDescription>
          Validate all critical components are in place before moving to implementation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Readiness Progress</span>
            <span className="font-medium">{completionPercentage}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isReady ? 'bg-green-600' : 'bg-primary'
              }`}
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {!isReady && (
          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-100">Not Ready Yet</p>
                <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                  Complete all required items before moving to the Implement stage to ensure success.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Checklist Items */}
        <div className="space-y-4">
          {checklistItems.map((item) => {
            const isChecked = item.autoCheck || checkedItems[item.id];
            
            return (
              <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg border">
                <Checkbox
                  id={item.id}
                  checked={isChecked}
                  onCheckedChange={(checked) => handleCheck(item.id, checked as boolean)}
                  disabled={item.autoCheck}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <label
                    htmlFor={item.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {item.label}
                    {item.required && (
                      <Badge variant="outline" className="ml-2 text-xs">Required</Badge>
                    )}
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">{item.section}</p>
                  {item.autoCheck && (
                    <Badge variant="secondary" className="mt-2 text-xs">
                      Auto-verified
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {isReady && (
          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <div className="flex gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">Ready to Implement!</p>
                <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                  All required planning components are complete. You can now move to the Implement stage.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
