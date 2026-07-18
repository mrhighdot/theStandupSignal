import { Hono } from "hono";
import { getDb } from "@db/client";
import { teamMembers } from "@db/schema";
import { persistNewActivity } from "@lib/activity";
import { fetchDiscordActivity } from "@lib/discord";
import { persistWorkSignals } from "@lib/work-signals";

export const chatSyncRoute = new Hono();

chatSyncRoute.get("/", async (c) => {
  const db = getDb();
  const members = await db.select().from(teamMembers);
  const idsByHandle = new Map(members.flatMap((member) => member.discordHandle ? [[member.discordHandle.toLowerCase(), member.id] as const] : []));
  const activity = await fetchDiscordActivity(idsByHandle, new Date(Date.now() - 24 * 60 * 60 * 1000));
  const fresh = await persistNewActivity("discord", activity);
  await persistWorkSignals(fresh);
  return c.json({ synced: fresh.length, source: "discord" });
});
