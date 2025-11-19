import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createNotification } from "@/lib/notifications";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Bell, Calendar, Users, CheckCircle } from "lucide-react";

export function TestNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();

  const sendTestNotification = async (type: string) => {
    if (!user) return;

    try {
      await createNotification({
        userId: user.id,
        type,
        title: getTitle(type),
        message: getMessage(type),
        actionUrl: "/",
      });

      toast({
        title: "Test notification sent",
        description: "Check the notifications bell icon in the header",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send test notification",
        variant: "destructive",
      });
    }
  };

  const getTitle = (type: string) => {
    switch (type) {
      case "milestone": return "Milestone Deadline Approaching";
      case "observation": return "Observation Scheduled Tomorrow";
      case "pd_activity": return "PD Activity Coming Up";
      case "team": return "Added to Initiative";
      default: return "Test Notification";
    }
  };

  const getMessage = (type: string) => {
    switch (type) {
      case "milestone": return "Your milestone is due in 7 days. Time to check progress!";
      case "observation": return "Classroom observation scheduled for tomorrow at 10:00 AM";
      case "pd_activity": return "Professional development session: \"Effective Feedback Strategies\" in 3 days";
      case "team": return "You've been added to \"Reading Fluency Programme\" as Implementation Lead";
      default: return "This is a test notification";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Notifications</CardTitle>
        <CardDescription>
          Try out the notification system by sending yourself test notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        <Button
          variant="outline"
          className="justify-start"
          onClick={() => sendTestNotification("milestone")}
        >
          <Calendar className="mr-2 h-4 w-4" />
          Milestone Reminder
        </Button>
        <Button
          variant="outline"
          className="justify-start"
          onClick={() => sendTestNotification("observation")}
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          Observation Scheduled
        </Button>
        <Button
          variant="outline"
          className="justify-start"
          onClick={() => sendTestNotification("pd_activity")}
        >
          <Bell className="mr-2 h-4 w-4" />
          PD Activity Reminder
        </Button>
        <Button
          variant="outline"
          className="justify-start"
          onClick={() => sendTestNotification("team")}
        >
          <Users className="mr-2 h-4 w-4" />
          Team Assignment
        </Button>
      </CardContent>
    </Card>
  );
}
