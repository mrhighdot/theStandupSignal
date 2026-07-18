import { desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { getDb } from "@db/client";
import { digests, teamMembers, workSignals } from "@db/schema";
import type { DigestPayload } from "@standup-types/digest.types";
import { layout } from "@views/layout";
import { digestPersonCard, escapeHtml } from "@routes/pages/digest-view";

export const dashboardPage = new Hono();

dashboardPage.get("/", async (c) => {
  const latest = (await getDb().select().from(digests).orderBy(desc(digests.digestDate)).limit(1))[0];
  if (!latest) return c.html(layout("Dashboard", `<section><p class="text-sm font-bold uppercase tracking-widest text-stone-500">No digest yet</p><h1 class="mt-2 text-5xl font-black tracking-tight">The signal starts with a sync.</h1><p class="mt-5 max-w-xl text-lg">Pull activity, generate a digest, then this dashboard will foreground blockers that are holding on too long.</p></section>`));
  const payload = JSON.parse(latest.payloadJson) as DigestPayload;
  const repeats = payload.people.filter((person) => person.blockerStatus === "repeat").length;
  const openSignals = await getDb().select({ signal: workSignals, memberName: teamMembers.displayName }).from(workSignals).innerJoin(teamMembers, eq(workSignals.memberId, teamMembers.id)).where(eq(workSignals.status, "open")).orderBy(desc(workSignals.occurredAt)).limit(8);
  return c.html(layout("Dashboard", `<section><div class="flex flex-wrap items-end justify-between gap-5"><div><p class="text-sm font-bold uppercase tracking-widest text-stone-500">Digest · ${payload.date}</p><h1 class="mt-2 text-5xl font-black tracking-tight">${repeats ? `${repeats} repeat blocker${repeats === 1 ? "" : "s"}` : "Clear path"}</h1></div><a class="signal-link font-bold" href="/blockers">View blocker trend</a></div><div id="digest-people" class="mt-10" hx-get="/fragments/digest/${payload.date}" hx-trigger="every 60s" hx-swap="innerHTML">${payload.people.map(digestPersonCard).join("")}</div>${openSignalsSection(openSignals)}</section>`));
});

/** Renders the open coordination signals — assignments, acks, blockers, review requests — still awaiting resolution. */
function openSignalsSection(rows: Array<{ signal: typeof workSignals.$inferSelect; memberName: string }>): string {
  const items = rows.length
    ? rows.map(({ signal, memberName }) => `<li class="signal-rule py-3"><span class="text-xs font-bold uppercase tracking-widest text-stone-500">${signal.type.replace("_", " ")}</span><p class="mt-1"><span class="font-black">${escapeHtml(memberName)}</span> — ${escapeHtml(signal.description)}${signal.taskKey ? ` <span class="text-stone-500">(${escapeHtml(signal.taskKey)})</span>` : ""}</p></li>`).join("")
    : `<li class="py-3 text-stone-600">No open coordination signals.</li>`;
  return `<div class="mt-12"><p class="text-sm font-bold uppercase tracking-widest text-stone-500">Open work signals</p><ul class="mt-4">${items}</ul></div>`;
}
