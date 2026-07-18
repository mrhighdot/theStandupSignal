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
