import { and, eq, ne } from "drizzle-orm";
import { getDb } from "@db/client";
import { workSignals } from "@db/schema";
import type { ActivityInput } from "@standup-types/activity.types";
import type { WorkSignalInput, WorkSignalType } from "@standup-types/work-signal.types";

const patterns: Array<{ type: WorkSignalType; expression: RegExp }> = [
  { type: "assignment", expression: /\b(?:assigned|owner(?:ship)?|you take|i'?ll take)\b/i },
  { type: "acknowledgement", expression: /\b(?:on it|acknowledged|i'?ve got this|will do)\b/i },
  { type: "progress", expression: /\b(?:working on|in progress|started|making progress)\b/i },
  { type: "blocker", expression: /\b(?:blocked|blocking|can'?t proceed|waiting on)\b/i },
  { type: "review_request", expression: /\b(?:please review|ready for review|review requested)\b/i },
  { type: "completion", expression: /\b(?:done|completed|shipped|merged|fixed)\b/i },
];

/** Extracts explicit coordination language so integrations can persist useful signals without guessing at intent. */
export function extractExplicitWorkSignals(activity: ActivityInput): WorkSignalInput[] {
  return patterns.filter(({ expression }) => expression.test(activity.content)).map(({ type }) => ({
    memberId: activity.memberId,
    source: activity.source,
    type,
    description: activity.content,
    taskKey: extractTaskKey(activity.content),
    confidence: "medium",
    occurredAt: activity.occurredAt,
  }));
}

/** Pulls a visible issue or PR identifier when present, leaving task matching to a later AI-assisted pass. */
function extractTaskKey(content: string): string | undefined {
  const match = content.match(/(?:#|\b)([A-Z][A-Z0-9]+-\d+|\d{1,6})\b/);
  return match?.[1]?.toLowerCase();
}

/** Extracts and persists work signals for newly synced activity, then resolves anything a completion satisfies. */
export async function persistWorkSignals(activities: Array<ActivityInput & { id: number }>): Promise<void> {
  const signals = activities.flatMap((activity) =>
    extractExplicitWorkSignals(activity).map((signal) => ({ ...signal, rawActivityId: activity.id })),
  );
  if (!signals.length) return;
  await getDb().insert(workSignals).values(signals);
  await resolveCompletedSignals(signals);
}

/** Closes open signals sharing a completion's task key, since a completion supersedes prior coordination on that task. */
async function resolveCompletedSignals(signals: WorkSignalInput[]): Promise<void> {
  const completions = signals.filter((signal): signal is WorkSignalInput & { taskKey: string } => signal.type === "completion" && !!signal.taskKey);
  for (const completion of completions) {
    await getDb().update(workSignals).set({ status: "resolved", resolvedAt: completion.occurredAt }).where(and(eq(workSignals.taskKey, completion.taskKey), eq(workSignals.status, "open"), ne(workSignals.type, "completion")));
  }
}
