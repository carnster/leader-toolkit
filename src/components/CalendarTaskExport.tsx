import { Button } from "@/components/ui/button";
import { CalendarPlus, ListTodo } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useTimelineMilestones } from "@/hooks/useTimelineMilestones";
import { usePDActivities } from "@/hooks/usePDActivities";
import { useCommunicationActivities } from "@/hooks/useCommunicationActivities";

interface CalendarTaskExportProps {
  initiativeId: string;
  initiativeTitle: string;
}

interface DatedItem {
  title: string;
  date: string; // ISO date
  type: string;
  detail?: string;
  status?: string;
}

function escapeIcs(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function toIcsDate(iso: string): string {
  return iso.slice(0, 10).replace(/-/g, "");
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function CalendarTaskExport({ initiativeId, initiativeTitle }: CalendarTaskExportProps) {
  const { toast } = useToast();
  const { milestones } = useTimelineMilestones(initiativeId);
  const { activities: pdActivities } = usePDActivities(initiativeId);
  const { activities: commActivities } = useCommunicationActivities(initiativeId);

  const collectItems = (): DatedItem[] => {
    const items: DatedItem[] = [];
    for (const m of milestones) {
      if (m.target_date) {
        items.push({
          title: m.milestone,
          date: m.target_date,
          type: "Milestone",
          detail: m.notes || undefined,
          status: m.status,
        });
      }
    }
    for (const p of pdActivities as any[]) {
      if (p.scheduled_date) {
        items.push({
          title: p.title,
          date: p.scheduled_date,
          type: "Professional Development",
          detail: p.description || undefined,
          status: p.completion_status,
        });
      }
    }
    for (const c of commActivities as any[]) {
      if (c.scheduled_date) {
        items.push({
          title: c.description,
          date: c.scheduled_date,
          type: "Communication",
          detail: c.stakeholder_group ? `Audience: ${c.stakeholder_group}` : undefined,
        });
      }
    }
    return items.sort((a, b) => a.date.localeCompare(b.date));
  };

  const handleCalendarExport = () => {
    const items = collectItems();
    if (items.length === 0) {
      toast({
        title: "Nothing to export yet",
        description: "Add dates to milestones, PD activities, or communication activities first.",
      });
      return;
    }
    const stamp = format(new Date(), "yyyyMMdd'T'HHmmss'Z'");
    const events = items.map((item, idx) => [
      "BEGIN:VEVENT",
      `UID:${initiativeId}-${idx}@impact-companion`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${toIcsDate(item.date)}`,
      `SUMMARY:${escapeIcs(`[${item.type}] ${item.title}`)}`,
      `DESCRIPTION:${escapeIcs(`${initiativeTitle} (IMPACT Companion)${item.detail ? "\n" + item.detail : ""}`)}`,
      "END:VEVENT",
    ].join("\r\n"));
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//IMPACT Implementation Companion//EN",
      `X-WR-CALNAME:${escapeIcs(initiativeTitle)}`,
      ...events,
      "END:VCALENDAR",
    ].join("\r\n");
    download(`${initiativeTitle.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-calendar.ics`, ics, "text/calendar");
    toast({
      title: `${items.length} events exported`,
      description: "Open the .ics file to import into Google, Outlook, or Apple Calendar.",
    });
  };

  const handleTaskExport = () => {
    const items = collectItems();
    if (items.length === 0) {
      toast({
        title: "Nothing to export yet",
        description: "Add dates to milestones, PD activities, or communication activities first.",
      });
      return;
    }
    const esc = (s: string) => `"${(s || "").replace(/"/g, '""')}"`;
    const rows = [
      ["Task", "Type", "Due Date", "Status", "Notes", "Initiative"].join(","),
      ...items.map((i) =>
        [esc(i.title), esc(i.type), i.date.slice(0, 10), esc(i.status || ""), esc(i.detail || ""), esc(initiativeTitle)].join(",")
      ),
    ];
    download(`${initiativeTitle.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-tasks.csv`, rows.join("\n"), "text/csv");
    toast({
      title: `${items.length} tasks exported`,
      description: "Import the CSV into Microsoft To Do, Google Tasks, or any task manager.",
    });
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={handleCalendarExport}>
        <CalendarPlus className="mr-2 h-4 w-4" />
        Add to Calendar (.ics)
      </Button>
      <Button variant="outline" onClick={handleTaskExport}>
        <ListTodo className="mr-2 h-4 w-4" />
        Export Tasks (CSV)
      </Button>
    </div>
  );
}
