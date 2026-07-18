import { Hono } from "hono";
import { getDb } from "@db/client";
import { rawActivity, teamMembers } from "@db/schema";
import { fetchDiscordActivity } from "@lib/discord";
import { persistWorkSignals } from "@lib/work-signals";

export const chatSyncRoute = new Hono();

chatSyncRoute.get("/", async (c) => {
  const db = getDb();
  const members = await db.select().from(teamMembers);
  const idsByHandle = new Map(members.flatMap((member) => member.discordHandle ? [[member.discordHandle.toLowerCase(), member.id] as const] : []));
  const activity = await fetchDiscordActivity(idsByHandle, new Date(Date.now() - 24 * 60 * 60 * 1000));
  if (activity.length) {
    const ids = await db.insert(rawActivity).values(activity).$returningId();
    await persistWorkSignals(activity.flatMap((item, index) => {
      const id = ids[index]?.id;
      return id !== undefined ? [{ ...item, id }] : [];
    }));
  }
  return c.json({ synced: activity.length, source: "discord" });
});
