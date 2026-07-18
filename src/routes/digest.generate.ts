import { and, eq, gte } from "drizzle-orm";
import { Hono } from "hono";
import { getDb } from "@db/client";
import { blockers, digests, rawActivity, teamMembers, workSignals } from "@db/schema";
import { summarizeMember } from "@lib/ai";
import { closeStaleBlockers, recordDetectedBlocker } from "@lib/blockers";
import type { DigestPayload, DigestPerson } from "@standup-types/digest.types";

export const digestGenerateRoute = new Hono();

digestGenerateRoute.post("/", async (c) => {
  const db = getDb();
  const date = c.req.query("date") ?? new Date().toISOString().slice(0, 10);
  const since = new Date(`${date}T00:00:00.000Z`);
  const members = await db.select().from(teamMembers);
  const people: DigestPerson[] = [];
  for (const member of members) {
    const activity = await db.select().from(rawActivity).where(and(eq(rawActivity.memberId, member.id), gte(rawActivity.occurredAt, since)));
    const previous = await db.select().from(blockers).where(and(eq(blockers.memberId, member.id), eq(blockers.stillOpen, true)));
    const openSignals = await db.select().from(workSignals).where(and(eq(workSignals.memberId, member.id), eq(workSignals.status, "open")));
    let ai;
    try {
      ai = await summarizeMember({ member: member.displayName, activity: activity.map((item) => ({ type: item.type, content: item.content, time: item.occurredAt.toISOString() })), yesterdaysOpenBlockers: previous.map((item) => item.description), openWorkSignals: openSignals.map((item) => item.description) });
    } catch (err) {
      console.error(`Digest generation failed while summarizing ${member.displayName} for ${date}:`, err);
      return c.json({ error: `AI summarization failed for ${member.displayName}.`, date, membersProcessed: people.length }, 502);
    }
    const blocker = ai.blockerDetected && ai.blockerDescription && ai.blockerNormalizedKey ? { description: ai.blockerDescription, normalizedKey: ai.blockerNormalizedKey, confidence: ai.confidence } : null;
    const state = await recordDetectedBlocker(member.id, blocker, date);
    people.push({ ...ai, memberId: member.id, blockerStatus: state.status, repeatCount: state.repeatCount, openWorkSignals: openSignals.map((item) => ({ type: item.type, description: item.description })) });
  }
  await closeStaleBlockers(members.map((member) => member.id), date);
  const payload: DigestPayload = { date, people, generatedAt: new Date().toISOString() };
  await db.insert(digests).values({ digestDate: date, payloadJson: JSON.stringify(payload) }).onDuplicateKeyUpdate({ set: { payloadJson: JSON.stringify(payload) } });
  return c.json(payload, 201);
});
