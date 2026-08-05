import { Button } from "@/components/ui/button";
import { CalendarPlus, ListTodo } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTimelineMilestones } from "@/hooks/useTimelineMilestones";
import { usePDActivities } from "@/hooks/usePDActivities";
import { useCommunicationActivities } from "@/hooks/useCommunicationActivities";
import { useObservationSchedules } from "@/hooks/useObservationSchedules";
import { useCommitments } from "@/hooks/useCommitments";

interface CalendarTaskExportProps {
  initiativeId: string;
  initiativeTitle: string;
  /** "compact" drops the button labels to icons for tight toolbars. */
  variant?: "full" | "compact";
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

export function CalendarTaskExport({ initiativeId, initiativeTitle, variant = "full" }: CalendarTaskExportProps) {
  const { toast } = useToast();
  const { milestones } = useTimelineMilestones(initiativeId);
  const { activities: pdActivities } = usePDActivities(initiativeId);
  const { activities: commActivities } = useCommunicationActivities(initiativeId);
  const { schedules: observations } = useObservationSchedules(initiativeId);
  const { commitments } = useCommitments(initiativeId);

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
    for (const o of (observations || []) as any[]) {
      if (o.scheduled_date) {
        items.push({
          title: o.observation_type === "record_review" ? "Record review" : "Observation",
          date: o.scheduled_date,
          type: "Observation",
          detail: o.notes || o.location || undefined,
          status: o.status,
        });
      }
    }
    for (const k of (commitments || []) as any[]) {
      // Only open commitments: a done one on the calendar is noise.
      if (k.due_date && k.status === "open") {
        items.push({
          title: k.title,
          date: k.due_date,
          type: "Commitment",
          detail: [k.owner_name ? `Owner: ${k.owner_name}` : null, k.details].filter(Boolean).join("\n") || undefined,
          status: k.status,
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
        description: "Add dates to milestones, PD, communications, observations, or commitments first.",
      });
      return;
    }
    // DTSTAMP must be UTC; derive from toISOString (local time + "Z" would be wrong)
    const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
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
        description: "Add dates to milestones, PD, communications, observations, or commitments first.",
      });
      return;
    }
    // Quote, and neutralize leading formula characters so a cell named
    // "=HYPERLINK(...)" cannot execute when the CSV opens in Excel or Sheets.
    const esc = (s: string) => {
      let v = (s || "").replace(/"/g, '""');
      if (/^[=+\-@\t\r]/.test(v)) v = "'" + v;
      return `"${v}"`;
    };
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

  if (variant === "compact") {
    return (
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleCalendarExport} title="Add these dates to your calendar (.ics)">
          <CalendarPlus className="mr-2 h-4 w-4" />
          Add to calendar
        </Button>
        <Button variant="outline" size="sm" onClick={handleTaskExport} title="Export as a task list (CSV)">
          <ListTodo className="h-4 w-4" />
          <span className="sr-only">Export tasks as CSV</span>
        </Button>
      </div>
    );
  }

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
