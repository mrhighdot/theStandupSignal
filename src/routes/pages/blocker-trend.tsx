import { asc, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { getDb } from "@db/client";
import { blockers, teamMembers } from "@db/schema";
import { layout } from "@views/layout";

export const blockerTrendPage = new Hono();

export type BlockerSort = "repeat" | "first-seen";

/** Loads open blockers ordered by repeat count (longest-stuck first) or by first-seen date (oldest first). */
export async function loadSortedBlockers(sort: BlockerSort) {
  const query = getDb().select({ blocker: blockers, member: teamMembers }).from(blockers).innerJoin(teamMembers, eq(blockers.memberId, teamMembers.id)).where(eq(blockers.stillOpen, true));
  return sort === "first-seen" ? query.orderBy(asc(blockers.firstSeenDate)) : query.orderBy(desc(blockers.repeatCount));
}

/** Renders blocker rows shared by the full page and its HTMX sort fragment. */
export function blockerRows(rows: Awaited<ReturnType<typeof loadSortedBlockers>>): string {
  return rows.length
    ? rows.map(({ blocker, member }) => `<tr class="border-t border-stone-300"><td class="py-4 font-black">${member.displayName}</td><td class="py-4">${blocker.description}</td><td class="py-4 font-black text-amber-700">${blocker.repeatCount} days</td><td class="py-4 text-stone-600">${blocker.firstSeenDate}</td></tr>`).join("")
    : `<tr><td class="py-6" colspan="4">No open blockers.</td></tr>`;
}

blockerTrendPage.get("/", async (c) => {
  const rows = await loadSortedBlockers("repeat");
  const sortControls = `<div class="mt-6 flex gap-4 text-xs font-bold uppercase tracking-widest"><button class="signal-link" hx-get="/fragments/blockers?sort=repeat" hx-target="#blocker-rows" hx-swap="innerHTML">Sort by repeat count</button><button class="signal-link" hx-get="/fragments/blockers?sort=first-seen" hx-target="#blocker-rows" hx-swap="innerHTML">Sort by first seen</button></div>`;
  return c.html(layout("Blocker trend", `<section><p class="text-sm font-bold uppercase tracking-widest text-stone-500">Open signal</p><h1 class="mt-2 text-5xl font-black tracking-tight">Blocker trend</h1><p class="mt-4 max-w-2xl text-lg">Sorted by repeat count: what has stayed stuck longest rises to the top.</p>${sortControls}<table class="mt-6 w-full text-left"><thead class="border-b-4 border-stone-950 text-xs uppercase tracking-widest text-stone-500"><tr><th class="pb-3">Person</th><th class="pb-3">Blocker</th><th class="pb-3">Signal</th><th class="pb-3">First seen</th></tr></thead><tbody id="blocker-rows">${blockerRows(rows)}</tbody></table></section>`));
});
