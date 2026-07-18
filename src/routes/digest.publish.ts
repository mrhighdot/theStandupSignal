import { desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { getDb } from "@db/client";
import { digests } from "@db/schema";
import { publishToDiscord } from "@lib/discord";
import type { DigestPayload } from "@standup-types/digest.types";

export const digestPublishRoute = new Hono();

digestPublishRoute.post("/", async (c) => {
  const db = getDb();
  const latest = (await db.select().from(digests).orderBy(desc(digests.digestDate)).limit(1))[0];
  if (!latest) return c.json({ error: "Generate a digest before publishing." }, 404);
  const payload = JSON.parse(latest.payloadJson) as DigestPayload;
  const content = [`Standup Signal — ${payload.date}`, ...payload.people.map((person) => `${person.member}: ${person.summary}${person.blockerStatus === "repeat" ? ` ⚠ repeat blocker (${person.repeatCount} days): ${person.blockerDescription}` : person.blockerStatus === "new" ? ` • blocker: ${person.blockerDescription}` : ""}`)].join("\n");
  await publishToDiscord(content);
  await db.update(digests).set({ publishedAt: new Date() }).where(eq(digests.id, latest.id));
  return c.json({ published: true, digestDate: payload.date });
});
