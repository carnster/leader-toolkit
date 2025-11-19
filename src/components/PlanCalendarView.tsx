import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Users, MessageSquare, BookOpen } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: "pd" | "communication" | "milestone";
  status?: string;
}

interface PlanCalendarViewProps {
  events: CalendarEvent[];
}

export function PlanCalendarView({ events }: PlanCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const getEventsForDay = (day: Date) => {
    return events.filter(event => isSameDay(event.date, day));
  };
  
  const getEventIcon = (type: string) => {
    switch (type) {
      case "pd": return <BookOpen className="h-3 w-3" />;
      case "communication": return <MessageSquare className="h-3 w-3" />;
      case "milestone": return <CalendarIcon className="h-3 w-3" />;
      default: return null;
    }
  };
  
  const getEventColor = (type: string) => {
    switch (type) {
      case "pd": return "bg-blue-500/10 text-blue-700 border-blue-200";
      case "communication": return "bg-green-500/10 text-green-700 border-green-200";
      case "milestone": return "bg-purple-500/10 text-purple-700 border-purple-200";
      default: return "bg-muted";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Implementation Calendar
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {format(currentMonth, "MMMM yyyy")}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
            <div key={day} className="text-center text-xs font-semibold text-muted-foreground p-2">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {monthDays.map(day => {
            const dayEvents = getEventsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            
            return (
              <div
                key={day.toString()}
                className={`min-h-[80px] p-2 rounded-lg border ${
                  isCurrentMonth ? "bg-card" : "bg-muted/30"
                }`}
              >
                <div className={`text-xs font-medium mb-1 ${
                  isCurrentMonth ? "text-foreground" : "text-muted-foreground"
                }`}>
                  {format(day, "d")}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map(event => (
                    <div
                      key={event.id}
                      className={`text-[10px] p-1 rounded border ${getEventColor(event.type)}`}
                      title={event.title}
                    >
                      <div className="flex items-center gap-1">
                        {getEventIcon(event.type)}
                        <span className="truncate">{event.title}</span>
                      </div>
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-[10px] text-muted-foreground">
                      +{dayEvents.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="mt-6 flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500/10 border border-blue-200" />
            <span>Professional Development</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500/10 border border-green-200" />
            <span>Communication</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-purple-500/10 border border-purple-200" />
            <span>Milestones</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
