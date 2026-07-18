import { desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { getDb } from "@db/client";
import { blockers, digests, teamMembers } from "@db/schema";
import { workSignals } from "@db/schema";
import { toBlockerRecord } from "@lib/blockers";
import { chatSyncRoute } from "@routes/sync.chat";
import { digestGenerateRoute } from "@routes/digest.generate";
import { digestPublishRoute } from "@routes/digest.publish";
import { githubSyncRoute } from "@routes/sync.github";

export const api = new Hono();

api.route("/sync/github", githubSyncRoute);
api.route("/sync/chat", chatSyncRoute);
api.route("/digest/generate", digestGenerateRoute);
api.route("/digest/publish", digestPublishRoute);

api.get("/digest/:date", async (c) => {
  const digest = (await getDb().select().from(digests).where(eq(digests.digestDate, c.req.param("date"))).limit(1))[0];
  return digest ? c.json(JSON.parse(digest.payloadJson)) : c.json({ error: "Digest not found." }, 404);
});

api.get("/blockers/active", async (c) => {
  const rows = await getDb().select({ blocker: blockers, member: teamMembers }).from(blockers).innerJoin(teamMembers, eq(blockers.memberId, teamMembers.id)).where(eq(blockers.stillOpen, true)).orderBy(desc(blockers.repeatCount));
  return c.json(rows.map(({ blocker, member }) => ({ ...toBlockerRecord(blocker), member: member.displayName })));
});

api.get("/signals/open", async (c) => {
  const rows = await getDb().select({ signal: workSignals, member: teamMembers }).from(workSignals).innerJoin(teamMembers, eq(workSignals.memberId, teamMembers.id)).where(eq(workSignals.status, "open")).orderBy(desc(workSignals.occurredAt));
  return c.json(rows.map(({ signal, member }) => ({ ...signal, member: member.displayName })));
});
