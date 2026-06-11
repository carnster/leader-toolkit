import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, FileText, PlayCircle, Shield, BarChart3, Plus } from "lucide-react";

interface FirstRunWelcomeProps {
  onStartInitiative: () => void;
}

const journeySteps = [
  {
    icon: Search,
    title: "Decide",
    description: "Choose a change worth making, grounded in evidence and a clear problem statement.",
  },
  {
    icon: FileText,
    title: "Plan & Prepare",
    description: "Map the work before it starts: core ingredients, team, timeline, and budget.",
  },
  {
    icon: PlayCircle,
    title: "Implement",
    description: "Put the plan into practice and adjust through short improvement cycles.",
  },
  {
    icon: Shield,
    title: "Spread & Sustain",
    description: "Keep what works, build it into routine, and extend it across your school.",
  },
];

export function FirstRunWelcome({ onStartInitiative }: FirstRunWelcomeProps) {
  return (
    <div className="flex flex-col items-center py-12">
      <div className="max-w-3xl text-center space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome to the IMPACT Implementation Companion
        </h2>
        <p className="text-muted-foreground">
          This tool guides an initiative from decision through sustained practice, in 4 stages.
        </p>
      </div>

      <div className="mt-10 grid w-full max-w-4xl gap-4 md:grid-cols-4">
        {journeySteps.map((step, index) => (
          <Card key={step.title} className="bg-background">
            <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent">
                <step.icon className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Stage {index + 1}</p>
                <h3 className="font-semibold text-foreground">{step.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
        <BarChart3 className="h-4 w-4" />
        <span>Monitoring runs throughout, not at the end.</span>
      </div>

      <div className="mt-10 flex flex-col items-center gap-3">
        <Button size="lg" onClick={onStartInitiative}>
          <Plus className="mr-2 h-4 w-4" />
          Start your first initiative
        </Button>
        <p className="text-sm text-muted-foreground">
          Not sure where to begin? Browse evidence-based templates in the New Initiative dialog.
        </p>
      </div>
    </div>
  );
}
