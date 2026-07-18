import { and, eq, inArray, lt } from "drizzle-orm";
import { getDb } from "@db/client";
import { blockers } from "@db/schema";
import type { BlockerRecord, BlockerStatus, DetectedBlocker } from "@standup-types/blocker.types";

/** Persists today's model-approved blocker and increments its signal when the canonical key repeats. */
export async function recordDetectedBlocker(memberId: number, detected: DetectedBlocker | null, digestDate: string): Promise<{ status: BlockerStatus; repeatCount: number }> {
  if (!detected) return { status: "none", repeatCount: 0 };
  const db = getDb();
  const existing = await db.select().from(blockers).where(and(eq(blockers.memberId, memberId), eq(blockers.normalizedKey, detected.normalizedKey), eq(blockers.stillOpen, true))).limit(1);
  const match = existing[0];
  if (!match) {
    await db.insert(blockers).values({ memberId, description: detected.description, normalizedKey: detected.normalizedKey, firstSeenDate: digestDate, lastSeenDate: digestDate, stillOpen: true, repeatCount: 1 });
    return { status: "new", repeatCount: 1 };
  }
  // Regeneration is safe: rerunning today's digest must not make a blocker look older.
  if (match.lastSeenDate === digestDate) {
    await db.update(blockers).set({ description: detected.description }).where(eq(blockers.id, match.id));
    return { status: match.repeatCount > 1 ? "repeat" : "new", repeatCount: match.repeatCount };
  }
  const repeatCount = match.repeatCount + 1;
  await db.update(blockers).set({ description: detected.description, lastSeenDate: digestDate, repeatCount }).where(eq(blockers.id, match.id));
  return { status: "repeat", repeatCount };
}

/** Closes blockers absent across two digest dates, preserving a grace run for unmentioned resolutions. */
export async function closeStaleBlockers(memberIds: number[], digestDate: string): Promise<void> {
  if (memberIds.length === 0) return;
  const db = getDb();
  const graceCutoff = new Date(`${digestDate}T00:00:00.000Z`);
  graceCutoff.setUTCDate(graceCutoff.getUTCDate() - 1);
  const cutoff = graceCutoff.toISOString().slice(0, 10);
  await db.update(blockers).set({ stillOpen: false }).where(and(inArray(blockers.memberId, memberIds), eq(blockers.stillOpen, true), lt(blockers.lastSeenDate, cutoff)));
}

/** Maps database rows to the portable blocker contract used by routes and page rendering. */
export function toBlockerRecord(row: typeof blockers.$inferSelect): BlockerRecord {
  return { id: row.id, memberId: row.memberId, description: row.description, normalizedKey: row.normalizedKey, firstSeenDate: row.firstSeenDate, lastSeenDate: row.lastSeenDate, stillOpen: row.stillOpen, repeatCount: row.repeatCount };
}
