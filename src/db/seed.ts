import { getDb } from "@db/client";
import { blockers, digests, rawActivity, teamMembers } from "@db/schema";
import type { DigestPayload } from "@standup-types/digest.types";

/** Seeds two days of realistic activity so the repeat-blocker behavior is demonstrable immediately. */
export async function seedDemoData(): Promise<void> {
  const db = getDb();
  const [gabby] = await db.insert(teamMembers).values([{ displayName: "Gabby", githubHandle: "gabby", discordHandle: "gabby" }, { displayName: "Malik", githubHandle: "malik", discordHandle: "malik" }]).$returningId();
  if (!gabby) throw new Error("Unable to create demo member.");
  const yesterday = new Date(); yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayDate = yesterday.toISOString().slice(0, 10);
  const todayDate = new Date().toISOString().slice(0, 10);
  await db.insert(rawActivity).values([{ memberId: gabby.id, source: "github", type: "commit", content: "Add ticket module API", occurredAt: yesterday }, { memberId: gabby.id, source: "discord", type: "chat_message", content: "Still waiting on the ticket UI design review before I can proceed.", occurredAt: new Date() }]);
  await db.insert(blockers).values({ memberId: gabby.id, description: "Waiting on design review for ticket UI", normalizedKey: "design-review-ticket-ui", firstSeenDate: yesterdayDate, lastSeenDate: todayDate, stillOpen: true, repeatCount: 2 });
  const payload: DigestPayload = { date: todayDate, generatedAt: new Date().toISOString(), people: [{ memberId: gabby.id, member: "Gabby", summary: "Shipped the ticketing module API and is waiting to continue UI work.", blockerDetected: true, blockerDescription: "Waiting on design review for ticket UI", blockerNormalizedKey: "design-review-ticket-ui", matchesYesterday: true, confidence: "high", blockerStatus: "repeat", repeatCount: 2, openWorkSignals: [] }] };
  await db.insert(digests).values({ digestDate: todayDate, payloadJson: JSON.stringify(payload) }).onDuplicateKeyUpdate({ set: { payloadJson: JSON.stringify(payload) } });
}

if (import.meta.main) {
  await seedDemoData();
  console.log("Seeded Standup Signal demo data.");
}
