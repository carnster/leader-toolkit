import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

// Public, READ-ONLY calendar subscription feed. verify_jwt = false: Google,
// Apple, and Outlook fetch this URL on their own schedule with no credentials.
//
// SECURITY INVARIANT: this function only ever reads, and only ever returns the
// fields below. It must never accept a write, never echo the token, and never
// return anything a link-holder should not see. The token is the only secret,
// so it is validated before a single row is read and the response is identical
// for a revoked token and a nonexistent one.
//
// What is deliberately NOT included: commitment details, milestone notes,
// observation notes. Those are internal. Titles, dates, and owner names are the
// same things a staff member holding the link would already have been told.

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function esc(text: string): string {
  return String(text)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function icsDate(iso: string): string {
  return iso.slice(0, 10).replace(/-/g, "");
}

/** Fold long lines to 75 octets per RFC 5545, or strict parsers reject the feed. */
function fold(line: string): string {
  if (line.length <= 74) return line;
  const parts = [line.slice(0, 74)];
  let rest = line.slice(74);
  while (rest.length > 73) {
    parts.push(" " + rest.slice(0, 73));
    rest = rest.slice(73);
  }
  if (rest) parts.push(" " + rest);
  return parts.join("\r\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const notFound = () =>
    new Response("This calendar link is not valid.", {
      status: 404,
      headers: { ...cors, "Content-Type": "text/plain" },
    });

  try {
    const url = new URL(req.url);
    const token = (url.searchParams.get("token") || "").trim();
    // Tokens are 32 hex chars; reject anything else before touching the database.
    if (!/^[a-f0-9]{32}$/.test(token)) return notFound();

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: feed } = await admin
      .from("calendar_feeds")
      .select("id, initiative_id, revoked")
      .eq("token", token)
      .maybeSingle();

    // Identical response for revoked and nonexistent: a probe learns nothing.
    if (!feed || feed.revoked) return notFound();

    const initiativeId = feed.initiative_id;

    const [initiative, milestones, pd, comms, observations, commitments] = await Promise.all([
      admin.from("initiatives").select("title").eq("id", initiativeId).maybeSingle(),
      admin.from("timeline_milestones").select("id, milestone, target_date, status").eq("initiative_id", initiativeId),
      admin.from("pd_activities").select("id, title, scheduled_date").eq("initiative_id", initiativeId),
      admin.from("communication_activities").select("id, description, scheduled_date, stakeholder_group").eq("initiative_id", initiativeId),
      admin.from("observation_schedules").select("id, scheduled_date, observation_type, location").eq("initiative_id", initiativeId),
      admin.from("commitments").select("id, title, due_date, owner_name, status").eq("initiative_id", initiativeId),
    ]);

    type Ev = { uid: string; date: string; summary: string; desc?: string };
    const events: Ev[] = [];

    for (const m of milestones.data || []) {
      if (m.target_date && m.status !== "completed") {
        events.push({ uid: `ms-${m.id}`, date: m.target_date, summary: `[Milestone] ${m.milestone}` });
      }
    }
    for (const p of pd.data || []) {
      if (p.scheduled_date) {
        events.push({ uid: `pd-${p.id}`, date: p.scheduled_date, summary: `[PD] ${p.title}` });
      }
    }
    for (const c of comms.data || []) {
      if (c.scheduled_date) {
        events.push({
          uid: `cm-${c.id}`,
          date: c.scheduled_date,
          summary: `[Communication] ${c.description}`,
          desc: c.stakeholder_group ? `Audience: ${c.stakeholder_group}` : undefined,
        });
      }
    }
    for (const o of observations.data || []) {
      if (o.scheduled_date) {
        const label = o.observation_type === "record_review" ? "Record review" : "Observation";
        events.push({
          uid: `ob-${o.id}`,
          date: o.scheduled_date,
          summary: `[${label}]`,
          desc: o.location || undefined,
        });
      }
    }
    for (const k of commitments.data || []) {
      if (k.due_date && k.status === "open") {
        events.push({
          uid: `ck-${k.id}`,
          date: k.due_date,
          summary: `[Commitment] ${k.title}`,
          desc: k.owner_name ? `Owner: ${k.owner_name}` : undefined,
        });
      }
    }

    const title = initiative.data?.title || "Implementation";
    const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";

    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//IMPACT Implementation Companion//Calendar Feed//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      fold(`X-WR-CALNAME:${esc(title)}`),
      // Hint to clients how often to re-poll. Most treat this as advisory.
      "X-PUBLISHED-TTL:PT6H",
      "REFRESH-INTERVAL;VALUE=DURATION:PT6H",
    ];

    for (const e of events) {
      lines.push(
        "BEGIN:VEVENT",
        `UID:${e.uid}@impact-companion`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${icsDate(e.date)}`,
        fold(`SUMMARY:${esc(e.summary)}`),
        fold(`DESCRIPTION:${esc(e.desc ? `${title}\n${e.desc}` : title)}`),
        "END:VEVENT"
      );
    }
    lines.push("END:VCALENDAR");

    // Best effort: a failed stamp must not fail the feed.
    void admin.from("calendar_feeds").update({ last_fetched: new Date().toISOString() }).eq("id", feed.id);

    return new Response(lines.join("\r\n"), {
      headers: {
        ...cors,
        "Content-Type": "text/calendar; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
        "Content-Disposition": 'inline; filename="implementation.ics"',
      },
    });
  } catch {
    return notFound();
  }
});
