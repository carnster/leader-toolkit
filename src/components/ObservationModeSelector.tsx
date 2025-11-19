import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Eye, Users } from "lucide-react";

interface ObservationModeSelectorProps {
  onSelectMode: (mode: 'quick' | 'detailed' | 'team') => void;
}

export function ObservationModeSelector({ onSelectMode }: ObservationModeSelectorProps) {
  const modes = [
    {
      id: 'quick' as const,
      title: '60-Second Fidelity Log',
      description: 'Quick check: Are core components happening as planned?',
      icon: Clock,
      buttonText: 'Start Quick Log',
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
    },
    {
      id: 'detailed' as const,
      title: 'Coach Observation',
      description: 'Detailed observation with feedback notes',
      icon: Eye,
      buttonText: 'New Observation',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    },
    {
      id: 'team' as const,
      title: 'Team Check-In',
      description: 'Log team reflections and adjustments',
      icon: Users,
      buttonText: 'Record Check-In',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Implementation Observations</CardTitle>
        <CardDescription>
          Choose the type of observation that fits your current need
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {modes.map((mode) => {
            const Icon = mode.icon;
            return (
              <Card key={mode.id} className={`${mode.bgColor} border-2 hover:border-primary/50 transition-colors`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`h-6 w-6 ${mode.color}`} />
                  </div>
                  <CardTitle className="text-base">{mode.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {mode.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button
                    onClick={() => onSelectMode(mode.id)}
                    variant="outline"
                    className="w-full"
                  >
                    {mode.buttonText}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
