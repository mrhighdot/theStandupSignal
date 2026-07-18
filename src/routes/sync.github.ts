import { Hono } from "hono";
import { getDb } from "@db/client";
import { rawActivity, teamMembers } from "@db/schema";
import { fetchGitHubActivity } from "@lib/github";

export const githubSyncRoute = new Hono();

githubSyncRoute.get("/", async (c) => {
  const db = getDb();
  const members = await db.select().from(teamMembers);
  const idsByHandle = new Map(members.flatMap((member) => member.githubHandle ? [[member.githubHandle.toLowerCase(), member.id] as const] : []));
  const activity = await fetchGitHubActivity(idsByHandle, new Date(Date.now() - 24 * 60 * 60 * 1000));
  if (activity.length) await db.insert(rawActivity).values(activity);
  return c.json({ synced: activity.length, source: "github" });
});
