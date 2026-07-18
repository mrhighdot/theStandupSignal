import { desc } from "drizzle-orm";
import { Hono } from "hono";
import { getDb } from "@db/client";
import { digests } from "@db/schema";
import type { DigestPayload } from "@standup-types/digest.types";
import { layout } from "@views/layout";
import { digestPersonCard } from "@routes/pages/digest-view";

export const dashboardPage = new Hono();

dashboardPage.get("/", async (c) => {
  const latest = (await getDb().select().from(digests).orderBy(desc(digests.digestDate)).limit(1))[0];
  if (!latest) return c.html(layout("Dashboard", `<section><p class="text-sm font-bold uppercase tracking-widest text-stone-500">No digest yet</p><h1 class="mt-2 text-5xl font-black tracking-tight">The signal starts with a sync.</h1><p class="mt-5 max-w-xl text-lg">Pull activity, generate a digest, then this dashboard will foreground blockers that are holding on too long.</p></section>`));
  const payload = JSON.parse(latest.payloadJson) as DigestPayload;
  const repeats = payload.people.filter((person) => person.blockerStatus === "repeat").length;
  return c.html(layout("Dashboard", `<section><div class="flex flex-wrap items-end justify-between gap-5"><div><p class="text-sm font-bold uppercase tracking-widest text-stone-500">Digest · ${payload.date}</p><h1 class="mt-2 text-5xl font-black tracking-tight">${repeats ? `${repeats} repeat blocker${repeats === 1 ? "" : "s"}` : "Clear path"}</h1></div><a class="signal-link font-bold" href="/blockers">View blocker trend</a></div><div id="digest-people" class="mt-10" hx-get="/fragments/digest/${payload.date}" hx-trigger="every 60s" hx-swap="innerHTML">${payload.people.map(digestPersonCard).join("")}</div></section>`));
});
