import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { getDb } from "@db/client";
import { digests } from "@db/schema";
import type { DigestPayload } from "@standup-types/digest.types";
import { digestPersonCard } from "@routes/pages/digest-view";

export const fragments = new Hono();

fragments.get("/digest/:date", async (c) => {
  const digest = (await getDb().select().from(digests).where(eq(digests.digestDate, c.req.param("date"))).limit(1))[0];
  if (!digest) return c.html("", 404);
  const payload = JSON.parse(digest.payloadJson) as DigestPayload;
  return c.html(payload.people.map(digestPersonCard).join(""));
});
