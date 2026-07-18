import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@db/client";
import { rawActivity } from "@db/schema";
import type { ActivityInput, ActivitySource } from "@standup-types/activity.types";

/** Inserts only activity not already synced for this source, keyed by external id, so re-running a sync never duplicates rows. */
export async function persistNewActivity(source: ActivitySource, activities: ActivityInput[]): Promise<Array<ActivityInput & { id: number }>> {
  if (!activities.length) return [];
  const db = getDb();
  const externalIds = activities.map((item) => item.externalId);
  const existing = await db.select({ externalId: rawActivity.externalId }).from(rawActivity).where(and(eq(rawActivity.source, source), inArray(rawActivity.externalId, externalIds)));
  const existingIds = new Set(existing.map((item) => item.externalId));
  const fresh = activities.filter((item) => !existingIds.has(item.externalId));
  if (!fresh.length) return [];
  const ids = await db.insert(rawActivity).values(fresh).$returningId();
  return fresh.flatMap((item, index) => {
    const id = ids[index]?.id;
    return id !== undefined ? [{ ...item, id }] : [];
  });
}
