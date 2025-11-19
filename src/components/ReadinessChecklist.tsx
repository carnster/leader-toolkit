import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Info, ChevronUp, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Link, useSearchParams } from "react-router-dom";

interface ReadinessChecklistProps {
  activeIngredientsCount: number;
  strategiesCount: number;
  teamMembersCount: number;
  milestonesCount: number;
  risksCount: number;
  pdActivitiesCount: number;
  communicationActivitiesCount?: number;
  budgetItemsCount?: number;
  fidelityChecklistsCount?: number;
  observationSchedulesCount?: number;
  activeIngredients?: any[];
  decisionBrief?: any;
}

export function ReadinessChecklist({
  activeIngredientsCount,
  strategiesCount,
  teamMembersCount,
  milestonesCount,
  risksCount,
  pdActivitiesCount,
  communicationActivitiesCount = 0,
  budgetItemsCount = 0,
  fidelityChecklistsCount = 0,
  observationSchedulesCount = 0,
  activeIngredients = [],
  decisionBrief = null,
}: ReadinessChecklistProps) {
  const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>({});
  const [expandedItems, setExpandedItems] = useState<{ [key: string]: boolean }>({});
  const [searchParams] = useSearchParams();
  const initiativeId = searchParams.get("initiative");

  // Check if ingredients have look-fors defined
  const ingredientsWithLookFors = activeIngredients.filter(
    ing => ing.look_fors && ing.look_fors.length > 0
  ).length;
  const ingredientsComplete = activeIngredientsCount > 0 && ingredientsWithLookFors === activeIngredientsCount;

  const checklistItemDetails = {
    ingredients: {
      definition: "Core ingredients are essential, non-negotiable components that must be implemented with fidelity. Adaptable ingredients can be modified to fit your context while maintaining effectiveness.",
      examples: ["Clear definition of each active ingredient", "Observable indicators (look-fors) for each component", "Documentation of which ingredients are core vs. adaptable", "Alignment with evidence-based practices"]
    },
    strategies: {
      definition: "Implementation strategies are methods to address barriers and support adoption. ERIC framework provides tested strategies for overcoming common implementation challenges.",
      examples: ["Strategies matched to identified barriers", "Clear action plans for each strategy", "Assigned responsible parties", "Timeline for strategy deployment", "Success indicators defined"]
    },
    "team-assembled": {
      definition: "A diverse team with complementary skills and clear responsibilities ensures coordinated implementation and sustained momentum.",
      examples: ["Leadership representation", "Implementer participation", "Administrative support", "Data/evaluation expertise", "Clear roles and time commitments", "Regular meeting schedule established"]
    },
    timeline: {
      definition: "A phased timeline breaks implementation into manageable stages with clear milestones to track progress and maintain accountability.",
      examples: ["Installation phase milestones (0-25%)", "Initial implementation checkpoints (26-75%)", "Full implementation targets (76-100%)", "Realistic target dates", "Dependencies identified"]
    },
    risks: {
      definition: "Proactive risk identification and mitigation planning prevents surprises and enables quick response when challenges arise.",
      examples: ["Staff turnover contingencies", "Resource availability concerns", "Competing priorities", "Technical/logistical barriers", "Mitigation and contingency plans for each risk"]
    },
    "pd-plan": {
      definition: "Comprehensive professional development ensures implementers have the knowledge and skills needed, with ongoing support to maintain quality.",
      examples: ["Initial training schedule and content", "Coaching/support model defined", "Practice opportunities built in", "Feedback mechanisms established", "Refresher training planned"]
    },
    fidelity: {
      definition: "Systematic monitoring ensures the practice is implemented as intended, providing data to guide support and improvement.",
      examples: ["Observation schedule established", "Fidelity checklists developed", "Observer training completed", "Data collection tools ready", "Feedback process defined"]
    },
    communication: {
      definition: "Strategic communication keeps all stakeholders informed, builds buy-in, and addresses concerns proactively.",
      examples: ["Stakeholder map created", "Key messages defined", "Communication channels identified", "Timeline for updates", "Two-way feedback mechanisms"]
    },
    "resources-secured": {
      definition: "Adequate resources ensure implementation can proceed without delays or quality compromises.",
      examples: ["Budget approved and allocated", "Materials and supplies ordered", "Technology/tools secured", "Space/facilities arranged", "Sustainability funding identified"]
    },
    "training-complete": {
      definition: "All implementers need foundational knowledge and skills before beginning implementation to ensure quality from day one.",
      examples: ["Initial training sessions completed", "Implementers demonstrate understanding", "Practice opportunities provided", "Questions addressed", "Reference materials distributed"]
    },
    "buy-in": {
      definition: "Leadership support and stakeholder commitment provide the political will and resources needed for success.",
      examples: ["Leadership endorsement secured", "Union/staff representation involved", "Parent/community informed", "Board approval obtained", "Champions identified at all levels"]
    },
    "adaptation-protocol": {
      definition: "Clear guidelines help teams make contextually appropriate adaptations while maintaining fidelity to core components.",
      examples: ["Core vs. adaptable components documented", "Decision-making process for adaptations", "Documentation requirements", "Review/approval process", "Boundaries clearly defined"]
    }
  };

  const checklistItems = [
    {
      id: "ingredients",
      section: "Active Ingredients",
      label: "All core and adaptable ingredients identified with clear look-fors",
      required: true,
      autoCheck: ingredientsComplete,
      actionLink: `/plan?section=strategic-foundation${initiativeId ? `&initiative=${initiativeId}` : ''}`,
      actionLabel: "Define Active Ingredients"
    },
    {
      id: "strategies",
      section: "Implementation Strategies",
      label: "ERIC strategies defined for addressing barriers",
      required: true,
      autoCheck: strategiesCount > 0,
      actionLink: `/plan?section=execution${initiativeId ? `&initiative=${initiativeId}` : ''}`,
      actionLabel: "Add Strategies"
    },
    {
      id: "team-assembled",
      section: "Team",
      label: "Implementation team assembled with clear roles and responsibilities",
      required: true,
      autoCheck: teamMembersCount > 0,
      actionLink: `/plan?section=team${initiativeId ? `&initiative=${initiativeId}` : ''}`,
      actionLabel: "Build Team"
    },
    {
      id: "timeline",
      section: "Timeline",
      label: "Phased timeline with key milestones established",
      required: true,
      autoCheck: milestonesCount > 0,
      actionLink: `/plan?section=timeline${initiativeId ? `&initiative=${initiativeId}` : ''}`,
      actionLabel: "Create Timeline"
    },
    {
      id: "risks",
      section: "Risk Management",
      label: "Potential risks identified with mitigation strategies",
      required: true,
      autoCheck: risksCount > 0,
      actionLink: `/plan?section=execution${initiativeId ? `&initiative=${initiativeId}` : ''}`,
      actionLabel: "Identify Risks"
    },
    {
      id: "pd-plan",
      section: "Professional Development",
      label: "PD plan includes initial training and ongoing coaching",
      required: true,
      autoCheck: pdActivitiesCount > 0,
      actionLink: `/plan?section=team${initiativeId ? `&initiative=${initiativeId}` : ''}`,
      actionLabel: "Plan PD Activities"
    },
    {
      id: "fidelity",
      section: "Fidelity Monitoring",
      label: "Observation schedule and data collection methods defined",
      required: true,
      autoCheck: fidelityChecklistsCount > 0 || observationSchedulesCount > 0,
      actionLink: `/plan?section=quality-assurance${initiativeId ? `&initiative=${initiativeId}` : ''}`,
      actionLabel: "Set Up Monitoring"
    },
    {
      id: "communication",
      section: "Communication",
      label: "Stakeholder communication plan in place",
      required: true,
      autoCheck: communicationActivitiesCount > 0,
      actionLink: `/plan?section=communication${initiativeId ? `&initiative=${initiativeId}` : ''}`,
      actionLabel: "Create Communication Plan"
    },
    {
      id: "resources-secured",
      section: "Resources",
      label: "Budget allocated and materials/supplies secured",
      required: true,
      autoCheck: budgetItemsCount > 0,
      actionLink: `/plan?section=team${initiativeId ? `&initiative=${initiativeId}` : ''}`,
      actionLabel: "Manage Budget"
    },
    {
      id: "training-complete",
      section: "Training",
      label: "Initial training for all implementers completed",
      required: true,
      autoCheck: pdActivitiesCount > 0,
      actionLink: `/plan?section=team${initiativeId ? `&initiative=${initiativeId}` : ''}`,
      actionLabel: "Schedule Training"
    },
    {
      id: "buy-in",
      section: "Stakeholder Buy-in",
      label: "Key stakeholders informed and supportive",
      required: false,
      autoCheck: decisionBrief?.stakeholder_input && decisionBrief.stakeholder_input.trim() !== '',
      actionLink: `/decide${initiativeId ? `?initiative=${initiativeId}` : ''}`,
      actionLabel: "Document Stakeholder Input"
    },
    {
      id: "adaptation-protocol",
      section: "Adaptation",
      label: "Guidelines for acceptable adaptations documented",
      required: false,
      autoCheck: activeIngredients.some(ing => ing.adaptable_boundaries && ing.adaptable_boundaries.length > 0),
      actionLink: `/plan?section=strategic-foundation${initiativeId ? `&initiative=${initiativeId}` : ''}`,
      actionLabel: "Define Adaptation Protocol"
    },
  ];

  const handleCheck = (id: string, checked: boolean) => {
    setCheckedItems(prev => ({ ...prev, [id]: checked }));
  };

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
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
        <div className="space-y-3">
          {checklistItems.map((item) => {
            const isChecked = item.autoCheck || checkedItems[item.id];
            const isExpanded = expandedItems[item.id];
            const details = checklistItemDetails[item.id as keyof typeof checklistItemDetails];
            
            return (
              <Collapsible key={item.id} open={isExpanded} onOpenChange={() => toggleExpanded(item.id)}>
                <div className="rounded-lg border">
                  <div className="flex items-start gap-3 p-3">
                    <Checkbox
                      id={item.id}
                      checked={isChecked}
                      onCheckedChange={(checked) => handleCheck(item.id, checked as boolean)}
                      disabled={item.autoCheck}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <label
                          htmlFor={item.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {item.label}
                          {item.required && (
                            <Badge variant="outline" className="ml-2 text-xs">Required</Badge>
                          )}
                        </label>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 flex-shrink-0">
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <Info className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{item.section}</p>
                      {item.autoCheck && (
                        <Badge variant="secondary" className="mt-2 text-xs">
                          Auto-verified
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <CollapsibleContent>
                    {details && (
                      <div className="px-3 pb-3 pt-0 border-t bg-muted/30 space-y-3">
                        <div className="pt-3 space-y-3">
                          <div className="flex items-start gap-2">
                            <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <div className="space-y-2 flex-1">
                              <p className="text-sm text-muted-foreground">{details.definition}</p>
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1.5">What this looks like:</p>
                                <ul className="text-xs text-muted-foreground space-y-1">
                                  {details.examples.map((example, idx) => (
                                    <li key={idx} className="flex items-start gap-1.5">
                                      <span className="text-primary mt-0.5">•</span>
                                      <span>{example}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                          
                          {item.actionLink && (
                            <div className="flex justify-end pt-2">
                              <Button asChild size="sm" variant="default">
                                <Link to={item.actionLink}>
                                  {item.actionLabel}
                                  <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CollapsibleContent>
                </div>
              </Collapsible>
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
