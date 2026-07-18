import { Hono } from "hono";
import { getDb } from "@db/client";
import { teamMembers } from "@db/schema";
import { persistNewActivity } from "@lib/activity";
import { fetchGitHubActivity } from "@lib/github";
import { persistWorkSignals } from "@lib/work-signals";

export const githubSyncRoute = new Hono();

githubSyncRoute.get("/", async (c) => {
  const db = getDb();
  const members = await db.select().from(teamMembers);
  const idsByHandle = new Map(members.flatMap((member) => member.githubHandle ? [[member.githubHandle.toLowerCase(), member.id] as const] : []));
  const activity = await fetchGitHubActivity(idsByHandle, new Date(Date.now() - 24 * 60 * 60 * 1000));
  const fresh = await persistNewActivity("github", activity);
  await persistWorkSignals(fresh);
  return c.json({ synced: fresh.length, source: "github" });
});
