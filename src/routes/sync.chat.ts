import { Hono } from "hono";
import { getDb } from "@db/client";
import { rawActivity, teamMembers } from "@db/schema";
import { fetchDiscordActivity } from "@lib/discord";

export const chatSyncRoute = new Hono();

chatSyncRoute.get("/", async (c) => {
  const db = getDb();
  const members = await db.select().from(teamMembers);
  const idsByHandle = new Map(members.flatMap((member) => member.discordHandle ? [[member.discordHandle.toLowerCase(), member.id] as const] : []));
  const activity = await fetchDiscordActivity(idsByHandle, new Date(Date.now() - 24 * 60 * 60 * 1000));
  if (activity.length) await db.insert(rawActivity).values(activity);
  return c.json({ synced: activity.length, source: "discord" });
});
